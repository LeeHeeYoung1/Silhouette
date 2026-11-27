package com.app.silhouette.ticket;

import java.util.Date;

public class MemberWalletDTO {
    private Long memberWalletSeq;
    private Long memberSeq;
    private int ticketBalance;
    private int mileageBalance;
    private Date updatedAt;

    public Long getMemberWalletSeq() { return memberWalletSeq; }
    public void setMemberWalletSeq(Long memberWalletSeq) { this.memberWalletSeq = memberWalletSeq; }
    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }
    public int getTicketBalance() { return ticketBalance; }
    public void setTicketBalance(int ticketBalance) { this.ticketBalance = ticketBalance; }
    public int getMileageBalance() { return mileageBalance; }
    public void setMileageBalance(int mileageBalance) { this.mileageBalance = mileageBalance; }
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
