package com.applebay.backend.controller;

import com.applebay.backend.entity.Attendance;
import com.applebay.backend.service.AttendanceService;
import com.applebay.backend.service.StudentProfileService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/attendance")
public class StudentAttendanceController {

    private final StudentProfileService profiles;
    private final AttendanceService attendance;

    public StudentAttendanceController(
            StudentProfileService profiles,
            AttendanceService attendance) {

        this.profiles = profiles;
        this.attendance = attendance;
    }

    @GetMapping
    public List<Attendance> getMyAttendance(
            Authentication authentication) {

        var student = profiles.getProfile(
                authentication.getName());

        return attendance.getStudentAttendance(student.getId());
    }

    @GetMapping("/summary")
    public AttendanceService.AttendanceSummary getMySummary(
            Authentication authentication) {

        var student = profiles.getProfile(
                authentication.getName());

        return attendance.getStudentSummary(student.getId());
    }
}
