// Theme management system
class ThemeManager {
  constructor() {
    this.themeSelect = document.getElementById('theme-select');
    this.init();
  }

  init() {
    // Set the dropdown to match current theme
    const currentTheme = document.documentElement.getAttribute('data-theme');
    this.themeSelect.value = currentTheme;

    // Listen for theme changes
    this.themeSelect.addEventListener('change', (e) => {
      this.setTheme(e.target.value);
    });
  }

  setTheme(themeName) {
    // Update the data attribute
    document.documentElement.setAttribute('data-theme', themeName);

    // Save to localStorage
    localStorage.setItem('theme', themeName);

    // Optional: Send to server for logged-in users
    // this.saveThemeToServer(themeName);
  }

  // Optional: Save theme preference to server for logged-in users
  async saveThemeToServer(themeName) {
    try {
      await fetch('/api/save-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        body: JSON.stringify({ theme: themeName }),
      });
    } catch (error) {
      console.error('Failed to save theme to server:', error);
    }
  }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});

// Optional: Listen for system theme changes (if you want to offer auto-switching)
if (window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually selected a theme
    const hasManualTheme = localStorage.getItem('theme');
    if (!hasManualTheme) {
      const autoTheme = e.matches ? 'photon' : 'yotsuba';
      document.documentElement.setAttribute('data-theme', autoTheme);
      document.getElementById('theme-select').value = autoTheme;
    }
  });
}
