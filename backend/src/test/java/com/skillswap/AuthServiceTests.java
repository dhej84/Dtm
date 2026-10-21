package com.skillswap;

import com.skillswap.dto.request.LoginRequest;
import com.skillswap.dto.request.SignupRequest;
import com.skillswap.dto.response.AuthResponse;
import com.skillswap.dto.response.UserDto;
import com.skillswap.entity.Profile;
import com.skillswap.entity.User;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.DuplicateResourceException;
import com.skillswap.repository.ProfileRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillRepository;
import com.skillswap.security.JwtTokenProvider;
import com.skillswap.service.AuthService;
import com.skillswap.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTests {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private UserSkillRepository userSkillRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Alex Rivera", "alex@stanford.edu", "encodedHash", "Stanford University", "CS", "Senior");
        sampleUser.setId("user-1");
    }

    @Test
    @DisplayName("Signup successfully creates user and profile")
    void testSignupSuccess() {
        SignupRequest request = new SignupRequest();
        request.setName("Alex Rivera");
        request.setEmail("alex@stanford.edu");
        request.setPassword("password123");
        request.setUniversity("Stanford University");
        request.setDepartment("CS");
        request.setYear("Senior");

        when(userRepository.existsByEmailIgnoreCase("alex@stanford.edu")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedHash");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(profileRepository.save(any(Profile.class))).thenReturn(new Profile(sampleUser));
        when(tokenProvider.generateTokenFromUser(eq("user-1"), eq("alex@stanford.edu"))).thenReturn("mocked-jwt-token");

        UserDto userDto = new UserDto();
        userDto.setId("user-1");
        userDto.setEmail("alex@stanford.edu");
        when(userService.mapToDto(sampleUser)).thenReturn(userDto);

        AuthResponse response = authService.signup(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked-jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("alex@stanford.edu");
        verify(userRepository, times(1)).save(any(User.class));
        verify(profileRepository, times(1)).save(any(Profile.class));
    }

    @Test
    @DisplayName("Signup fails when email already exists")
    void testSignupDuplicateEmailThrowsException() {
        SignupRequest request = new SignupRequest();
        request.setEmail("alex@stanford.edu");
        request.setPassword("password123");

        when(userRepository.existsByEmailIgnoreCase("alex@stanford.edu")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> {
            authService.signup(request);
        });
    }

    @Test
    @DisplayName("Login successfully authenticates and returns JWT")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("alex@stanford.edu", "password123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(userRepository.findByEmailIgnoreCase("alex@stanford.edu")).thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateToken(authentication)).thenReturn("jwt-alex-token");

        UserDto userDto = new UserDto();
        userDto.setId("user-1");
        userDto.setEmail("alex@stanford.edu");
        when(userService.mapToDto(sampleUser)).thenReturn(userDto);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-alex-token");
        assertThat(response.getUser().getEmail()).isEqualTo("alex@stanford.edu");
    }
}
