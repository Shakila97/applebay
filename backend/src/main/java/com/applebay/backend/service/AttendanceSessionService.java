package com.applebay.backend.service;

import com.applebay.backend.entity.AppUser;
import com.applebay.backend.entity.AttendanceSession;
import com.applebay.backend.entity.Course;
import com.applebay.backend.entity.Lecturer;

import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.AttendanceSessionRepository;
import com.applebay.backend.repository.CourseLecturerRepository;
import com.applebay.backend.repository.CourseRepository;
import com.applebay.backend.repository.LecturerRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessions;
    private final AppUserRepository users;
    private final LecturerRepository lecturers;
    private final CourseRepository courses;
    private final CourseLecturerRepository assignments;
    private final LiveSessionEvents events;

    public AttendanceSessionService(
            AttendanceSessionRepository sessions,
            AppUserRepository users,
            LecturerRepository lecturers,
            CourseRepository courses,
            CourseLecturerRepository assignments,
            LiveSessionEvents events) {

        this.sessions = sessions;
        this.users = users;
        this.lecturers = lecturers;
        this.courses = courses;
        this.assignments = assignments;
        this.events = events;
    }

    public record SessionView(
            Long id,
            Long courseId,
            String courseName,
            LocalDate sessionDate,
            Instant opensAt,
            Instant closesAt,
            AttendanceSession.Status status) {
    }

    private Lecturer getLecturer(String email) {
        AppUser user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED));

        if (!user.isEnabled()
                || user.getRole() != AppUser.Role.LECTURER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return lecturers.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lecturer profile not found"));
    }

    private void checkAssignment(Long courseId, Lecturer lecturer) {
        boolean assigned = assignments
                .existsByCourse_IdAndLecturer_Id(
                        courseId, lecturer.getId());

        if (!assigned) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not assigned to this course");
        }
    }

    private SessionView toView(AttendanceSession session) {
        return new SessionView(
                session.getId(),
                session.getCourse().getId(),
                session.getCourse().getName(),
                session.getSessionDate(),
                session.getOpensAt(),
                session.getClosesAt(),
                session.getStatus());
    }

    @Transactional
    public SessionView openSession(
            String email,
            Long courseId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime) {

        if (sessionDate == null || startTime == null || endTime == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Session date, start time and end time are required");
        }

        Lecturer lecturer = getLecturer(email);
        checkAssignment(courseId, lecturer);

        Course course = courses.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Course not found"));

        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End time must be after start time on the same day");
        }

        ZoneId sriLanka = ZoneId.of("Asia/Colombo");

        Instant opensAt = ZonedDateTime.of(
                sessionDate, startTime, sriLanka).toInstant();

        Instant closesAt = ZonedDateTime.of(
                sessionDate, endTime, sriLanka).toInstant();

        if (!opensAt.isAfter(Instant.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Session start must be in the future");
        }

        if (sessions.existsByCourse_IdAndSessionDate(
                courseId, sessionDate)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A session already exists for this course on this date");
        }

        AttendanceSession session = new AttendanceSession();
        session.setCourse(course);
        session.setLecturer(lecturer);
        session.setSessionDate(sessionDate);
        session.setOpensAt(opensAt);
        session.setClosesAt(closesAt);
        session.setStatus(AttendanceSession.Status.OPEN);

        try {
            SessionView saved = toView(sessions.saveAndFlush(session));
            events.sessionChanged(courseId);
            return saved;

        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Session could not be created");
        }
    }

    @Transactional(readOnly = true)
    public List<SessionView> getCourseSessions(
            String email, Long courseId) {

        Lecturer lecturer = getLecturer(email);
        checkAssignment(courseId, lecturer);

        return sessions.findByCourse_Id(courseId)
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional
    public SessionView closeSession(String email, Long sessionId) {
        Lecturer lecturer = getLecturer(email);

        AttendanceSession session = sessions.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"));

        checkAssignment(session.getCourse().getId(), lecturer);

        session.setStatus(AttendanceSession.Status.CLOSED);

        SessionView saved = toView(sessions.save(session));
        events.sessionChanged(session.getCourse().getId());
        return saved;
    }

    /**
     * Starts a scheduled session now instead of waiting for its start time.
     * Only today's sessions can be started, so the session date still
     * matches the attendance date of every mark taken in it.
     */
    @Transactional
    public SessionView startSession(String email, Long sessionId) {
        Lecturer lecturer = getLecturer(email);

        AttendanceSession session = sessions.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"));

        checkAssignment(session.getCourse().getId(), lecturer);

        Instant now = Instant.now();

        if (StudentLiveService.stateOf(session, now)
                != StudentLiveService.SessionState.SCHEDULED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only a scheduled session can be started");
        }

        LocalDate today = now.atZone(ZoneId.of("Asia/Colombo"))
                .toLocalDate();

        if (!session.getSessionDate().equals(today)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only today's session can be started early");
        }

        session.setOpensAt(now);
        session.setStartedAt(now);

        SessionView saved = toView(sessions.save(session));
        events.sessionChanged(session.getCourse().getId());
        return saved;
    }
}
