import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeColor, setThemeColor] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.themeColor || '#2563eb';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.isDarkMode || false;
  });

  useEffect(() => {
    const darken = (hex, amount) => {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      r = Math.max(0, r - amount);
      g = Math.max(0, g - amount);
      b = Math.max(0, b - amount);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const lighten = (hex, amount) => {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      r = Math.min(255, r + (255 - r) * (amount / 100));
      g = Math.min(255, g + (255 - g) * (amount / 100));
      b = Math.min(255, b + (255 - b) * (amount / 100));
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    };

    const hexToRgba = (hex, alpha) => {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    document.documentElement.style.setProperty('--primary', themeColor);
    document.documentElement.style.setProperty('--primary-hover', darken(themeColor, 30));
    document.documentElement.style.setProperty('--primary-light', hexToRgba(themeColor, 0.1));

    if (isDarkMode) {
      document.documentElement.style.setProperty('--text-main', '#f8fafc');
      document.documentElement.style.setProperty('--text-dim', '#94a3b8');
      document.documentElement.style.setProperty('--glass', 'rgba(15, 23, 42, 0.7)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
      document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.03)');
      document.body.classList.add('dark-mode');
      
      const darkBase = darken(themeColor, 160);
      const darkerBase = darken(themeColor, 200);
      const dynamicBg = `linear-gradient(135deg, ${darkerBase} 0%, ${darkBase} 100%)`;
      document.documentElement.style.setProperty('--bg-gradient', dynamicBg);
    } else {
      document.documentElement.style.setProperty('--text-main', '#0f172a');
      document.documentElement.style.setProperty('--text-dim', '#64748b');
      document.documentElement.style.setProperty('--glass', 'rgba(255, 255, 255, 0.7)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.05)');
      document.documentElement.style.setProperty('--card-bg', '#ffffff');
      document.body.classList.remove('dark-mode');
      
      const lightBase = lighten(themeColor, 88);
      const lighterBase = lighten(themeColor, 94);
      const dynamicBg = `linear-gradient(135deg, ${lighterBase} 0%, ${lightBase} 100%)`;
      document.documentElement.style.setProperty('--bg-gradient', dynamicBg);
    }
  }, [themeColor, isDarkMode]);

  const updateTheme = (newColor) => {
    setThemeColor(newColor);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      user.themeColor = newColor;
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  const toggleDarkMode = (val) => {
    setIsDarkMode(val);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      user.isDarkMode = val;
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, updateTheme, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
