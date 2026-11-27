package com.app.silhouette.ticket;

import java.util.Date;

public class TicketProductDTO {
    private Long ticketProductSeq;
    private String productName;
    private int ticketCount;
    private int price;
    private String activeYn;
    private Date createdAt;

    public Long getTicketProductSeq() { return ticketProductSeq; }
    public void setTicketProductSeq(Long ticketProductSeq) { this.ticketProductSeq = ticketProductSeq; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getTicketCount() { return ticketCount; }
    public void setTicketCount(int ticketCount) { this.ticketCount = ticketCount; }
    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }
    public String getActiveYn() { return activeYn; }
    public void setActiveYn(String activeYn) { this.activeYn = activeYn; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}