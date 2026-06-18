package com.ledgex.subscription.repository;

import com.ledgex.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserIdOrderByNextBillingDateAsc(Long userId);

    List<Subscription> findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(Long userId);

    Optional<Subscription> findByIdAndUserId(Long id, Long userId);
}
