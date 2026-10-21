package com.skillswap.service;

import com.skillswap.dto.response.SkillDto;
import com.skillswap.entity.Skill;
import com.skillswap.exception.DuplicateResourceException;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    public SkillDto mapToDto(Skill skill) {
        if (skill == null) return null;
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setCategory(skill.getCategory());
        dto.setDescription(skill.getDescription());
        dto.setPopularLevel(skill.getPopularLevel());
        dto.setPopularity(skill.getPopularity());
        dto.setStudentsCount(skill.getStudentsCount());
        dto.setCreatedAt(skill.getCreatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> searchSkills(String query) {
        if (query == null || query.isBlank()) {
            return getAllSkills();
        }
        return skillRepository.searchSkills(query.trim()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByCategory(String category) {
        return skillRepository.findByCategoryIgnoreCase(category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SkillDto getSkillById(String id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        return mapToDto(skill);
    }

    @Transactional
    public SkillDto createSkill(SkillDto dto) {
        if (skillRepository.existsByNameIgnoreCase(dto.getName().trim())) {
            throw new DuplicateResourceException("Skill with name '" + dto.getName() + "' already exists");
        }

        Skill skill = new Skill();
        skill.setName(dto.getName().trim());
        skill.setCategory(dto.getCategory() != null ? dto.getCategory().trim() : "General");
        skill.setDescription(dto.getDescription());
        skill.setPopularLevel(dto.getPopularLevel() != null ? dto.getPopularLevel() : "Intermediate");

        Skill saved = skillRepository.save(skill);
        return mapToDto(saved);
    }
}
