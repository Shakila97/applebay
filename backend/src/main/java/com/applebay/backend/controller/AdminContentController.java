package com.applebay.backend.controller;

import com.applebay.backend.service.AdminContentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courses/{courseId}/contents")
public class AdminContentController {

    private final AdminContentService service;

    public AdminContentController(AdminContentService service) {
        this.service = service;
    }

    public record ContentRequest(
            @NotBlank @Size(max = 150)
            String title,

            @NotBlank @Size(max = 100000)
            String body) {
    }

    @GetMapping
    public List<AdminContentService.ContentView> getContents(
            @PathVariable Long courseId) {

        return service.getContents(courseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminContentService.ContentView createContent(
            @PathVariable Long courseId,
            @Valid @RequestBody ContentRequest request) {

        return service.saveContent(
                courseId,
                null,
                request.title(),
                request.body());
    }

    @PutMapping("/{contentId}")
    public AdminContentService.ContentView updateContent(
            @PathVariable Long courseId,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentRequest request) {

        return service.saveContent(
                courseId,
                contentId,
                request.title(),
                request.body());
    }

    @DeleteMapping("/{contentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteContent(
            @PathVariable Long courseId,
            @PathVariable Long contentId) {

        service.deleteContent(courseId, contentId);
    }
}
