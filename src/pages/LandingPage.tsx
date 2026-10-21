import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [featuredStudents, setFeaturedStudents] = useState<UserProfile[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiService.getAllStudents()
      .then((students) => {
        if (isMounted && Array.isArray(students)) {
          setFeaturedStudents(students.slice(0, 4));
        }
      })
      .catch((err) => {
        console.warn('Could not load landing featured students:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-16 animate-fadeIn pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f2f3ff] via-[#faf8ff] to-white pt-12 pb-20 border-b border-[#eaedff]">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#e2dfff] via-[#dae2fd] to-[#82f5c1] opacity-50 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold shadow-xs">
            <span className="material-symbols-outlined text-[16px]">school</span>
            <span>Collegiate Peer Knowledge Barter • Campus Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#131b2e] tracking-tight max-w-4xl mx-auto leading-tight">
            Exchange Skills with Campus Peers. <br />
            <span className="text-[#3525cd]">Learn Without Tuition.</span>
          </h1>

          <p className="text-sm sm:text-base text-[#464555] max-w-2xl mx-auto leading-relaxed">
            SkillSwap is a student peer-learning platform where university students teach skills
            they know, learn skills they want to develop, and build verified portfolios through authentic
            peer endorsements.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('explore-skills')}
              className="px-6 py-3.5 rounded-xl bg-[#3525cd] text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Explore Campus Marketplace</span>
            </button>
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3.5 rounded-xl bg-white border border-[#c7c4d8] text-[#131b2e] font-bold text-xs sm:text-sm hover:bg-[#f2f3ff] transition-all shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Join with .edu Email</span>
            </button>
            <button
              onClick={() => onNavigate('directory')}
              className="px-4 py-3.5 rounded-xl bg-[#eaedff] text-[#3525cd] font-bold text-xs sm:text-sm hover:bg-[#dae2fd] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Student Directory</span>
            </button>
          </div>

          {/* Campus Metric Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-[#464555]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c4a] text-[20px]">verified</span>
              <span>
                <strong className="text-[#131b2e]">100% Free</strong> Student Barter Guarantee
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3525cd] text-[20px]">school</span>
              <span>
                <strong className="text-[#131b2e]">3,400+</strong> Active Collegiate Exchanges
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">workspace_premium</span>
              <span>
                <strong className="text-[#131b2e]">Peer Endorsements</strong> Over Corporate Certs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#3525cd] uppercase tracking-wider">
            Frictionless Barter System
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
            How Collegiate Skill Swapping Works
          </h2>
          <p className="text-xs sm:text-sm text-[#464555] max-w-xl mx-auto">
            No money changes hands. Knowledge is exchanged on an equal footing using verified time
            and Swap Credits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#eaedff] text-[#3525cd] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">format_list_bulleted</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e]">1. Set Up Your Skills Matrix</h3>
            <p className="text-xs text-[#464555] leading-relaxed">
              List what you can teach (e.g., Python, Guitar, Spanish) with your proficiency level,
              and select target skills you want to learn.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#82f5c1] text-[#00714e] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">swap_horiz</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e]">2. Connect & Host Sessions</h3>
            <p className="text-xs text-[#464555] leading-relaxed">
              Discover matching campus peers, propose 1-on-1 swap barter sessions at Moffitt
              Library, or host open Quad workshops.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#ffdcc3] text-[#703a00] flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">workspace_premium</span>
            </div>
            <h3 className="font-bold text-base text-[#131b2e]">3. Earn Peer-Endorsed Badges</h3>
            <p className="text-xs text-[#464555] leading-relaxed">
              Receive verified feedback, level up collegiate badges like Master Explainer and Python
              Pillar, and bank Swap Credits in your wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Student Mentors Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#131b2e]">Featured Student Mentors</h2>
            <p className="text-xs text-[#464555]">
              Active campus fellows with verified collegiate reputations
            </p>
          </div>
          <button
            onClick={() => onNavigate('explore-skills')}
            className="text-xs font-bold text-[#3525cd] hover:underline flex items-center gap-1"
          >
            <span>Browse All Students</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {featuredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#eaedff] space-y-3">
            <span className="material-symbols-outlined text-[36px] text-[#3525cd]">school</span>
            <h3 className="text-lg font-bold text-[#131b2e]">Be the First Peer Mentor to Join</h3>
            <p className="text-xs text-[#464555] max-w-md mx-auto">
              Join SkillSwap today with your university credentials and start exchanging skills with fellow campus peers.
            </p>
            <button
              onClick={() => onNavigate('auth')}
              className="px-5 py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-semibold shadow-xs hover:opacity-95"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-[#eaedff] flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#131b2e] group-hover:text-[#3525cd] transition-colors">
                      {student.name}
                    </h4>
                    <p className="text-[11px] text-[#464555]">{student.department}</p>
                    <span className="text-[11px] text-amber-500 font-bold">
                      ★ {student.peerReputation}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#464555] line-clamp-2 leading-relaxed">
                  {student.bio}
                </p>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#006c4a] tracking-wider block">
                    Teaches:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {student.teachingSkills.slice(0, 2).map((ts) => (
                      <span
                        key={ts.id}
                        className="px-2 py-0.5 rounded-full bg-[#82f5c1]/30 text-[#00714e] text-[10px] font-semibold"
                      >
                        {ts.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('explore-skills')}
                className="w-full py-2 rounded-xl bg-[#f2f3ff] text-[#3525cd] text-xs font-bold hover:bg-[#eaedff] transition-all flex items-center justify-center gap-1"
              >
                <span>Propose Swap</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#3525cd] rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              Ready for Fall Quadrangle?
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Start Swapping Skills on Campus Today
            </h3>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Sign up with your university email to claim your initial 10 Swap Credits and begin
              exchanging knowledge with fellow collegiate peers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 z-10">
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 rounded-xl bg-white text-[#3525cd] font-bold text-xs sm:text-sm shadow-md hover:bg-[#f2f3ff] transition-all"
            >
              Sign Up Now
            </button>
            <button
              onClick={() => onNavigate('explore-skills')}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-xs sm:text-sm hover:bg-white/20 transition-all"
            >
              Explore First
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
