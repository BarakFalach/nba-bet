import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export const withAuth = (Component: React.ComponentType) => {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter();
    const { user } = useUser();

    useEffect(() => {
      if (!user) {
        router.push('/login');
      }
    }, [user, router]);

    if (!user) {
      return null; 
    }

    return <Component {...props} />;
  };
};