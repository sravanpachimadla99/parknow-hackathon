package com.parknow.vehiclerental.config;

import com.parknow.vehiclerental.model.Segment;
import com.parknow.vehiclerental.model.Vehicle;
import com.parknow.vehiclerental.repository.VehicleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataLoader implements ApplicationRunner {
    private final VehicleRepository vehicleRepository;

    public DataLoader(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (vehicleRepository.count() > 0) {
            return;
        }

        vehicleRepository.saveAll(List.of(
                new Vehicle("Hyundai Creta", Segment.COMPACT, 5, 3200, "Hyderabad, Telangana", "/images/telangana-suv.svg"),
                new Vehicle("Mahindra XUV700", Segment.PREMIUM, 7, 4500, "Secunderabad, Telangana", "/images/telangana-premium.svg"),
                new Vehicle("Maruti Swift", Segment.ECONOMY, 5, 1800, "Nalgonda, Telangana", "/images/telangana-hatchback.svg"),
                new Vehicle("Bajaj RE Auto", Segment.ECONOMY, 3, 900, "Charminar, Telangana", "/images/telangana-auto.svg")
        ));
    }
}
