package com.skillswap.controller;

import com.skillswap.dto.response.ApiResponse;
import com.skillswap.dto.response.UserDto;
import com.skillswap.repository.UserRepository;
import com.skillswap.security.UserPrincipal;
import com.skillswap.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "User Discovery and Profile Lookups")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile summary")
    public ResponseEntity<ApiResponse<UserDto>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto userDto = userService.getUserDtoById(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Find student by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String id) {
        UserDto userDto = userService.getUserDtoById(id);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @GetMapping
    @Operation(summary = "Search students by name, university, or department")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(@RequestParam(required = false) String query) {
        List<UserDto> users;
        if (query != null && !query.isBlank()) {
            users = userRepository.searchUsers(query.trim()).stream()
                    .map(userService::mapToDto)
                    .collect(Collectors.toList());
        } else {
            users = userRepository.findAll().stream()
                    .map(userService::mapToDto)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
