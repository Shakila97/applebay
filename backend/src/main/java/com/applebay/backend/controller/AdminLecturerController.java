package com.applebay.backend.controller;

import com.applebay.backend.dto.LecturerRegistrationRequest;
import com.applebay.backend.service.LecturerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/lecturers")
public class AdminLecturerController {

    private final LecturerService lecturerService;

    public AdminLecturerController(LecturerService lecturerService) {
        this.lecturerService = lecturerService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LecturerService.LecturerResponse registerLecturer(
            @Valid @RequestBody LecturerRegistrationRequest request) {

        return lecturerService.register(request);
    }
}
