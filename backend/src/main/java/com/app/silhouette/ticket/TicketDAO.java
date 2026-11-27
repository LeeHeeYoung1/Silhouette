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

    public void updateWallet(MemberWalletDTO walletDTO) {
        mybatis.update("Ticket.updateWallet", walletDTO);
    }

    public void insertTicketLedger(TicketLedgerDTO ledgerDTO) {
        mybatis.insert("Ticket.insertTicketLedger", ledgerDTO);
    }

    public void insertMileageLedger(MileageLedgerDTO ledgerDTO) {
        mybatis.insert("Ticket.insertMileageLedger", ledgerDTO);
    }
}