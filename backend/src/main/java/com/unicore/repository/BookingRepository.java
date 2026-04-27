package com.unicore.repository;

import com.unicore.model.Booking;
import com.unicore.model.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);
    List<Booking> findByResourceId(Long resourceId);
    List<Booking> findByStatus(BookingStatus status);
    void deleteByUserId(Long userId);

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

    List<Booking> findByDateBetween(LocalDate start, LocalDate end);

    @Query("""
           SELECT COUNT(b) > 0
           FROM Booking b
           WHERE b.resource.id = :resourceId
             AND b.date = :date
             AND b.status IN :statuses
             AND (:excludeBookingId IS NULL OR b.id <> :excludeBookingId)
             AND b.startTime < :endTime
             AND b.endTime > :startTime
           """)
    boolean existsConflictingBooking(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses,
            @Param("excludeBookingId") Long excludeBookingId
    );

    @Query("""
           SELECT b.resource.name, COUNT(b)
           FROM Booking b
           GROUP BY b.resource.name
           ORDER BY COUNT(b) DESC
           """)
    List<Object[]> findResourceUsageCounts();

    @Query("""
           SELECT function('hour', b.startTime), COUNT(b)
           FROM Booking b
           GROUP BY function('hour', b.startTime)
           ORDER BY function('hour', b.startTime)
           """)
    List<Object[]> findPeakBookingHourCounts();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND b.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.id = :userId AND b.status IN :statuses AND b.date >= :date")
    long countActiveBookings(@Param("userId") Long userId, @Param("statuses") Collection<BookingStatus> statuses, @Param("date") LocalDate date);
}
