package com.parknow.vehiclerental.controller;

import com.parknow.vehiclerental.model.Vehicle;
import com.parknow.vehiclerental.repository.VehicleRepository;
import com.parknow.vehiclerental.service.PaymentService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final VehicleRepository vehicleRepository;

    public PaymentController(PaymentService paymentService, VehicleRepository vehicleRepository) {
        this.paymentService = paymentService;
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckoutSession(@RequestBody CheckoutRequest request) {
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(request.getVehicleId());
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Vehicle not found."));
        }

        Vehicle vehicle = optionalVehicle.get();
        int totalAmount = vehicle.getPricePerDay() * Math.max(request.getDays(), 1);

        try {
            String sessionId = paymentService.createCheckoutSession(vehicle.getId(), request.getCustomerName(), request.getEmail(), request.getDays(), totalAmount);
            return ResponseEntity.ok(new CheckoutResponse(sessionId));
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Unable to create checkout session."));
        }
    }

    public static class CheckoutRequest {
        private Long vehicleId;
        private String customerName;
        private String email;
        private int days;

        public Long getVehicleId() {
            return vehicleId;
        }

        public void setVehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public int getDays() {
            return days;
        }

        public void setDays(int days) {
            this.days = days;
        }
    }

    public static class CheckoutResponse {
        private final String sessionId;

        public CheckoutResponse(String sessionId) {
            this.sessionId = sessionId;
        }

        public String getSessionId() {
            return sessionId;
        }
    }

    public static class ErrorResponse {
        private final String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }
    }
}
