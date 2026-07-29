package com.roadrescue.api.repository;

import com.roadrescue.api.entity.ServiceRequest;
import com.roadrescue.api.entity.ServiceRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<ServiceRequest> findByMechanicIdOrderByCreatedAtDesc(Long mechanicId);
    
    @Query("SELECT r FROM ServiceRequest r WHERE r.customer.id = :customerId AND r.status NOT IN (:completed, :cancelled) ORDER BY r.createdAt DESC")
    List<ServiceRequest> findActiveRequestByCustomerId(
            @Param("customerId") Long customerId, 
            @Param("completed") RequestStatus completed, 
            @Param("cancelled") RequestStatus cancelled);

    @Query("SELECT r FROM ServiceRequest r WHERE r.mechanic.id = :mechanicId AND r.status NOT IN (:completed, :cancelled) ORDER BY r.createdAt DESC")
    List<ServiceRequest> findActiveRequestByMechanicId(
            @Param("mechanicId") Long mechanicId, 
            @Param("completed") RequestStatus completed, 
            @Param("cancelled") RequestStatus cancelled);
            
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);
}
