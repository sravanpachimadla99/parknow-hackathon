package com.parknow.vehiclerental.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    public PaymentService(@Value("${stripe.apiKey}") String stripeApiKey) {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("Stripe API key must be configured in stripe.apiKey");
        }
        Stripe.apiKey = stripeApiKey;
    }

    public String createCheckoutSession(Long vehicleId, String customerName, String email, int days, int amount) throws StripeException {
        long amountInPaise = amount * 100L;
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:5173/?success=true&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://localhost:5173/?cancel=true")
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("inr")
                                .setUnitAmount(amountInPaise)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Vehicle booking")
                                        .setDescription(String.format("%s day(s) booking", days))
                                        .build())
                                .build())
                        .build())
                .putMetadata("vehicleId", String.valueOf(vehicleId))
                .putMetadata("customerName", customerName)
                .putMetadata("email", email)
                .putMetadata("days", String.valueOf(days))
                .build();

        Session session = Session.create(params);
        return session.getId();
    }

    public Session retrieveSession(String sessionId) throws StripeException {
        return Session.retrieve(sessionId);
    }
}
