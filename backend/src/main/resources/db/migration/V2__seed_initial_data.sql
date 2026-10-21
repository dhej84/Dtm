-- SkillSwap PostgreSQL Seed Data Migration V2
-- Populates default catalog, demo students, lessons, and achievements

-- 1. Initial Skills Catalog
INSERT INTO skills (id, name, category, description, popular_level, popularity, students_count)
VALUES
('skill-1', 'Distributed Systems', 'Computer Science', 'Raft consensus, Paxos, distributed storage, and gRPC microservices architecture.', 'Advanced', 94, 18),
('skill-2', 'Applied Machine Learning', 'Computer Science', 'PyTorch deep neural nets, CNNs, transformers, and model evaluation.', 'Intermediate', 88, 24),
('skill-3', 'UX/UI Design Systems', 'Design & Arts', 'Figma auto-layout, token design systems, accessible typography, and micro-interactions.', 'Intermediate', 76, 15),
('skill-4', 'Organic Chemistry', 'Natural Sciences', 'Reaction mechanisms, retrosynthesis, NMR spectroscopy, and orbital symmetry.', 'Intermediate', 82, 19),
('skill-5', 'Macroeconomics & Game Theory', 'Economics & Business', 'Nash equilibria, signaling games, monetary policy, and competitive strategy.', 'Intermediate', 65, 12),
('skill-6', 'Rust Systems Programming', 'Computer Science', 'Borrow checker, memory safety, async Tokio, and WebAssembly compilation.', 'Advanced', 91, 14),
('skill-7', 'Statistical Causal Inference', 'Mathematics & Stats', 'Potential outcomes, instrumental variables, DAGs, and synthetic control methods.', 'Advanced', 72, 11),
('skill-8', 'Biomaterials Engineering', 'Engineering', 'Hydrogels, tissue scaffolds, biocompatibility testing, and nano-carriers.', 'Mastery', 59, 9)
ON CONFLICT (id) DO NOTHING;

