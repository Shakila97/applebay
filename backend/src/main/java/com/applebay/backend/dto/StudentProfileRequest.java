package com.applebay.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentProfileRequest(

        @NotBlank @Size(max = 120)
        String name,

        @NotBlank
        @Pattern(
            regexp = "^(?:[0-9]{9}[VvXx]|[0-9]{12})$",
            message = "Enter 9 digits followed by V/X, or 12 digits"
        )
        String nic,

        @NotBlank @Size(max = 30)
        String phone,

        @NotBlank @Size(max = 300)
        String address
) {
}
