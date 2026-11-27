package com.app.silhouette.ticket;

import java.util.List;
import java.util.UUID;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;
import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TicketService {
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

    @Transactional
    public MemberWalletDTO getWallet(String authorization) {
        AuthMemberDTO member = authMemberService.loginMember(authorization);
        ticketDAO.createWalletIfAbsent(member.getMemberSeq());
        return ticketDAO.selectWallet(member.getMemberSeq());
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

        ticketDAO.createWalletIfAbsent(member.getMemberSeq());
        MemberWalletDTO wallet = ticketDAO.selectWalletForUpdate(member.getMemberSeq());
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
            return ticketDAO.selectWallet(member.getMemberSeq());
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

        ticketDAO.createWalletIfAbsent(member.getMemberSeq());
        MemberWalletDTO wallet = ticketDAO.selectWalletForUpdate(member.getMemberSeq());
        if (wallet.getMileageBalance() < payment.getMileageUsed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "마일리지 잔액이 변경되었습니다. 고객센터에 문의해 주세요.");
        }

        int rewardMileage = payment.getPaymentAmount() / 100;
        int nextTicketBalance = wallet.getTicketBalance() + payment.getTicketCount();
        int nextMileageBalance = wallet.getMileageBalance() - payment.getMileageUsed() + rewardMileage;

        MemberWalletDTO walletUpdate = new MemberWalletDTO();
        walletUpdate.setMemberSeq(member.getMemberSeq());
        walletUpdate.setTicketBalance(payment.getTicketCount());
        walletUpdate.setMileageBalance(-payment.getMileageUsed() + rewardMileage);
        ticketDAO.updateWallet(walletUpdate);

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
}