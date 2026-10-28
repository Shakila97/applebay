package com.applebay.backend.service;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.entity.AttendanceSession;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.entity.Student;

import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.AttendanceSessionRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudentCheckInService {

    private final StudentProfileService profiles;
    private final AttendanceSessionRepository sessions;
    private final EnrolmentRepository enrolments;
    private final AttendanceRepository attendance;

    public StudentCheckInService(
            StudentProfileService profiles,
            AttendanceSessionRepository sessions,
            EnrolmentRepository enrolments,
            AttendanceRepository attendance) {

        this.profiles = profiles;
        this.sessions = sessions;
        this.enrolments = enrolments;
        this.attendance = attendance;
    }

    public record CheckInResponse(
            Long attendanceId,
            LocalDate date,
            Attendance.Status status,
            boolean alreadyMarked) {
    }

    public record OpenSessionView(
            Long sessionId,
            Long courseId,
            String courseName,
            LocalDate sessionDate,
            Instant closesAt,
            String attendanceStatus) {
    }

    @Transactional(readOnly = true)
    public List<OpenSessionView> getMyOpenSessions(String email) {

        Student student = profiles.getProfile(email);

        List<Enrolment> myEnrolments =
                enrolments.findByStudent_Id(student.getId());

        if (myEnrolments.isEmpty()) {
            return List.of();
        }

        // Course ID එකට අදාළ Student enrolment එක තබාගන්න.
        Map<Long, Enrolment> enrolmentsByCourse = new HashMap<>();

        for (Enrolment enrolment : myEnrolments) {
            enrolmentsByCourse.put(
                    enrolment.getCourse().getId(),
                    enrolment);
        }

        Instant now = Instant.now();

        List<AttendanceSession> openSessions = sessions
                .findByCourse_IdInAndStatusAndOpensAtLessThanEqualAndClosesAtGreaterThan(
                        enrolmentsByCourse.keySet(),
                        AttendanceSession.Status.OPEN,
                        now,
                        now);

        List<OpenSessionView> result = new ArrayList<>();

        for (AttendanceSession session : openSessions) {
            Enrolment enrolment = enrolmentsByCourse.get(
                    session.getCourse().getId());

            String mark = attendance
                    .findByEnrolment_IdAndAttendanceDate(
                            enrolment.getId(),
                            session.getSessionDate())
                    .map(record -> record.getStatus().name())
                    .orElse("Unmarked");

            result.add(new OpenSessionView(
                    session.getId(),
                    session.getCourse().getId(),
                    session.getCourse().getName(),
                    session.getSessionDate(),
                    session.getClosesAt(),
                    mark));
        }

        return result;
    }

    @Transactional
    public CheckInResponse checkIn(String email, Long sessionId) {

        Student student = profiles.getProfile(email);

        AttendanceSession session = sessions
                .findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Attendance session not found"));

        Long courseId = session.getCourse().getId();

        Enrolment enrolment = enrolments
                .findByStudent_IdAndCourse_Id(
                        student.getId(), courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not enrolled in this course"));

        Instant now = Instant.now();

        if (session.getStatus() != AttendanceSession.Status.OPEN
                || now.isBefore(session.getOpensAt())
                || !now.isBefore(session.getClosesAt())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance check-in is closed");
        }

        var existing = attendance
                .findByEnrolment_IdAndAttendanceDate(
                        enrolment.getId(),
                        session.getSessionDate());

        if (existing.isPresent()) {
            Attendance mark = existing.get();

            if (mark.getStatus() == Attendance.Status.Absent) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Attendance is already marked Absent. Contact your lecturer");
            }

            return new CheckInResponse(
                    mark.getId(),
                    mark.getAttendanceDate(),
                    mark.getStatus(),
                    true);
        }

        Attendance mark = new Attendance();
        mark.setEnrolment(enrolment);
        mark.setAttendanceDate(session.getSessionDate());
        mark.setStatus(Attendance.Status.Present);

        try {
            Attendance saved = attendance.saveAndFlush(mark);

            return new CheckInResponse(
                    saved.getId(),
                    saved.getAttendanceDate(),
                    saved.getStatus(),
                    false);

        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance could not be saved. Refresh and check your record");
        }
    }
}
