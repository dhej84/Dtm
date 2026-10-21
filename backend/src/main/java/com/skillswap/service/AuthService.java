package com.skillswap.service;

import com.skillswap.dto.request.LoginRequest;
import com.skillswap.dto.request.SignupRequest;
import com.skillswap.dto.response.AuthResponse;
import com.skillswap.dto.response.UserDto;
import com.skillswap.entity.Profile;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;
import com.skillswap.enums.SkillLevel;
import com.skillswap.enums.SkillType;
import com.skillswap.exception.BadRequestException;
import com.skillswap.exception.DuplicateResourceException;
import com.skillswap.repository.ProfileRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillRepository;
import com.skillswap.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserSkillRepository userSkillRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       ProfileRepository profileRepository,
                       UserSkillRepository userSkillRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userSkillRepository = userSkillRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = tokenProvider.generateToken(authentication);
        UserDto userDto = userService.mapToDto(user);

        return new AuthResponse(token, userDto);
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateResourceException("An account with email " + email + " already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setUniversity(request.getUniversity().trim());
        user.setDepartment(request.getDepartment());
        user.setYear(request.getYear());
        user.setIsVerified(email.endsWith(".edu") || email.endsWith(".ac.uk"));
        user.setRole("ROLE_STUDENT");

        User savedUser = userRepository.save(user);

        // Create default profile
        Profile profile = new Profile();
        profile.setUser(savedUser);
        profile.setId(savedUser.getId());
        profile.setBio("Campus learner and peer educator.");
        profile.setLocation(request.getUniversity());
        profile.setRank("Campus Member");
        profile.setWalletBalance(new BigDecimal("10.00"));
        profileRepository.save(profile);

        // Add initial teaching skill if provided
        if (request.getTeachSkillName() != null && !request.getTeachSkillName().isBlank()) {
            UserSkill teachSkill = new UserSkill();
            teachSkill.setUser(savedUser);
            teachSkill.setName(request.getTeachSkillName().trim());
            teachSkill.setCategory("General");
            teachSkill.setSkillType(SkillType.TEACH);

            SkillLevel level = SkillLevel.INTERMEDIATE;
            if (request.getTeachSkillLevel() != null) {
                try {
                    level = SkillLevel.valueOf(request.getTeachSkillLevel().toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
            teachSkill.setSkillLevel(level);
            teachSkill.setProficiencyPercent(80);
            userSkillRepository.save(teachSkill);
        }

        // Add initial learning skill if provided
        if (request.getLearnSkillName() != null && !request.getLearnSkillName().isBlank()) {
            UserSkill learnSkill = new UserSkill();
            learnSkill.setUser(savedUser);
            learnSkill.setName(request.getLearnSkillName().trim());
            learnSkill.setCategory("General");
            learnSkill.setSkillType(SkillType.LEARN);
            learnSkill.setSkillLevel(SkillLevel.BEGINNER);
            learnSkill.setTargetLevel(SkillLevel.ADVANCED);
            learnSkill.setProficiencyPercent(20);
            userSkillRepository.save(learnSkill);
        }

        String token = tokenProvider.generateTokenFromUser(savedUser.getId(), savedUser.getEmail());
        UserDto userDto = userService.mapToDto(savedUser);

        return new AuthResponse(token, userDto);
    }
}
