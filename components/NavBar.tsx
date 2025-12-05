'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (pathname === '/auth') {
    return null;
  }

  return (
    <nav className="bg-primary-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              MarketMuse.ai
            </Link>
            {userEmail && (
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="hover:bg-primary-600 px-3 py-2 rounded-md transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects/new"
                  className="hover:bg-primary-600 px-3 py-2 rounded-md transition"
                >
                  New Project
                </Link>
              </div>
            )}
          </div>
          {userEmail && (
            <div className="flex items-center space-x-4">
              <span className="text-sm">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-md transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
