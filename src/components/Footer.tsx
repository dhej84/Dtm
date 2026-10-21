import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { highContrast, toggleHighContrast } = useAccessibility();

  return (
    <footer className="w-full bg-[#f2f3ff] mt-16 border-t border-[#eaedff]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold text-[#131b2e] tracking-tight">
                SkillSwap
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-[11px] font-bold">
                Campus Trust
              </span>
            </div>
            <p className="text-xs text-[#464555] leading-relaxed">
              Empowering university students through frictionless peer-to-peer knowledge exchange.
              Learn together, build verified portfolios, and earn campus credits.
            </p>
          </div>

          {/* Campus Network */}
          <div>
            <h4 className="text-sm font-bold text-[#131b2e] mb-3">Campus Network</h4>
            <ul className="space-y-2 text-xs text-[#464555]">
              <li>
                <button
                  onClick={() => onNavigate('explore-skills')}
                  className="hover:text-[#131b2e] transition-colors"
                >
                  Verified Study Groups
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('connections')}
                  className="hover:text-[#131b2e] transition-colors"
                >
                  Department Mentors
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('teaching-studio')}
                  className="hover:text-[#131b2e] transition-colors"
                >
                  Quad Workshops
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore-skills')}
                  className="hover:text-[#131b2e] transition-colors"
                >
                  Student Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Safety */}
          <div>
            <h4 className="text-sm font-bold text-[#131b2e] mb-3">Community & Safety</h4>
            <ul className="space-y-2 text-xs text-[#464555]">
              <li>
                <span className="hover:text-[#131b2e] transition-colors cursor-pointer">
                  Honor Code & Guidelines
                </span>
              </li>
              <li>
                <span className="hover:text-[#131b2e] transition-colors cursor-pointer">
                  Peer Mediation Portal
                </span>
              </li>
              <li>
                <span className="hover:text-[#131b2e] transition-colors cursor-pointer">
                  Swap Guarantee Policy
                </span>
              </li>
              <li>
                <span className="hover:text-[#131b2e] transition-colors cursor-pointer">
                  Report Academic Dishonesty
                </span>
              </li>
            </ul>
          </div>

          {/* Accessibility & Ethics */}
          <div>
            <h4 className="text-sm font-bold text-[#131b2e] mb-3">Accessibility & Ethics</h4>
            <div
              onClick={toggleHighContrast}
              className="flex items-center justify-between p-3 rounded-xl bg-[#eaedff] mb-3 cursor-pointer hover:bg-[#e2e7ff] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#131b2e]">
                  contrast
                </span>
                <span className="text-xs font-semibold text-[#131b2e]">High Contrast Mode</span>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  highContrast ? 'bg-[#3525cd]' : 'bg-[#c7c4d8]'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    highContrast ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            <p className="text-xs text-[#464555] leading-relaxed">
              WCAG 2.1 AA certified scholastic environment designed for all student learners.
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="pt-6 border-t border-[#eaedff] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#464555]">
          <div className="flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px] text-[#006c4a]">
              verified_user
            </span>
            <span>100% Free Peer-to-Peer Student Guarantee</span>
          </div>
          <div>© 2024 SkillSwap Collegiate Network. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};
