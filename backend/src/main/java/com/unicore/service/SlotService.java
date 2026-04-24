package com.unicore.service;

import com.unicore.dto.SlotResponseDTO;
import com.unicore.model.AvailabilityWindow;
import com.unicore.model.Booking;
import com.unicore.model.Resource;
import com.unicore.repository.BookingRepository;
import com.unicore.repository.ResourceRepository;
import com.unicore.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SlotService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<SlotResponseDTO> getSlotsForResource(Long resourceId, LocalDate date) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Resource not found"));

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<AvailabilityWindow> windows = resource.getAvailabilityWindows().stream()
                .filter(w -> w.getDayOfWeek() == dayOfWeek)
                .toList();

        // 🔥 FIX: Fallback logic for new resources without custom schedules
        if (windows.isEmpty()) {
            // Apply fallback only for weekdays (Mon-Fri) if no specific windows are set
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                windows = new ArrayList<>();
                windows.add(AvailabilityWindow.builder()
                        .startTime(LocalTime.of(8, 0))
                        .endTime(LocalTime.of(17, 0))
                        .dayOfWeek(dayOfWeek)
                        .build());
            }
        }

        List<SlotResponseDTO> slots = new ArrayList<>();

        if (windows.isEmpty()) {
            return slots;
        }

        // Business Rule: Resource must be ACTIVE to be bookable
        boolean isResourceActive = resource.getStatus() == Resource.ResourceStatus.ACTIVE;

        List<Booking> bookings = bookingRepository.findAllWithFilters(null, resourceId, date);
        // We consider only APPROVED as booked to allow multiple pending requests
        List<Booking> activeBookings = bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.APPROVED)
                .toList();

        // Generate 1-hour slots for each window
        for (AvailabilityWindow window : windows) {
            LocalTime current = window.getStartTime();
            LocalTime end = window.getEndTime();

            while (current.isBefore(end)) {
                LocalTime next = current.plusHours(1);
                if (next.isAfter(end)) break; // avoid slots exceeding the window end

                final LocalTime slotStart = current;
                final LocalTime slotEnd = next;

                // Determine state
                String state = "AVAILABLE";

                if (!isResourceActive) {
                    state = "UNAVAILABLE";
                } else if (date.isEqual(LocalDate.now()) && slotStart.isBefore(LocalTime.now())) {
                    state = "UNAVAILABLE";
                } else if (date.isBefore(LocalDate.now())) {
                    state = "UNAVAILABLE";
                } else {
                    boolean isBooked = activeBookings.stream().anyMatch(b ->
                            (b.getStartTime().isBefore(slotEnd) && b.getEndTime().isAfter(slotStart))
                    );
                    if (isBooked) {
                        state = "BOOKED";
                    }
                }

                slots.add(SlotResponseDTO.builder()
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .state(state)
                        .build());

                current = next;
            }
        }

        return slots;
    }
}
