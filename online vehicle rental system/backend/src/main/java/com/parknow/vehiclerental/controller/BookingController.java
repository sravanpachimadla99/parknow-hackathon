package com.parknow.vehiclerental.controller;

import com.parknow.vehiclerental.model.Booking;
import com.parknow.vehiclerental.model.Vehicle;
import com.parknow.vehiclerental.repository.BookingRepository;
import com.parknow.vehiclerental.repository.VehicleRepository;
import com.parknow.vehiclerental.service.PaymentService;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final PaymentService paymentService;

    public BookingController(VehicleRepository vehicleRepository, BookingRepository bookingRepository, PaymentService paymentService) {
        this.vehicleRepository = vehicleRepository;
        this.bookingRepository = bookingRepository;
        this.paymentService = paymentService;
    }

    @GetMapping("/confirm")
    public ResponseEntity<?> confirmBooking(@RequestParam String sessionId) {
        Optional<Booking> existingBooking = bookingRepository.findByStripeSessionId(sessionId);
        if (existingBooking.isPresent()) {
            Booking booking = existingBooking.get();
            return ResponseEntity.ok(new BookingResponse(booking.getId(), booking.getVehicleName(), booking.getDays(), booking.getTotalAmount(), "Booking already confirmed."));
        }

        try {
            Session session = paymentService.retrieveSession(sessionId);
            if (session == null || session.getPaymentStatus() == null || !session.getPaymentStatus().equalsIgnoreCase("paid")) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Payment not completed."));
            }

            String vehicleIdValue = session.getMetadata().get("vehicleId");
            String customerName = session.getMetadata().get("customerName");
            String email = session.getMetadata().get("email");
            String daysValue = session.getMetadata().get("days");

            if (vehicleIdValue == null || daysValue == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Missing booking metadata."));
            }

            Long vehicleId = Long.valueOf(vehicleIdValue);
            int days = Integer.parseInt(daysValue);
            Optional<Vehicle> optionalVehicle = vehicleRepository.findById(vehicleId);
            if (optionalVehicle.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Vehicle not found."));
            }

            Vehicle vehicle = optionalVehicle.get();
            int totalAmount = vehicle.getPricePerDay() * Math.max(days, 1);
            Booking booking = new Booking(vehicle.getId(), vehicle.getName(), customerName, email, days, totalAmount, "CONFIRMED", sessionId);
            bookingRepository.save(booking);

            return ResponseEntity.ok(new BookingResponse(booking.getId(), booking.getVehicleName(), booking.getDays(), booking.getTotalAmount(), "Payment successful and booking confirmed."));
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Unable to retrieve payment session."));
        }
    }

    public static class BookingResponse {
        private Long bookingId;
        private String vehicleName;
        private int days;
        private int totalAmount;
        private String message;

        public BookingResponse(Long bookingId, String vehicleName, int days, int totalAmount, String message) {
            this.bookingId = bookingId;
            this.vehicleName = vehicleName;
            this.days = days;
            this.totalAmount = totalAmount;
            this.message = message;
        }

        public Long getBookingId() {
            return bookingId;
        }

        public String getVehicleName() {
            return vehicleName;
        }

        public int getDays() {
            return days;
        }

        public int getTotalAmount() {
            return totalAmount;
        }

        public String getMessage() {
            return message;
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
