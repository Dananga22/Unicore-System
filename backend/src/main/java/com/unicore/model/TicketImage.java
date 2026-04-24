package com.unicore.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(nullable = false)
    private String imageUrl;

    private String originalFileName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
