package com.app.silhouette.ticket;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;
import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TicketService {
    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private static final long REFUND_PERIOD_MILLIS = 7L * 24 * 60 * 60 * 1000;
    private static final String CANCEL_REASON = "고객 요청 환불 (미사용 이용권)";

    private final TicketDAO ticketDAO;
    private final AuthMemberService authMemberService;
    private final RestClient restClient = RestClient.create();

    @Value("${portone.api-secret}")
    private String portoneApiSecret;

    public TicketService(TicketDAO ticketDAO, AuthMemberService authMemberService) {
        this.ticketDAO = ticketDAO;
        this.authMemberService = authMemberService;
    }

    public List<TicketProductDTO> getProducts() {
        return ticketDAO.selectProducts();
    }

    public List<PaymentDTO> getPayments(String authorization) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        return ticketDAO.selectPaymentsByMemberSeq(member.getMemberSeq());
    }

    public MemberWalletDTO getWallet(String authorization) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        return readBalances(member.getMemberSeq());
    }

    @Transactional
    public PaymentDTO prepare(String authorization, PaymentDTO paymentDTO) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        if (paymentDTO == null || paymentDTO.getTicketProductSeq() == null || paymentDTO.getMileageUsed() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 주문 정보입니다.");
        }

        TicketProductDTO product = ticketDAO.selectProduct(paymentDTO.getTicketProductSeq());
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "판매 중인 이용권 상품이 아닙니다.");
        }

        MemberWalletDTO wallet = lockAndReadBalances(member.getMemberSeq());
        int mileageUsed = paymentDTO.getMileageUsed();

        if (mileageUsed > wallet.getMileageBalance() || mileageUsed > product.getPrice()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용할 마일리지가 보유 마일리지 또는 상품 가격을 초과했습니다.");
        }

        int paymentAmount = product.getPrice() - mileageUsed;
        if (paymentAmount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "실제 결제 금액은 1원 이상이어야 합니다.");
        }

        PaymentDTO order = new PaymentDTO();
        order.setMemberSeq(member.getMemberSeq());
        order.setTicketProductSeq(product.getTicketProductSeq());
        order.setPgTransactionId("silhouette-" + UUID.randomUUID());
        order.setProductPrice(product.getPrice());
        order.setMileageUsed(mileageUsed);
        order.setPaymentAmount(paymentAmount);
        order.setTicketCount(product.getTicketCount());
        ticketDAO.insertPendingPayment(order);
        return order;
    }

    @Transactional
    public MemberWalletDTO complete(String authorization, PaymentDTO request) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        if (request == null || request.getPgTransactionId() == null || request.getPgTransactionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 번호가 없습니다.");
        }

        PaymentDTO paymentKey = new PaymentDTO();
        paymentKey.setPgTransactionId(request.getPgTransactionId());
        paymentKey.setMemberSeq(member.getMemberSeq());
        PaymentDTO payment = ticketDAO.selectPaymentForUpdate(paymentKey);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 주문을 찾을 수 없습니다.");
        }

        if ("PAID".equals(payment.getPaymentStatus())) {
            return readBalances(member.getMemberSeq());
        }
        if (!"READY".equals(payment.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "결제 처리 가능한 주문 상태가 아닙니다.");
        }

        JsonNode portonePayment;
        try {
            portonePayment = restClient.get()
                    .uri("https://api.portone.io/payments/{paymentId}", request.getPgTransactionId())
                    .header("Authorization", "PortOne " + portoneApiSecret)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PortOne 결제 정보를 조회하지 못했습니다.");
        }

        if (portonePayment == null
                || !"PAID".equals(portonePayment.path("status").asString())
                || !request.getPgTransactionId().equals(portonePayment.path("id").asString())
                || portonePayment.path("amount").path("total").asInt(-1) != payment.getPaymentAmount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 상태 또는 결제 금액 검증에 실패했습니다.");
        }

        String method = request.getPaymentMethod() == null ? "UNKNOWN" : request.getPaymentMethod().toUpperCase();
        payment.setPaymentMethod(method);
        if (ticketDAO.markPaymentPaid(payment) != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 결제입니다.");
        }

        MemberWalletDTO wallet = lockAndReadBalances(member.getMemberSeq());
        if (wallet.getMileageBalance() < payment.getMileageUsed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "마일리지 잔액이 변경되었습니다. 고객센터에 문의해 주세요.");
        }

        int rewardMileage = payment.getPaymentAmount() / 100;
        int nextTicketBalance = wallet.getTicketBalance() + payment.getTicketCount();
        int nextMileageBalance = wallet.getMileageBalance() - payment.getMileageUsed() + rewardMileage;

        syncWallet(member.getMemberSeq(), nextTicketBalance, nextMileageBalance);

        TicketLedgerDTO ticketLedger = new TicketLedgerDTO();
        ticketLedger.setMemberSeq(member.getMemberSeq());
        ticketLedger.setPaymentSeq(payment.getPaymentSeq());
        ticketLedger.setSourceType("PAYMENT");
        ticketLedger.setChangeAmount(payment.getTicketCount());
        ticketLedger.setBalanceAfter(nextTicketBalance);
        ticketLedger.setDescription("이용권 구매 적립");
        ticketDAO.insertTicketLedger(ticketLedger);

        if (payment.getMileageUsed() > 0) {
            MileageLedgerDTO mileageLedger = new MileageLedgerDTO();
            mileageLedger.setMemberSeq(member.getMemberSeq());
            mileageLedger.setPaymentSeq(payment.getPaymentSeq());
            mileageLedger.setSourceType("PAYMENT");
            mileageLedger.setChangeAmount(-payment.getMileageUsed());
            mileageLedger.setBalanceAfter(wallet.getMileageBalance() - payment.getMileageUsed());
            mileageLedger.setDescription("이용권 구매 마일리지 사용");
            ticketDAO.insertMileageLedger(mileageLedger);
        }
        if (rewardMileage > 0) {
            MileageLedgerDTO mileageLedger = new MileageLedgerDTO();
            mileageLedger.setMemberSeq(member.getMemberSeq());
            mileageLedger.setPaymentSeq(payment.getPaymentSeq());
            mileageLedger.setSourceType("PAYMENT");
            mileageLedger.setChangeAmount(rewardMileage);
            mileageLedger.setBalanceAfter(nextMileageBalance);
            mileageLedger.setDescription("이용권 구매 1% 적립");
            ticketDAO.insertMileageLedger(mileageLedger);
        }

        MemberWalletDTO result = new MemberWalletDTO();
        result.setMemberSeq(member.getMemberSeq());
        result.setTicketBalance(nextTicketBalance);
        result.setMileageBalance(nextMileageBalance);
        return result;
    }

    /**
     * 결제 취소(환불)
     * 조건: 본인의 PAID 결제 / 결제 후 7일 이내 / 구매한 이용권을 사용하지 않음 / 적립 마일리지 회수 가능
     * 순서: 검증 -> DB 반영 -> PortOne 취소 호출 (PortOne 실패 시 예외로 DB 변경 전체 롤백)
     */
    @Transactional
    public MemberWalletDTO cancel(String authorization, PaymentDTO request) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        if (request == null || request.getPgTransactionId() == null || request.getPgTransactionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 번호가 없습니다.");
        }

        PaymentDTO paymentKey = new PaymentDTO();
        paymentKey.setPgTransactionId(request.getPgTransactionId());
        paymentKey.setMemberSeq(member.getMemberSeq());
        PaymentDTO payment = ticketDAO.selectPaymentForUpdate(paymentKey);
        if (payment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 내역을 찾을 수 없습니다.");
        }
        if ("CANCELLED".equals(payment.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 취소된 결제입니다.");
        }
        if (!"PAID".equals(payment.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "환불 가능한 결제 상태가 아닙니다.");
        }
        if (payment.getPaidAt() == null
                || System.currentTimeMillis() - payment.getPaidAt().getTime() > REFUND_PERIOD_MILLIS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 후 7일이 지나 환불할 수 없습니다.");
        }

        MemberWalletDTO wallet = lockAndReadBalances(member.getMemberSeq());

        int refundTicket = payment.getTicketCount();
        int returnMileage = payment.getMileageUsed();
        int rewardMileage = payment.getPaymentAmount() / 100;

        if (wallet.getTicketBalance() < refundTicket) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용한 이용권이 있어 환불할 수 없습니다.");
        }
        int nextTicketBalance = wallet.getTicketBalance() - refundTicket;
        int nextMileageBalance = wallet.getMileageBalance() + returnMileage - rewardMileage;
        if (nextMileageBalance < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "적립된 마일리지를 이미 사용해 환불할 수 없습니다.");
        }

        if (ticketDAO.markPaymentCancelled(payment.getPaymentSeq()) != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 결제입니다.");
        }

        syncWallet(member.getMemberSeq(), nextTicketBalance, nextMileageBalance);

        TicketLedgerDTO ticketLedger = new TicketLedgerDTO();
        ticketLedger.setMemberSeq(member.getMemberSeq());
        ticketLedger.setPaymentSeq(payment.getPaymentSeq());
        ticketLedger.setSourceType("PAYMENT_CANCEL");
        ticketLedger.setChangeAmount(-refundTicket);
        ticketLedger.setBalanceAfter(nextTicketBalance);
        ticketLedger.setDescription("이용권 구매 취소 회수");
        ticketDAO.insertTicketLedger(ticketLedger);

        int runningMileage = wallet.getMileageBalance();
        if (returnMileage > 0) {
            runningMileage += returnMileage;
            MileageLedgerDTO mileageLedger = new MileageLedgerDTO();
            mileageLedger.setMemberSeq(member.getMemberSeq());
            mileageLedger.setPaymentSeq(payment.getPaymentSeq());
            mileageLedger.setSourceType("PAYMENT_CANCEL");
            mileageLedger.setChangeAmount(returnMileage);
            mileageLedger.setBalanceAfter(runningMileage);
            mileageLedger.setDescription("이용권 구매 취소 마일리지 반환");
            ticketDAO.insertMileageLedger(mileageLedger);
        }
        if (rewardMileage > 0) {
            runningMileage -= rewardMileage;
            MileageLedgerDTO mileageLedger = new MileageLedgerDTO();
            mileageLedger.setMemberSeq(member.getMemberSeq());
            mileageLedger.setPaymentSeq(payment.getPaymentSeq());
            mileageLedger.setSourceType("PAYMENT_CANCEL");
            mileageLedger.setChangeAmount(-rewardMileage);
            mileageLedger.setBalanceAfter(runningMileage);
            mileageLedger.setDescription("이용권 구매 취소 적립 마일리지 회수");
            ticketDAO.insertMileageLedger(mileageLedger);
        }

        // 마지막 단계: PortOne 결제 취소 (실패하면 위 DB 변경은 모두 롤백)
        JsonNode cancelResult;
        try {
            cancelResult = restClient.post()
                    .uri("https://api.portone.io/payments/{paymentId}/cancel", payment.getPgTransactionId())
                    .header("Authorization", "PortOne " + portoneApiSecret)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("reason", CANCEL_REASON))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            log.error("PortOne 결제 취소 실패 paymentId={}", payment.getPgTransactionId(), e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PortOne 결제 취소에 실패했습니다.");
        }

        String pgCancelId = null;
        if (cancelResult != null) {
            JsonNode cancellation = cancelResult.path("cancellation");
            pgCancelId = cancellation.path("pgCancellationId").asString();
            if (pgCancelId == null || pgCancelId.isBlank()) {
                pgCancelId = cancellation.path("id").asString();
            }
        }
        if (pgCancelId == null || pgCancelId.isBlank()) {
            pgCancelId = payment.getPgTransactionId();
        }

        PaymentCancelDTO cancelDTO = new PaymentCancelDTO();
        cancelDTO.setPaymentSeq(payment.getPaymentSeq());
        cancelDTO.setPgCancelId(pgCancelId);
        cancelDTO.setCancelAmount(payment.getPaymentAmount());
        cancelDTO.setCancelReason(CANCEL_REASON);
        ticketDAO.insertPaymentCancel(cancelDTO);

        MemberWalletDTO result = new MemberWalletDTO();
        result.setMemberSeq(member.getMemberSeq());
        result.setTicketBalance(nextTicketBalance);
        result.setMileageBalance(nextMileageBalance);
        return result;
    }

    /*
     * 잔액의 기준은 원장(MILEAGE_LEDGER · TICKET_LEDGER)의 가장 최근 BALANCE_AFTER
     * - 출석체크 · 룰렛 · 이벤트 보상과 같은 기준이라, 이벤트로 받은 마일리지·이용권도 결제에 함께 반영됨
     * - MEMBER_WALLET은 회원별 잠금(FOR UPDATE) 용도 + 원장 잔액을 옮겨 두는 보조 테이블
     */

    // 결제 · 취소용: 회원 지갑 행을 잠가 동시 결제/취소가 같은 잔액으로 계산되지 않게 한 뒤 원장 잔액을 읽음
    private MemberWalletDTO lockAndReadBalances(Long memberSeq) {
        ticketDAO.createWalletIfAbsent(memberSeq);
        ticketDAO.selectWalletForUpdate(memberSeq);
        return readBalances(memberSeq);
    }

    // 조회용: 원장 기준 현재 잔액
    private MemberWalletDTO readBalances(Long memberSeq) {
        MemberWalletDTO balances = new MemberWalletDTO();
        balances.setMemberSeq(memberSeq);
        balances.setTicketBalance(ticketDAO.selectLatestTicketBalance(memberSeq));
        balances.setMileageBalance(ticketDAO.selectLatestMileageBalance(memberSeq));
        return balances;
    }

    // 원장에 기록한 뒤 MEMBER_WALLET도 같은 값으로 맞춤
    private void syncWallet(Long memberSeq, int ticketBalance, int mileageBalance) {
        MemberWalletDTO walletUpdate = new MemberWalletDTO();
        walletUpdate.setMemberSeq(memberSeq);
        walletUpdate.setTicketBalance(ticketBalance);
        walletUpdate.setMileageBalance(mileageBalance);
        ticketDAO.syncWallet(walletUpdate);
    }
}
