package com.applebay.backend.service;

import com.applebay.backend.entity.AppUser;
import com.applebay.backend.entity.Attendance;
import com.applebay.backend.entity.AttendanceSession;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.entity.Lecturer;

import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.AttendanceSessionRepository;
import com.applebay.backend.repository.CourseLecturerRepository;
import com.applebay.backend.repository.EnrolmentRepository;
import com.applebay.backend.repository.LecturerRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LecturerAttendanceService {

    private final AppUserRepository users;
    private final LecturerRepository lecturers;
    private final CourseLecturerRepository assignments;
    private final AttendanceSessionRepository sessions;
    private final EnrolmentRepository enrolments;
    private final AttendanceRepository attendance;

    public LecturerAttendanceService(
            AppUserRepository users,
            LecturerRepository lecturers,
            CourseLecturerRepository assignments,
            AttendanceSessionRepository sessions,
            EnrolmentRepository enrolments,
            AttendanceRepository attendance) {

        this.users = users;
        this.lecturers = lecturers;
        this.assignments = assignments;
        this.sessions = sessions;
        this.enrolments = enrolments;
        this.attendance = attendance;
    }

    public record AttendanceRow(
            Long enrolmentId,
            String studentName,
            String nic,
            String status) {
    }

    private void checkAccess(String email, AttendanceSession session) {
        AppUser user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED));

        if (!user.isEnabled()
                || user.getRole() != AppUser.Role.LECTURER) {

            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        Lecturer lecturer = lecturers.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lecturer profile not found"));

        boolean assigned = assignments
                .existsByCourse_IdAndLecturer_Id(
                        session.getCourse().getId(),
                        lecturer.getId());

        if (!assigned) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not assigned to this course");
        }
    }

    private AttendanceRow toRow(
            Enrolment enrolment,
            Attendance mark) {

        return new AttendanceRow(
                enrolment.getId(),
                enrolment.getStudent().getName(),
                enrolment.getStudent().getNic(),
                mark == null ? "Unmarked" : mark.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<AttendanceRow> getRoster(
            String email, Long sessionId) {

        AttendanceSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"));

        checkAccess(email, session);

        return enrolments.findByCourse_Id(
                        session.getCourse().getId())
                .stream()
                .map(enrolment -> {
                    Attendance mark = attendance
                            .findByEnrolment_IdAndAttendanceDate(
                                    enrolment.getId(),
                                    session.getSessionDate())
                            .orElse(null);

                    return toRow(enrolment, mark);
                })
                .toList();
    }

    @Transactional
    public AttendanceRow markAttendance(
            String email,
            Long sessionId,
            Long enrolmentId,
            Attendance.Status status) {

        // Uses the same session lock as Student check-in.
        AttendanceSession session = sessions.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Session not found"));

        checkAccess(email, session);

        Enrolment enrolment = enrolments.findById(enrolmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Enrolment not found"));

        if (!enrolment.getCourse().getId()
                .equals(session.getCourse().getId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This student is not enrolled in the session course");
        }

        Attendance mark = attendance
                .findByEnrolment_IdAndAttendanceDate(
                        enrolmentId,
                        session.getSessionDate())
                .orElseGet(Attendance::new);

        mark.setEnrolment(enrolment);
        mark.setAttendanceDate(session.getSessionDate());
        mark.setStatus(status);

        return toRow(enrolment, attendance.save(mark));
    }
}
