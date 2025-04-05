'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSignUp } from '../../hooks/useSignUp';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useSignUp();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signUp({ name, email, password });
      setMessage('A verification email has been sent to your email address. Please verify your email to continue.');
    } catch (error: any) {
      setError(error.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white dark:bg-black">
      <div className="w-full max-w-sm p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
          Create Account
        </h1>

        {message ? (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Disable input while loading
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Disable input while loading
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Disable input while loading
            />
            <button
              type="submit"
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}

        {!message && (
          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}