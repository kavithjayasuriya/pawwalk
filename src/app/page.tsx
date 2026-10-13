import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold text-emerald-700">
            🐾 PawWalk
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 text-6xl">🐕‍🦺</div>
        <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Professional dog walking
          <br />
          <span className="text-emerald-600">in your neighbourhood</span>
        </h1>
        <p className="mb-8 max-w-xl text-lg text-zinc-500">
          PawWalk connects your furry friend with trusted, local dog walkers.
          Book 30 or 60-minute walks with ease.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-md bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-zinc-300 px-8 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-50"
          >
            I have an account
          </Link>
        </div>

        {/* Services */}
        <div className="mt-20 grid max-w-3xl gap-8 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-6 text-left">
            <div className="mb-3 text-2xl">⏱️</div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900">
              30-Minute Walk
            </h2>
            <p className="text-sm text-zinc-500">
              A brisk walk to keep your dog active and happy. Perfect for
              smaller breeds or quick outings.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-6 text-left">
            <div className="mb-3 text-2xl">🏃</div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900">
              60-Minute Walk
            </h2>
            <p className="text-sm text-zinc-500">
              A full hour of exploration and exercise. Ideal for energetic
              dogs who love the outdoors.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} PawWalk. All rights reserved.
      </footer>
    </div>
  );
}

