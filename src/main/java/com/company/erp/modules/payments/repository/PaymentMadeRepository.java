package com.company.erp.modules.payments.repository;

import com.company.erp.modules.payments.entity.PaymentMade;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentMadeRepository extends JpaRepository<PaymentMade, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentMade p WHERE p.id = :id")
    Optional<PaymentMade> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByPaymentNumber(String paymentNumber);
}
