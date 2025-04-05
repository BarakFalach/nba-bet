import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Sign up the user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName:name, // Save the user's name in the metadata
        },
      },
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'User signed up successfully', data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}