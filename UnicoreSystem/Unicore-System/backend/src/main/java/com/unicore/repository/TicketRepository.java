package com.unicore.repository;

import com.unicore.model.Ticket;
import com.unicore.model.Ticket.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByReportedById(Long userId);
    List<Ticket> findByAssignedToId(Long assignedToId);
    List<Ticket> findByStatus(TicketStatus status);

    @org.springframework.data.jpa.repository.Query("""
            SELECT t.status, COUNT(t)
            FROM Ticket t
            GROUP BY t.status
            ORDER BY t.status
            """)
    List<Object[]> findTicketStatusDistribution();
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") TicketStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Ticket t WHERE t.reportedBy.id = :userId")
    long countByReportedById(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Ticket t WHERE t.reportedBy.id = :userId AND t.status IN :statuses")
    long countByReportedByIdAndStatusIn(@Param("userId") Long userId, @Param("statuses") java.util.Collection<TicketStatus> statuses);

    List<Ticket> findByPriorityInAndStatusNotIn(java.util.Collection<com.unicore.model.Ticket.Priority> priorities, java.util.Collection<TicketStatus> statuses);
    
    long countByStatusAndPriority(TicketStatus status, com.unicore.model.Ticket.Priority priority);

    long countByPriority(com.unicore.model.Ticket.Priority priority);

    List<Ticket> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    void deleteByReportedById(Long userId);
    void deleteByAssignedToId(Long userId);
}
