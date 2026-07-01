import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeColor, setThemeColor] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    // If the theme color is the old purple default (#6366f1), reset it to the original #0f172a
    const color = user?.themeColor;
    if (!color || color === '#6366f1') return '#0f172a';
    return color;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage theme first (set by Topbar), then user preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) return storedTheme === 'dark';
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.isDarkMode || false;
  });

  useEffect(() => {
    const hexToRgba = (hex, alpha) => {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Set primary color and derived values
    document.documentElement.style.setProperty('--primary', themeColor);
    document.documentElement.style.setProperty('--primary-light', hexToRgba(themeColor, 0.1));

    // Unified theme switching — single source of truth via data-theme attribute & fallback class
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
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
    const newVal = typeof val === 'boolean' ? val : !isDarkMode;
    setIsDarkMode(newVal);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      user.isDarkMode = newVal;
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
