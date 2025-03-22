'use client';

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white dark:bg-black">
      <div className="w-full max-w-sm p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
          Welcome Back
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
          >
            Login
          </button>
        </div>

        <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
          Don’t have an account? <span className="text-blue-600">Sign up</span>
        </p>
      </div>
    </div>
  );
}
