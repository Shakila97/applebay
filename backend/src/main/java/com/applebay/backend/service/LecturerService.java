package com.applebay.backend.service;

import com.applebay.backend.dto.LecturerRegistrationRequest;
import com.applebay.backend.entity.AppUser;
import com.applebay.backend.entity.Lecturer;
import com.applebay.backend.repository.AppUserRepository;
import com.applebay.backend.repository.LecturerRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class LecturerService {

    private final AppUserRepository users;
    private final LecturerRepository lecturers;
    private final PasswordEncoder passwordEncoder;

    public LecturerService(
            AppUserRepository users,
            LecturerRepository lecturers,
            PasswordEncoder passwordEncoder) {

        this.users = users;
        this.lecturers = lecturers;
        this.passwordEncoder = passwordEncoder;
    }

    public record LecturerResponse(
            Long id,
            String name,
            String phone,
            String email) {
    }

    @Transactional
    public LecturerResponse register(
            LecturerRegistrationRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (request.password()
                .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must not exceed 72 UTF-8 bytes");
        }

        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.password()));
        user.setRole(AppUser.Role.LECTURER);
        user.setEnabled(true);

        Lecturer lecturer = new Lecturer();
        lecturer.setName(request.name().trim());
        lecturer.setPhone(request.phone().trim());

        try {
            AppUser savedUser = users.saveAndFlush(user);

            lecturer.setUser(savedUser);
            Lecturer savedLecturer =
                    lecturers.saveAndFlush(lecturer);

            return new LecturerResponse(
                    savedLecturer.getId(),
                    savedLecturer.getName(),
                    savedLecturer.getPhone(),
                    savedUser.getEmail());

        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Lecturer could not be created. The email may already be registered");
        }
    }
}