-- 2. Initial Achievements
INSERT INTO achievements (id, title, category, description, icon, icon_bg_color, progress_text, fill_percent, level_badge)
VALUES
('ach-1', 'Systems Architecture Pioneer', 'Teaching Mastery', 'Validated by peers for delivering high-rigor systems architecture workshops.', 'developer_board', 'bg-[#c5bfff] text-[#4d2db7]', '24/25 Hrs', 96, 'Master Instructor'),
('ach-2', 'Raft Consensus Mentor', 'Teaching Mastery', 'Led 10+ students through step-by-step distributed log replication projects.', 'hub', 'bg-[#c5bfff] text-[#4d2db7]', '12/12 Endorsements', 100, 'Top 1% Mentor'),
('ach-3', 'ML Pipeline Specialist', 'Learning Milestones', 'Completed end-to-end model training, deployment, and inference optimization.', 'psychology', 'bg-[#82f5c1] text-[#00714e]', '8/10 Labs', 80, 'Level 4 Scholar'),
('ach-4', 'Campus Peer Vanguard', 'Learning Milestones', 'Active student peer tutor with verified university standing.', 'school', 'bg-[#82f5c1] text-[#00714e]', '100% Fulfill', 100, 'Honor Roll')
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Users (BCrypt encoded password: 'password123' -> $2a$10$7vN887b4rYn7hE7X1xG2e.YJ2LpB/oG1g4w4kF3a2M1g5l6v9Xq.)
-- Passwords will also be handled by BCryptPasswordEncoder
INSERT INTO users (id, name, email, password_hash, university, department, year, is_verified, avatar_url, role)
VALUES
('user-1', 'Alex Rivera', 'alex.rivera@cs.stanford.edu', '$2a$10$4n0K01X3g97lYwXv1U9u8uK9rL7yB7sQ.h1Z9K5w4r2v6X3a2M1g5', 'Stanford University', 'Computer Science & Systems', 'Senior', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'ROLE_STUDENT'),
('user-2', 'Elena Rostova', 'elena.rostova@oxford.edu', '$2a$10$4n0K01X3g97lYwXv1U9u8uK9rL7yB7sQ.h1Z9K5w4r2v6X3a2M1g5', 'Oxford University', 'Biochemistry & Molecular Biology', 'Graduate', true, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', 'ROLE_STUDENT'),
('user-3', 'Marcus Vance', 'marcus.vance@mit.edu', '$2a$10$4n0K01X3g97lYwXv1U9u8uK9rL7yB7sQ.h1Z9K5w4r2v6X3a2M1g5', 'MIT', 'Human-Computer Interaction', 'Junior', true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'ROLE_STUDENT'),
('user-4', 'David Kim', 'david.kim@stanford.edu', '$2a$10$4n0K01X3g97lYwXv1U9u8uK9rL7yB7sQ.h1Z9K5w4r2v6X3a2M1g5', 'Stanford University', 'Electrical Engineering & AI', 'PhD Candidate', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 'ROLE_STUDENT'),
('user-5', 'Priya Patel', 'priya.patel@cambridge.edu', '$2a$10$4n0K01X3g97lYwXv1U9u8uK9rL7yB7sQ.h1Z9K5w4r2v6X3a2M1g5', 'University of Cambridge', 'Economics & Public Policy', 'Senior', true, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 'ROLE_STUDENT')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Profiles
INSERT INTO profiles (id, bio, location, rank, member_since, wallet_balance, hours_taught, hours_learned, peer_reputation, review_count, swap_fulfill_rate, verified_peers_only, allow_direct_swaps, public_learning_history, mask_reviews)
VALUES
('user-1', 'Senior undergraduate focusing on distributed consensus algorithms, network topology optimization, and peer-to-peer compute protocols. Seeking machine learning expertise for fault-detection architectures.', 'Stanford, CA', 'Peer Fellow', 'Sep 2023', 14.50, 48.00, 32.50, 4.96, 27, 98.40, true, true, true, false),
('user-2', 'Biochemistry researcher modeling molecular structures and enzymatic kinetics. Looking for advanced Python and data analysis swaps.', 'Oxford, UK', 'Research Scholar', 'Oct 2023', 18.00, 36.00, 20.00, 4.98, 19, 100.00, true, true, true, false),
('user-3', 'Passionate about accessibility, design tokens, and frontend architecture. Excited to learn Rust and distributed systems.', 'Cambridge, MA', 'Senior Fellow', 'Jan 2024', 9.00, 28.00, 22.00, 4.90, 14, 96.00, true, true, true, false),
('user-4', 'PhD candidate working on multi-agent reinforcement learning. Happy to teach deep learning, CUDA, and optimization.', 'Stanford, CA', 'Distinguished Mentor', 'Nov 2022', 25.00, 84.00, 40.00, 4.99, 42, 99.00, true, true, true, false),
('user-5', 'Economics and decision sciences student modeling auction theory and algorithmic game theory.', 'Cambridge, UK', 'Campus Fellow', 'Feb 2024', 12.00, 24.00, 18.00, 4.88, 11, 95.00, true, true, true, false)
ON CONFLICT (id) DO NOTHING;

-- 5. User Skills
INSERT INTO user_skills (id, user_id, skill_id, name, category, skill_type, skill_level, target_level, proficiency_percent, hours_taught, hours_practiced, endorsements_count, reviews_count, description)
VALUES
('usk-1', 'user-1', 'skill-1', 'Distributed Systems', 'Computer Science', 'TEACH', 'Advanced', NULL, 95, 32.00, 0.00, 19, 14, 'Consensus protocols, Raft, Paxos, distributed transaction rollback.'),
('usk-2', 'user-1', 'skill-6', 'Rust Systems Programming', 'Computer Science', 'TEACH', 'Intermediate', NULL, 80, 16.00, 0.00, 8, 7, 'Borrow checker, asynchronous runtimes with Tokio.'),
('usk-3', 'user-1', 'skill-2', 'Applied Machine Learning', 'Computer Science', 'LEARN', 'Beginner', 'Advanced', 45, 0.00, 18.00, 3, 0, NULL),
('usk-4', 'user-2', 'skill-4', 'Organic Chemistry', 'Natural Sciences', 'TEACH', 'Advanced', NULL, 96, 24.00, 0.00, 15, 12, 'NMR interpretation, chemical synthesis pathways.'),
('usk-5', 'user-2', 'skill-2', 'Applied Machine Learning', 'Computer Science', 'LEARN', 'Beginner', 'Intermediate', 30, 0.00, 12.00, 1, 0, NULL),
('usk-6', 'user-3', 'skill-3', 'UX/UI Design Systems', 'Design & Arts', 'TEACH', 'Advanced', NULL, 92, 28.00, 0.00, 14, 10, 'Figma component libraries, accessibility compliance.'),
('usk-7', 'user-3', 'skill-6', 'Rust Systems Programming', 'Computer Science', 'LEARN', 'Beginner', 'Intermediate', 25, 0.00, 10.00, 0, 0, NULL),
('usk-8', 'user-4', 'skill-2', 'Applied Machine Learning', 'Computer Science', 'TEACH', 'Mastery', NULL, 99, 84.00, 0.00, 38, 29, 'PyTorch transformer models, attention mechanisms, fine-tuning.'),
('usk-9', 'user-4', 'skill-1', 'Distributed Systems', 'Computer Science', 'LEARN', 'Intermediate', 'Advanced', 60, 0.00, 20.00, 4, 0, NULL),
('usk-10', 'user-5', 'skill-5', 'Macroeconomics & Game Theory', 'Economics & Business', 'TEACH', 'Advanced', NULL, 90, 24.00, 0.00, 11, 8, 'Mechanism design, Nash equilibria, market signaling.')
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Lessons
INSERT INTO lessons (id, title, skill, category, description, skill_level, format, teacher_id, duration_minutes, credits_required, prerequisites, enrolled_students_count)
VALUES
('lesson-1', 'Distributed Systems Consensus: Raft from Scratch', 'Distributed Systems', 'Computer Science', 'Deep-dive into Raft leader election, heartbeats, log replication, and split-brain resolution through collaborative live code walkthroughs.', 'Advanced', 'Interactive Workshop', 'user-1', 90, 2.00, 'Familiarity with concurrency and networking fundamentals.', 18),
('lesson-2', 'Deep Learning with PyTorch: Attention & Transformers', 'Applied Machine Learning', 'Computer Science', 'Architecting self-attention, multi-head transformer encoders, and fine-tuning BERT-style models on collegiate compute clusters.', 'Advanced', 'Code Walkthrough', 'user-4', 120, 2.00, 'Intermediate Python, calculus, linear algebra.', 24),
('lesson-3', 'Design Systems Architecture: Tokens to Code', 'UX/UI Design Systems', 'Design & Arts', 'Build accessible, scalable multi-brand design systems using semantic tokens, Tailwind CSS, and Figma component variants.', 'Intermediate', 'Interactive Workshop', 'user-3', 75, 1.50, 'Basic Figma & HTML/CSS knowledge.', 15),
('lesson-4', 'Spectroscopy & Molecular Synthesis Pathways', 'Organic Chemistry', 'Natural Sciences', 'Master 1H and 13C NMR spectrum decoding, infrared peak analysis, and multistep retrosynthesis planning for exams.', 'Intermediate', '1:1 Tutoring', 'user-2', 60, 1.00, 'Organic Chemistry I fundamentals.', 19)
ON CONFLICT (id) DO NOTHING;

-- 7. Demo Lesson Modules
INSERT INTO lesson_modules (id, lesson_id, title, duration, sequence_order, description, content_snippet)
VALUES
('mod-1-1', 'lesson-1', 'Leader Election & Heartbeat Timers', '25 mins', 1, 'Understanding term numbers, randomized election timeouts, and candidate state transitions.', 'Candidate nodes request votes across the cluster when randomized heartbeat timers expire.'),
('mod-1-2', 'lesson-1', 'Log Replication & Majority Quorum', '35 mins', 2, 'Appending entries, commit indexes, and handling divergent follower logs safely.', 'Entries become committed once stored on a majority of cluster nodes.'),
('mod-1-3', 'lesson-1', 'Network Partition Recovery & Testing', '30 mins', 3, 'Simulating cluster partitions and observing safe failover without split-brain.', 'A minority partition cannot commit entries; uncommitted entries are overwritten upon healing.'),

('mod-2-1', 'lesson-2', 'Scaled Dot-Product Attention Implementation', '35 mins', 1, 'Deriving Q, K, V matrices and temperature scaling in raw PyTorch tensors.', 'Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V'),
('mod-2-2', 'lesson-2', 'Multi-Head Projection & Feed-Forward Layers', '45 mins', 2, 'Layer norm, residual connections, and positional encodings.', 'Combining multi-head outputs with residual skip connections.'),
('mod-2-3', 'lesson-2', 'Fine-Tuning on Academic Benchmarks', '40 mins', 3, 'Loading pre-trained weights and evaluating task accuracy.', 'Measuring perplexity and validation cross-entropy loss.')
ON CONFLICT (id) DO NOTHING;

-- 8. Demo Comments
INSERT INTO comments (id, lesson_id, author_id, text, likes)
VALUES
('com-1', 'lesson-1', 'user-4', 'The visual breakdown of the leader election state machine in Module 1 makes Raft so much clearer than the original Ongaro paper.', 5),
('com-2', 'lesson-1', 'user-3', 'Great workshop! Especially the section on handling randomized timers to avoid election ties.', 3),
('com-3', 'lesson-2', 'user-1', 'The explanation of scaled dot-product attention clarified why the square root dimension factor prevents softmax saturation.', 6)
ON CONFLICT (id) DO NOTHING;

-- 9. Demo Connections
INSERT INTO connections (id, from_user_id, to_user_id, teach_skill, learn_skill, message, status)
VALUES
('conn-1', 'user-2', 'user-1', 'Organic Chemistry', 'Distributed Systems', 'Hi Alex, Id love to swap an intro to biochemical modeling for your Raft workshop!', 'PENDING'),
('conn-2', 'user-3', 'user-1', 'UX/UI Design Systems', 'Rust Systems Programming', 'Hey! Let us collaborate on building a fast Rust TUI client with accessible design principles.', 'ACCEPTED')
ON CONFLICT (id) DO NOTHING;

-- 10. Demo Lesson Progress
INSERT INTO lesson_progress (id, lesson_id, user_id, progress_percent, is_completed, completion_status, user_notes, current_step_index, completed_module_ids, started_at, completed_at)
VALUES
('prog-1', 'lesson-2', 'user-1', 65, false, 'IN_PROGRESS', 'Need to review scaled dot-product formula derivation.', 2, 'mod-2-1,mod-2-2', CURRENT_TIMESTAMP - INTERVAL '3 days', NULL),
('prog-2', 'lesson-1', 'user-2', 100, true, 'COMPLETED', 'Successfully simulated 5-node cluster partition and recovery.', 3, 'mod-1-1,mod-1-2,mod-1-3', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('prog-3', 'lesson-3', 'user-1', 40, false, 'IN_PROGRESS', 'Figma auto-layout tokens practice.', 1, 'mod-1-1', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL)
ON CONFLICT (id) DO NOTHING;

-- 11. Demo User Achievements
INSERT INTO user_achievements (id, user_id, achievement_id, endorsements_count, issued_date)
VALUES
('uach-1', 'user-1', 'ach-1', 19, 'Sep 2024'),
('uach-2', 'user-1', 'ach-2', 12, 'Oct 2024'),
('uach-3', 'user-4', 'ach-3', 25, 'Aug 2024'),
('uach-4', 'user-2', 'ach-4', 16, 'Nov 2024')
ON CONFLICT (id) DO NOTHING;

-- 12. Demo Learning Milestones
INSERT INTO learning_milestones (id, user_id, title, description, time_ago, date_str, milestone_type, credits_change, badge_triggered, partner_name, term)
VALUES
('ms-1', 'user-1', 'Mastered Raft Leader Election', 'Finished practical distributed consensus debugging workshop.', '2 days ago', 'Sep 26, 2024', 'LESSON_COMPLETION', 2.00, 'Consensus Novice', 'Elena Rostova', 'Fall 2024'),
('ms-2', 'user-1', 'Completed First Peer Review', 'Evaluated PyTorch neural net implementation for Marcus Vance.', '5 days ago', 'Sep 23, 2024', 'REVIEW', 1.00, 'Peer Reviewer', 'Marcus Vance', 'Fall 2024')
ON CONFLICT (id) DO NOTHING;
