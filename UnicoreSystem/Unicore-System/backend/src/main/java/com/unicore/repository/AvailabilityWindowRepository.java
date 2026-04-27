package com.unicore.repository;

import com.unicore.model.AvailabilityWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilityWindowRepository extends JpaRepository<AvailabilityWindow, Long> {
    List<AvailabilityWindow> findByResourceId(Long resourceId);
}
