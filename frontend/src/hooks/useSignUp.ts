
export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

export const useSignUp =() => {
  const signUp = async (credentials: SignUpCredentials) => {
    const { name, email, password } = credentials;

    try {
      const response = await fetch('/api/auth/signUp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }
  
      return data;
    } catch (error: any) {
      console.error('Error during sign up:', error.message);
      throw error;
    }
  }
  return {
    signUp,
  };
}