
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export const useSafeNavigation = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  // React Hooks must be called unconditionally
  // Attempt to get Next.js router context (might fail in raw React but required by linter)
  const router = useRouter(); // May throw if outside Next context, but standard usage implies Next.js
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const push = useCallback((href: string) => {
    if (router) {
      try {
        router.push(href);
      } catch (e) {
        console.warn("Router push failed:", e);
        // Fallback to window navigation if router fails
        if (typeof window !== 'undefined') {
          window.location.href = href;
        }
      }
    } else if (typeof window !== 'undefined') {
      // In SPA mode without router, simple location assignment
      // preventDefault should be handled by the caller if they want SPA transition via state
      window.location.href = href;
    }
  }, [router]);

  const safePathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');

  return {
    router,
    pathname: safePathname,
    searchParams,
    push,
    isMounted
  };
};
