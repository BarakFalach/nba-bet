'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import PageLoader from '@/components/PageLoader';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin();
  const { user, isLoading: userLoading } = useUser(); // Add isLoading from useUser
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    // Only redirect if we've confirmed the user exists and userLoading is false
    if (!userLoading) {
      if (user) {
        router.push('/');
      }
      // Mark the initial authentication check as complete
      setInitialCheckComplete(true);
    }
  }, [user, router, userLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login({ email, password });
      router.push('/'); 
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state if we're still checking authentication
  if (userLoading || !initialCheckComplete || loading) {
    return (
      <PageLoader/>
    );
  }

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-gray-900">
      <div className="w-full max-w-sm p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
          Welcome Back
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Sign Up Button */}
        <div className="mt-4 text-center">
          <p className="text-gray-700 dark:text-gray-300">Do not have an account?</p>
          <button
            onClick={() => router.push('/signup')}
            className="mt-2 text-blue-600 hover:underline font-semibold"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}