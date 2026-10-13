'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/auth';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    >
      Log out
    </button>
  );
}
