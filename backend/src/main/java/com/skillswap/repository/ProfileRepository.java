package com.skillswap.repository;

import com.skillswap.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
    Optional<Profile> findByPublicProfileId(String publicProfileId);
    boolean existsByPublicProfileId(String publicProfileId);
}
