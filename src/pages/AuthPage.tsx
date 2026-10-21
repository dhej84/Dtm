import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onNavigate: (route: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login form state - starts completely empty as per specification
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [university, setUniversity] = useState('UC Berkeley');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState("'26");
  const [teachSkillName, setTeachSkillName] = useState('');
  const [teachSkillLevel, setTeachSkillLevel] = useState('Intermediate');
  const [learnSkillName, setLearnSkillName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setLoginError('Please enter your university email or username.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(trimmedEmail, loginPassword);
      if (res.success) {
        onNavigate('dashboard');
      } else {
        setLoginError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Authentication error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!name.trim()) {
      setSignupError('Please provide your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setSignupError('Please enter a valid university email address.');
      return;
    }

    if (!password || password.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match. Please re-enter your password.');
      return;
    }

    const effectiveTeachSkill = teachSkillName.trim() || 'General Peer Tutoring';

    if (!agreedToTerms) {
      setSignupError('Please accept the SkillSwap Campus Honor Code & Privacy terms to register.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        university,
        department,
        year,
        teachSkillName: effectiveTeachSkill,
        teachSkillLevel,
        learnSkillName: learnSkillName.trim(),
      });

      if (res.success) {
        onNavigate('dashboard');
      } else {
        setSignupError(res.error || 'Registration failed. An account with this email may already exist.');
      }
    } catch (err: any) {
      setSignupError(err?.message || 'Registration error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 animate-fadeIn space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3525cd] to-[#4f46e5] text-white flex items-center justify-center mx-auto shadow-md font-bold text-2xl">
          <span className="material-symbols-outlined text-[30px]">swap_calls</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#131b2e] tracking-tight">
          Welcome to SkillSwap
        </h1>
        <p className="text-xs sm:text-sm text-[#464555] max-w-sm mx-auto">
          Collegiate Peer-to-Peer Learning & Skill Exchange Platform
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] space-y-6">
        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#f2f3ff] p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-[#3525cd] text-white shadow-xs' : 'text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            Sign In / Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              mode === 'signup' ? 'bg-[#3525cd] text-white shadow-xs' : 'text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#ba1a1a] text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                University Email or Username
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@university.edu or username"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#131b2e]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-[11px] text-[#3525cd] hover:underline flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {showLoginPassword ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{showLoginPassword ? 'Hide password' : 'Show password'}</span>
                </button>
              </div>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#464555] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]"
                />
                <span>Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#3525cd] text-white text-xs sm:text-sm font-semibold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In to SkillSwap</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignup} className="space-y-4">
            {signupError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#ba1a1a] text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{signupError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Liu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  University Email *
                </label>
                <input
                  type="email"
                  placeholder="alex.liu@berkeley.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#131b2e]">Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="text-[10px] text-[#3525cd] hover:underline"
                  >
                    {showSignupPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c7c4d8] text-xs sm:text-sm outline-none focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20 bg-white"
                />
              </div>
            </div>

            {/* University & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">University</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
                >
                  <option value="UC Berkeley">UC Berkeley</option>
                  <option value="Stanford University">Stanford University</option>
                  <option value="UCLA">UCLA</option>
                  <option value="San Jose State">San Jose State</option>
                  <option value="Other College">Other University</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Major / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical Eng"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs bg-white outline-none focus:border-[#3525cd]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#131b2e] mb-1">Class Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#c7c4d8] text-xs bg-white text-[#131b2e] outline-none focus:border-[#3525cd]"
                >
                  <option value="'25">Class of '25 (Senior)</option>
                  <option value="'26">Class of '26 (Junior)</option>
                  <option value="'27">Class of '27 (Sophomore)</option>
                  <option value="'28">Class of '28 (Freshman)</option>
                  <option value="Grad">Graduate Student</option>
                </select>
              </div>
            </div>

            {/* Initial Skills Exchange Onboarding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
              <div>
                <label className="block text-xs font-bold text-[#006c4a] mb-1">
                  Skill You Can Teach / Know *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, Calculus, CAD, Guitar"
                  value={teachSkillName}
                  onChange={(e) => setTeachSkillName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#c7c4d8] text-xs bg-white outline-none focus:border-[#006c4a]"
                />
                <select
                  value={teachSkillLevel}
                  onChange={(e) => setTeachSkillLevel(e.target.value)}
                  className="w-full mt-2 px-2 py-1.5 rounded-lg border border-[#c7c4d8] text-xs bg-white outline-none"
                >
                  <option value="Beginner">Skill Level: Beginner</option>
                  <option value="Intermediate">Skill Level: Intermediate</option>
                  <option value="Advanced">Skill Level: Advanced</option>
                  <option value="Mastery">Skill Level: Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3525cd] mb-1">
                  Skill You Want to Learn (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spanish, Figma, Data Science"
                  value={learnSkillName}
                  onChange={(e) => setLearnSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#c7c4d8] text-xs bg-white outline-none focus:border-[#3525cd]"
                />
                <span className="text-[10px] text-[#464555] block mt-2">
                  Matching AI will pair you with campus mentors offering this skill.
                </span>
              </div>
            </div>

            {/* Terms and Privacy Acknowledgement */}
            <label className="flex items-start gap-2 text-xs text-[#464555] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]"
              />
              <span>
                I agree to the SkillSwap Campus Honor Code, verified peer exchange terms, and collegiate privacy guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#006c4a] text-white text-xs sm:text-sm font-semibold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  <span>Creating student account...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Create Account & Claim 10 Swap Credits</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
