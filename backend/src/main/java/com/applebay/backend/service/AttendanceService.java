package com.applebay.backend.service;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.entity.Enrolment;
import com.applebay.backend.repository.AttendanceRepository;
import com.applebay.backend.repository.EnrolmentRepository;
import com.applebay.backend.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final StudentRepository studentRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            EnrolmentRepository enrolmentRepository,
            StudentRepository studentRepository) {

        this.attendanceRepository = attendanceRepository;
        this.enrolmentRepository = enrolmentRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional
    public Attendance markAttendance(
            Long enrolmentId,
            LocalDate date,
            Attendance.Status status) {

        if (enrolmentId == null || date == null || status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enrolment ID, date and status are required");
        }

        Enrolment enrolment = enrolmentRepository.findById(enrolmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Enrolment not found"));

        Attendance attendance = attendanceRepository
                .findByEnrolment_IdAndAttendanceDate(enrolmentId, date)
                .orElseGet(Attendance::new);

        attendance.setEnrolment(enrolment);
        attendance.setAttendanceDate(date);
        attendance.setStatus(status);

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getStudentAttendance(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Student not found");
        }

        return attendanceRepository
                .findByEnrolment_Student_IdOrderByAttendanceDateDesc(studentId);
    }

    public List<Attendance> getCourseAttendance(
            Long courseId, LocalDate date) {

        if (courseId == null || date == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course ID and date are required");
        }

        return attendanceRepository
                .findByEnrolment_Course_IdAndAttendanceDate(courseId, date);
    }

    public record AttendanceSummary(
            long present,
            long total,
            Double percentage) {
    }

    public AttendanceSummary getStudentSummary(Long studentId) {
        List<Attendance> records = getStudentAttendance(studentId);

        long total = records.size();

        long present = records.stream()
                .filter(record ->
                        record.getStatus() == Attendance.Status.Present)
                .count();

        Double percentage = total == 0
                ? null
                : Math.round((present * 100.0 / total) * 100.0) / 100.0;

        return new AttendanceSummary(present, total, percentage);
    }
}