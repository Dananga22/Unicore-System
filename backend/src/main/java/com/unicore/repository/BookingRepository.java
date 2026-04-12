package com.unicore.repository;

import com.unicore.model.Booking;
import com.unicore.model.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);
    List<Booking> findByResourceId(Long resourceId);
    List<Booking> findByStatus(BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId AND " +
           "(:status IS NULL OR b.status = :status)")
    List<Booking> findByUserIdAndOptionalStatus(
            @Param("userId") Long userId,
            @Param("status") BookingStatus status
    );

    @Query("SELECT b FROM Booking b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:resourceId IS NULL OR b.resource.id = :resourceId) AND " +
           "(:date IS NULL OR b.date = :date)")
    List<Booking> findAllWithFilters(
            @Param("status") BookingStatus status,
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date
    );

    // Check for overlapping bookings on same resource, same date, overlapping time
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId AND b.date = :date " +
           "AND b.status = 'APPROVED' " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

}
