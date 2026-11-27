package com.app.silhouette.ticket;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ticket")
public class TicketController {
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @GetMapping("/products")
    public List<TicketProductDTO> getProducts() {
        return ticketService.getProducts();
    }

    @GetMapping("/wallet")
    public MemberWalletDTO getWallet(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ticketService.getWallet(authorization);
    }

    @PostMapping("/prepare")
    public PaymentDTO prepare(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PaymentDTO paymentDTO) {
        return ticketService.prepare(authorization, paymentDTO);
    }

    @PostMapping("/complete")
    public MemberWalletDTO complete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PaymentDTO paymentDTO) {
        return ticketService.complete(authorization, paymentDTO);
    }
}