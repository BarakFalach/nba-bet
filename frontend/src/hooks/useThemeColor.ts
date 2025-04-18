import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes'; // If you're using next-themes

export function useThemeColor() {
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    // Update theme-color meta tag when theme changes
    const themeColor = resolvedTheme === 'dark' ? '#101828' : '#ffffff';
    
    // Update meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);
    
    // Update status bar on iOS if in standalone mode
    if ((window.navigator as any)?.standalone) {
      document.documentElement.style.setProperty('--status-bar-background', themeColor);
    }
  }, [resolvedTheme]);
}

export function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Check if running as a standalone PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandalone);
    
    // Add a class to the body for PWA-specific styles
    if (isStandalone) {
      document.body.classList.add('pwa-mode');
    }
  }, []);
  
  return { isStandalone };
}