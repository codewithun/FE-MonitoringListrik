"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Only show the splash screen once per browser session
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setShow(false);
      return;
    }

    const duration = 2000;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setFadeOut(true);
        setTimeout(() => {
          setShow(false);
          sessionStorage.setItem("hasSeenSplash", "true");
        }, 500); // 500ms fade out duration
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white px-6 py-16 pb-12 transition-opacity duration-500 ease-in-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex-1 flex items-center justify-center">
        <img 
          src="/LogoNama.svg" 
          alt="WattWise Logo" 
          className="w-48 h-48 object-contain" 
        />
      </div>
      
      <div className="w-full max-w-[200px] h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-6">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
