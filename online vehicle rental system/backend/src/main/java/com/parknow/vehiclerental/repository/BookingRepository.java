package com.parknow.vehiclerental.repository;

import com.parknow.vehiclerental.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByStripeSessionId(String stripeSessionId);
}
