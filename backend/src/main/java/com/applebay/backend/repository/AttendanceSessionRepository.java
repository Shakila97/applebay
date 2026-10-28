package com.applebay.backend.repository;

import com.applebay.backend.entity.AttendanceSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository
        extends JpaRepository<AttendanceSession, Long> {

    boolean existsByCourse_IdAndSessionDate(
            Long courseId,
            LocalDate sessionDate);

    List<AttendanceSession> findByCourse_Id(Long courseId);

    List<AttendanceSession>
    findByCourse_IdInAndStatusAndOpensAtLessThanEqualAndClosesAtGreaterThan(
            Collection<Long> courseIds,
            AttendanceSession.Status status,
            Instant opensBeforeOrAt,
            Instant closesAfter);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AttendanceSession s where s.id = :id")
    Optional<AttendanceSession> findByIdForUpdate(@Param("id") Long id);
}
