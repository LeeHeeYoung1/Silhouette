package com.app.silhouette.ticket;

import java.util.List;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TicketDAO {
    private final SqlSessionTemplate mybatis;

    public TicketDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    public List<TicketProductDTO> selectProducts() {
        return mybatis.selectList("Ticket.selectProducts");
    }

    public TicketProductDTO selectProduct(Long ticketProductSeq) {
        return mybatis.selectOne("Ticket.selectProduct", ticketProductSeq);
    }

    public void createWalletIfAbsent(Long memberSeq) {
        mybatis.insert("Ticket.createWalletIfAbsent", memberSeq);
    }

    public MemberWalletDTO selectWallet(Long memberSeq) {
        return mybatis.selectOne("Ticket.selectWallet", memberSeq);
    }

    public MemberWalletDTO selectWalletForUpdate(Long memberSeq) {
        return mybatis.selectOne("Ticket.selectWalletForUpdate", memberSeq);
    }

    public void insertPendingPayment(PaymentDTO paymentDTO) {
        mybatis.insert("Ticket.insertPendingPayment", paymentDTO);
    }

    public PaymentDTO selectPaymentForUpdate(PaymentDTO paymentDTO) {
        return mybatis.selectOne("Ticket.selectPaymentForUpdate", paymentDTO);
    }

    public int markPaymentPaid(PaymentDTO paymentDTO) {
        return mybatis.update("Ticket.markPaymentPaid", paymentDTO);
    }

    // 원장 기준 현재 잔액 (출석·이벤트와 같은 방식: 가장 최근 BALANCE_AFTER)
    public int selectLatestMileageBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne("Ticket.selectLatestMileageBalance", memberSeq);
        return balance == null ? 0 : balance;
    }

    public int selectLatestTicketBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne("Ticket.selectLatestTicketBalance", memberSeq);
        return balance == null ? 0 : balance;
    }

    // MEMBER_WALLET을 원장 잔액과 같게 맞춤
    public void syncWallet(MemberWalletDTO walletDTO) {
        mybatis.update("Ticket.syncWallet", walletDTO);
    }

    public void insertTicketLedger(TicketLedgerDTO ledgerDTO) {
        mybatis.insert("Ticket.insertTicketLedger", ledgerDTO);
    }

    public void insertMileageLedger(MileageLedgerDTO ledgerDTO) {
        mybatis.insert("Ticket.insertMileageLedger", ledgerDTO);
    }

    public List<PaymentDTO> selectPaymentsByMemberSeq(Long memberSeq) {
        return mybatis.selectList("Ticket.selectPaymentsByMemberSeq", memberSeq);
    }

    public int markPaymentCancelled(Long paymentSeq) {
        return mybatis.update("Ticket.markPaymentCancelled", paymentSeq);
    }

    public void insertPaymentCancel(PaymentCancelDTO cancelDTO) {
        mybatis.insert("Ticket.insertPaymentCancel", cancelDTO);
    }
}