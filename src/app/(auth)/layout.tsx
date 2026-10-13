import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="mb-8">
        <Link href="/" className="text-2xl font-bold text-emerald-700">
          🐾 PawWalk
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
