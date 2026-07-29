package com.roadrescue.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mechanics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mechanic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String specialty;
    private Integer experienceYears;
    private Double rating;

    @Column(name = "is_online")
    private Boolean isOnline;

    @Column(name = "is_available")
    private Boolean isAvailable;

    private Double latitude;
    private Double longitude;

    private LocalDateTime lastLocationUpdate;
}
