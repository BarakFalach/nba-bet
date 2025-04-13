import { UserProvider } from '@/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient();

export const WithProviders = <T extends React.ComponentType<any>>(
  Component: T
) => {
  const WrappedComponent = (props: any) => {
    return (
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <Component {...props} />
        </UserProvider>
      </QueryClientProvider>
    );
  };

  WrappedComponent.displayName = `WithProviders(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
};