package com.app.silhouette.ticket;

import java.util.Date;

public class PaymentCancelDTO {
    private Long paymentCancelSeq;
    private Long paymentSeq;
    private String pgCancelId;
    private int cancelAmount;
    private String cancelReason;
    private Date cancelledAt;

    public Long getPaymentCancelSeq() { return paymentCancelSeq; }
    public void setPaymentCancelSeq(Long paymentCancelSeq) { this.paymentCancelSeq = paymentCancelSeq; }
    public Long getPaymentSeq() { return paymentSeq; }
    public void setPaymentSeq(Long paymentSeq) { this.paymentSeq = paymentSeq; }
    public String getPgCancelId() { return pgCancelId; }
    public void setPgCancelId(String pgCancelId) { this.pgCancelId = pgCancelId; }
    public int getCancelAmount() { return cancelAmount; }
    public void setCancelAmount(int cancelAmount) { this.cancelAmount = cancelAmount; }
    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
    public Date getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Date cancelledAt) { this.cancelledAt = cancelledAt; }
}
