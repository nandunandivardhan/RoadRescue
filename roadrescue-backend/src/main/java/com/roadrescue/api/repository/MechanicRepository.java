package com.roadrescue.api.repository;

import com.roadrescue.api.entity.Mechanic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MechanicRepository extends JpaRepository<Mechanic, Long> {
    
    /**
     * Find nearby online and available mechanics using the Haversine formula.
     * This is a production-level spatial query.
     */
    @Query(value = "SELECT m.*, " +
           "(6371 * acos(cos(radians(:lat)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(m.latitude)))) AS distance " +
           "FROM mechanics m " +
           "WHERE m.is_online = true AND m.is_available = true " +
           "HAVING distance < :radius " +
           "ORDER BY distance", nativeQuery = true)
    List<Object[]> findNearbyMechanics(@Param("lat") Double lat, 
                                       @Param("lng") Double lng, 
                                       @Param("radius") Double radius);
    
    List<Mechanic> findByIsOnlineTrueAndIsAvailableTrue();
}
