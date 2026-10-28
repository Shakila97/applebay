package com.applebay.backend.controller;

import com.applebay.backend.dto.LecturerRegistrationRequest;
import com.applebay.backend.service.LecturerService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    public record LecturerUpdateRequest(
            @NotBlank @Size(max = 120)
            String name,

            @NotBlank @Size(max = 30)
            String phone) {
    }

    @GetMapping("/{lecturerId}")
    public LecturerService.LecturerResponse getLecturer(
            @PathVariable Long lecturerId) {

        return lecturerService.getLecturer(lecturerId);
    }

    @PutMapping("/{lecturerId}")
    public LecturerService.LecturerResponse updateLecturer(
            @PathVariable Long lecturerId,
            @Valid @RequestBody LecturerUpdateRequest request) {

        return lecturerService.updateLecturer(
                lecturerId,
                request.name(),
                request.phone());
    }
}
