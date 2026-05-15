package com.parknow.vehiclerental.repository;

import com.parknow.vehiclerental.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
}
