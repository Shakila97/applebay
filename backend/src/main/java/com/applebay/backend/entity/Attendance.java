package com.applebay.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "attendance",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"enrolment_id", "attendance_date"}
    )
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "enrolment_id", nullable = false)
    private Enrolment enrolment;

    // NULL for marks recorded outside a session (Admin attendance page).
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "session_id")
    private AttendanceSession session;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status;

    public enum Status {
        Present,
        Absent
    }

    public Attendance() {
    }

    public Long getId() {
        return id;
    }

    public Enrolment getEnrolment() {
        return enrolment;
    }

    public void setEnrolment(Enrolment enrolment) {
        this.enrolment = enrolment;
    }

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    // Serialized as "sessionId" instead of the whole session.
    public Long getSessionId() {
        return session == null ? null : session.getId();
    }

    public LocalDate getAttendanceDate() {
        return attendanceDate;
    }

    public void setAttendanceDate(LocalDate attendanceDate) {
        this.attendanceDate = attendanceDate;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}