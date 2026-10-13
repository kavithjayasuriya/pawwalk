import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const displayName =
    user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-emerald-700"
          >
            🐾 PawWalk
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Dashboard
            </Link>
            <Link
              href="/dogs"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              My Dogs
            </Link>
            <Link
              href="/book"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Book a Walk
            </Link>
            <Link
              href="/bookings"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              My Bookings
            </Link>
            <span className="text-sm text-zinc-400">
              Hi, {displayName}
            </span>
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
