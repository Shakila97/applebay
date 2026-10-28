package com.applebay.backend.service;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.entity.Enrolment;

import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.EnrolmentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LecturerReportService {

    private final LecturerCourseService lecturerCourses;
    private final EnrolmentRepository enrolments;
    private final AttendanceRepository attendance;

    public LecturerReportService(
            LecturerCourseService lecturerCourses,
            EnrolmentRepository enrolments,
            AttendanceRepository attendance) {

        this.lecturerCourses = lecturerCourses;
        this.enrolments = enrolments;
        this.attendance = attendance;
    }

    public record StudentAttendanceReport(
            Long studentId,
            String registrationNumber,
            String studentName,
            long present,
            long total,
            Double percentage) {
    }

    public record CourseAttendanceReport(
            Long courseId,
            String courseName,
            int enrolledStudents,
            List<StudentAttendanceReport> students) {
    }

    @Transactional(readOnly = true)
    public CourseAttendanceReport getAttendanceReport(
            String lecturerEmail,
            Long courseId) {

        // The logged-in lecturer must be assigned to this course.
        var course = lecturerCourses.getMyCourses(lecturerEmail)
                .stream()
                .filter(item -> item.id().equals(courseId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not assigned to this course"));

        List<Enrolment> courseEnrolments =
                enrolments.findByCourse_Id(courseId);

        List<StudentAttendanceReport> reports =
                courseEnrolments.stream()
                        .map(enrolment -> createStudentReport(
                                enrolment, courseId))
                        .toList();

        return new CourseAttendanceReport(
                course.id(),
                course.name(),
                reports.size(),
                reports);
    }

    private StudentAttendanceReport createStudentReport(
            Enrolment enrolment,
            Long courseId) {

        Long studentId = enrolment.getStudent().getId();

        List<Attendance> records = attendance
                .findByEnrolment_Student_IdOrderByAttendanceDateDesc(
                        studentId)
                .stream()
                .filter(record -> record.getEnrolment()
                        .getCourse()
                        .getId()
                        .equals(courseId))
                .toList();

        long total = records.size();

        long present = records.stream()
                .filter(record ->
                        record.getStatus() == Attendance.Status.Present)
                .count();

        Double percentage = total == 0
                ? null
                : Math.round((present * 100.0 / total) * 100.0)
                    / 100.0;

        return new StudentAttendanceReport(
                studentId,
                enrolment.getStudent().getRegistrationNumber(),
                enrolment.getStudent().getName(),
                present,
                total,
                percentage);
    }
}
