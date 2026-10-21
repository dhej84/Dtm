package com.skillswap.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SignupRequest {

    @NotBlank(message = "Full name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid university or collegiate email is required")
    private String email;

    @NotBlank(message = "University or college is required")
    private String university;

    private String department;
    private String year;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String teachSkillName;
    private String teachSkillLevel;
    private String learnSkillName;

    public SignupRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getTeachSkillName() { return teachSkillName; }
    public void setTeachSkillName(String teachSkillName) { this.teachSkillName = teachSkillName; }

    public String getTeachSkillLevel() { return teachSkillLevel; }
    public void setTeachSkillLevel(String teachSkillLevel) { this.teachSkillLevel = teachSkillLevel; }

    public String getLearnSkillName() { return learnSkillName; }
    public void setLearnSkillName(String learnSkillName) { this.learnSkillName = learnSkillName; }
}
