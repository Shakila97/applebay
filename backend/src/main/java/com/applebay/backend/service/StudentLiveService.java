package com.applebay.backend.service;

import com.applebay.backend.entity.AttendanceSession;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.AttendanceSessionRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentLiveService {

    private final StudentProfileService profiles;
    private final EnrolmentRepository enrolments;
    private final AttendanceSessionRepository sessions;
    private final AttendanceRepository attendance;
    private final LiveSessionEvents events;

    public StudentLiveService(
            StudentProfileService profiles,
            EnrolmentRepository enrolments,
            AttendanceSessionRepository sessions,
            AttendanceRepository attendance,
            LiveSessionEvents events) {

        this.profiles = profiles;
        this.enrolments = enrolments;
        this.sessions = sessions;
        this.attendance = attendance;
        this.events = events;
    }

    public enum SessionState {
        SCHEDULED,
        ACTIVE,
        COMPLETED
    }

    public record CourseInfo(
            Long id,
            String code,
            String name,
            String level,
            String duration) {
    }

    public record SessionInfo(
            Long id,
            SessionState state,
            Instant opensAt,
            Instant closesAt,
            String myMark) {
    }

    public record CourseLive(
            CourseInfo course,
            SessionInfo session) {
    }

    // serverTime lets the browser correct for a wrong local clock.
    public record LiveDashboard(
            Instant serverTime,
            List<CourseLive> courses) {
    }

    static SessionState stateOf(AttendanceSession session, Instant now) {
        if (session.getStatus() == AttendanceSession.Status.CLOSED
                || !now.isBefore(session.getClosesAt())) {
            return SessionState.COMPLETED;
        }

        return now.isBefore(session.getOpensAt())
                ? SessionState.SCHEDULED
                : SessionState.ACTIVE;
    }

    @Transactional(readOnly = true)
    public LiveDashboard getDashboard(String email) {
        var student = profiles.getProfile(email);
        Instant now = Instant.now();

        List<Enrolment> myEnrolments =
                enrolments.findByStudent_Id(student.getId());

        Map<Long, List<AttendanceSession>> sessionsByCourse =
                myEnrolments.isEmpty()
                        ? Map.of()
                        : sessions.findByCourse_IdIn(myEnrolments.stream()
                                        .map(e -> e.getCourse().getId())
                                        .toList())
                                .stream()
                                .collect(Collectors.groupingBy(
                                        s -> s.getCourse().getId()));

        List<CourseLive> courses = myEnrolments.stream()
                .map(enrolment -> {
                    var course = enrolment.getCourse();

                    AttendanceSession session = pickSession(
                            sessionsByCourse.getOrDefault(
                                    course.getId(), List.of()),
                            now);

                    return new CourseLive(
                            new CourseInfo(
                                    course.getId(),
                                    course.getCode(),
                                    course.getName(),
                                    course.getLevel(),
                                    course.getDuration()),
                            session == null
                                    ? null
                                    : toInfo(session, enrolment, now));
                })
                .toList();

        return new LiveDashboard(now, courses);
    }

    @Transactional(readOnly = true)
    public SseEmitter subscribe(String email) {
        var student = profiles.getProfile(email);

        return events.subscribe(enrolments
                .findByStudent_Id(student.getId())
                .stream()
                .map(enrolment -> enrolment.getCourse().getId())
                .toList());
    }

    /**
     * The session a course card should show: the live one, otherwise the
     * next scheduled one, otherwise the most recent finished one.
     */
    private AttendanceSession pickSession(
            List<AttendanceSession> courseSessions, Instant now) {

        var active = courseSessions.stream()
                .filter(s -> stateOf(s, now) == SessionState.ACTIVE)
                .findFirst();

        if (active.isPresent()) {
            return active.get();
        }

        var upcoming = courseSessions.stream()
                .filter(s -> stateOf(s, now) == SessionState.SCHEDULED)
                .min(Comparator.comparing(AttendanceSession::getOpensAt));

        if (upcoming.isPresent()) {
            return upcoming.get();
        }

        return courseSessions.stream()
                .max(Comparator.comparing(AttendanceSession::getClosesAt))
                .orElse(null);
    }

    private SessionInfo toInfo(
            AttendanceSession session,
            Enrolment enrolment,
            Instant now) {

        String mark = attendance
                .findByEnrolment_IdAndSession_Id(
                        enrolment.getId(), session.getId())
                .or(() -> attendance.findByEnrolment_IdAndAttendanceDate(
                        enrolment.getId(), session.getSessionDate()))
                .map(record -> record.getStatus().name())
                .orElse(null);

        return new SessionInfo(
                session.getId(),
                stateOf(session, now),
                session.getOpensAt(),
                session.getClosesAt(),
                mark);
    }
}
