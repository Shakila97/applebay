package com.applebay.backend.controller;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.service.AttendanceService;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    public record AttendanceRequest(
            Long enrolmentId,
            LocalDate date,
            Attendance.Status status) {
    }

    @PutMapping
    public Attendance markAttendance(
            @RequestBody AttendanceRequest request) {

        return attendanceService.markAttendance(
                request.enrolmentId(),
                request.date(),
                request.status());
    }

    @GetMapping("/students/{studentId}")
    public List<Attendance> getStudentAttendance(
            @PathVariable Long studentId) {

        return attendanceService.getStudentAttendance(studentId);
    }

    @GetMapping("/students/{studentId}/summary")
    public AttendanceService.AttendanceSummary getStudentSummary(
            @PathVariable Long studentId) {

        return attendanceService.getStudentSummary(studentId);
    }
}