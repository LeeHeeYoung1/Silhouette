package com.app.silhouette.ticket;

import java.util.Date;

public class MileageLedgerDTO {
    private Long mileageLedgerSeq;
    private Long memberSeq;
    private Long paymentSeq;
    private String sourceType;
    private int changeAmount;
    private int balanceAfter;
    private String description;
    private Date createdAt;

    public Long getMileageLedgerSeq() { return mileageLedgerSeq; }
    public void setMileageLedgerSeq(Long mileageLedgerSeq) { this.mileageLedgerSeq = mileageLedgerSeq; }
    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }
    public Long getPaymentSeq() { return paymentSeq; }
    public void setPaymentSeq(Long paymentSeq) { this.paymentSeq = paymentSeq; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public int getChangeAmount() { return changeAmount; }
    public void setChangeAmount(int changeAmount) { this.changeAmount = changeAmount; }
    public int getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(int balanceAfter) { this.balanceAfter = balanceAfter; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
