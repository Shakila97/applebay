package com.applebay.backend.service;

import com.applebay.backend.dto.SignupRequest;
import com.applebay.backend.entity.AppUser;
import com.applebay.backend.repository.AppUserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record AccountResponse(
            Long id,
            String email,
            AppUser.Role role) {
    }

    @Transactional
    public AccountResponse signup(SignupRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (request.password()
                .getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must not exceed 72 UTF-8 bytes");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.password()));

        // Public signup always creates a Student account.
        user.setRole(AppUser.Role.STUDENT);
        user.setEnabled(true);

        try {
            AppUser saved = userRepository.saveAndFlush(user);

            return new AccountResponse(
                    saved.getId(),
                    saved.getEmail(),
                    saved.getRole());

        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Account could not be created; email may already be registered");
        }
    }
}
