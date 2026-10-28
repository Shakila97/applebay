package com.applebay.backend.controller;

import com.applebay.backend.service.LecturerContentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lecturer/courses/{courseId}/contents")
public class LecturerContentController {

    private final LecturerContentService service;

    public LecturerContentController(LecturerContentService service) {
        this.service = service;
    }

    public record ContentRequest(
            @NotBlank @Size(max = 150)
            String title,

            @NotBlank @Size(max = 100000)
            String body) {
    }

    @GetMapping
    public List<LecturerContentService.ContentView> getContents(
            Authentication authentication,
            @PathVariable Long courseId) {

        return service.getContents(
                authentication.getName(), courseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LecturerContentService.ContentView createContent(
            Authentication authentication,
            @PathVariable Long courseId,
            @Valid @RequestBody ContentRequest request) {

        return service.createContent(
                authentication.getName(),
                courseId,
                request.title(),
                request.body());
    }

    @PutMapping("/{contentId}")
    public LecturerContentService.ContentView updateContent(
            Authentication authentication,
            @PathVariable Long courseId,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentRequest request) {

        return service.updateContent(
                authentication.getName(),
                courseId,
                contentId,
                request.title(),
                request.body());
    }
}
