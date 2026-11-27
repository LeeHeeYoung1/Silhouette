package com.app.silhouette.ticket;

import java.util.Date;

public class PaymentDTO {
    private Long paymentSeq;
    private Long memberSeq;
    private Long ticketProductSeq;
    private String pgTransactionId;
    private String paymentMethod;
    private int productPrice;
    private int mileageUsed;
    private int paymentAmount;
    private int ticketCount;
    private String paymentStatus;
    private String productName;
    private Date paidAt;
    private Date createdAt;

    public Long getPaymentSeq() { return paymentSeq; }
    public void setPaymentSeq(Long paymentSeq) { this.paymentSeq = paymentSeq; }
    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }
    public Long getTicketProductSeq() { return ticketProductSeq; }
    public void setTicketProductSeq(Long ticketProductSeq) { this.ticketProductSeq = ticketProductSeq; }
    public String getPgTransactionId() { return pgTransactionId; }
    public void setPgTransactionId(String pgTransactionId) { this.pgTransactionId = pgTransactionId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public int getProductPrice() { return productPrice; }
    public void setProductPrice(int productPrice) { this.productPrice = productPrice; }
    public int getMileageUsed() { return mileageUsed; }
    public void setMileageUsed(int mileageUsed) { this.mileageUsed = mileageUsed; }
    public int getPaymentAmount() { return paymentAmount; }
    public void setPaymentAmount(int paymentAmount) { this.paymentAmount = paymentAmount; }
    public int getTicketCount() { return ticketCount; }
    public void setTicketCount(int ticketCount) { this.ticketCount = ticketCount; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public Date getPaidAt() { return paidAt; }
    public void setPaidAt(Date paidAt) { this.paidAt = paidAt; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}