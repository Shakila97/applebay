package com.applebay.backend.controller;

import com.applebay.backend.dto.SignupRequest;
import com.applebay.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.AccountResponse signup(
            @Valid @RequestBody SignupRequest request) {

        return authService.signup(request);
    }

    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }

    public record SessionResponse(
            String email,
            List<String> roles) {
    }

    @GetMapping("/me")
    public SessionResponse currentUser(Authentication authentication) {
        return new SessionResponse(
                authentication.getName(),
                authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .filter(authority -> authority.startsWith("ROLE_"))
                        .toList());
    }
}
