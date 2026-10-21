package com.skillswap.repository;

import com.skillswap.entity.UserSkill;
import com.skillswap.enums.SkillType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, String> {

    List<UserSkill> findByUserId(String userId);

    Optional<UserSkill> findByUserIdAndId(String userId, String id);

    List<UserSkill> findByUserIdAndSkillType(String userId, SkillType skillType);

    Optional<UserSkill> findByUserIdAndNameIgnoreCaseAndSkillType(String userId, String name, SkillType skillType);

    void deleteByUserIdAndId(String userId, String id);

    void deleteByUserIdAndNameIgnoreCaseAndSkillType(String userId, String name, SkillType skillType);

    List<UserSkill> findBySkillTypeAndNameContainingIgnoreCase(SkillType skillType, String query);

    List<UserSkill> findBySkillTypeAndUserIdNot(SkillType skillType, String userId);

    long countBySkillTypeAndNameIgnoreCase(SkillType skillType, String name);
}
