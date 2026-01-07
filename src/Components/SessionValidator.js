'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken } from '@/utils/sessionStorage';

/**
 * SessionValidator Component
 * Only checks if user should be on protected routes
 * Does NOT validate or clear data - that's handled by ReduxProvider
 */
export default function SessionValidator({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedRef.current) {
      return;
    }
    hasCheckedRef.current = true;

    // List of public routes that don't require auth
    const publicRoutes = [
      '/login', 
      '/super-admin-secure-login', 
      '/login', 
      '/login',
      '/' // Home page
    ];

    // If on public route, allow access
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
      console.log('✅ Public route - no auth required');
      return;
    }

    // For protected routes, check if token exists
    const token = getToken();
    if (!token) {
      console.log('⚠️ Protected route but no token - redirecting to login');
      router.push('/login');
    } else {
      console.log('✅ Protected route - token present');
    }

  }, []); // Run only once on mount

  return <>{children}</>;
}
//   }, []); // Run only once on mount

//   return <>{children}</>;
// }
