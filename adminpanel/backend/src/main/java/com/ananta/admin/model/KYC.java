package com.ananta.admin.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "kyc_records")
public class KYC {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private String userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "document_number", nullable = false)
    private String documentNumber;

    @Lob
    @Column(name = "document_front_image")
    private String documentFrontImage;

    @Lob
    @Column(name = "document_back_image")
    private String documentBackImage;

    @Lob
    @Column(name = "selfie_image")
    private String selfieImage;

    @Enumerated(EnumType.STRING)
    private KYCStatus status = KYCStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum DocumentType {
        AADHAR, PAN, PASSPORT, DRIVING_LICENSE
    }

    public enum KYCStatus {
        PENDING, APPROVED, REJECTED
    }
}
