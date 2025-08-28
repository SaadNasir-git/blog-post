'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false,
      speed: 500,
      trickleSpeed: 200,
    });

    // Handle all link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.host === window.location.host) {
        NProgress.start();
      }
    };

    // Handle history changes (back/forward buttons)
    const handleHistoryChange = () => {
      NProgress.start();
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handleHistoryChange);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handleHistoryChange);
    };
  }, []);

  useEffect(() => {
    // Complete progress when route changes
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}