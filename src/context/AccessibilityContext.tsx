import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'medium' | 'large';
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'normal' | 'medium' | 'large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skillswap_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    try {
      return localStorage.getItem('skillswap_reduced_motion') === 'true';
    } catch {
      return false;
    }
  });

  const [fontSize, setFontSizeState] = useState<'normal' | 'medium' | 'large'>(() => {
    try {
      return (localStorage.getItem('skillswap_font_size') as any) || 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
      localStorage.setItem('skillswap_high_contrast', String(highContrast));
    } catch {}
  }, [highContrast]);

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (reducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }
      localStorage.setItem('skillswap_reduced_motion', String(reducedMotion));
    } catch {}
  }, [reducedMotion]);

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove('text-size-normal', 'text-size-medium', 'text-size-large');
      if (fontSize === 'medium') {
        root.style.fontSize = '17px';
      } else if (fontSize === 'large') {
        root.style.fontSize = '19px';
      } else {
        root.style.fontSize = '16px';
      }
      localStorage.setItem('skillswap_font_size', fontSize);
    } catch {}
  }, [fontSize]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleReducedMotion = () => setReducedMotion((prev) => !prev);
  const setFontSize = (size: 'normal' | 'medium' | 'large') => setFontSizeState(size);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        reducedMotion,
        fontSize,
        toggleHighContrast,
        toggleReducedMotion,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
