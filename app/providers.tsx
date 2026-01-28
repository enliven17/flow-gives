'use client';

import { useEffect } from 'react';
import { configureFCL } from '@/lib/config/fcl.config';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configure FCL on client-side mount
    configureFCL();
  }, []);

  return <>{children}</>;
}
