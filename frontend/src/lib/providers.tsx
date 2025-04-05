import { UserProvider } from '@/hooks/useUser';
import React from 'react';

export const WithProviders = <T extends React.ComponentType<any>>(
  Component: T
) => {
  const WrappedComponent = (props: any) => {
    return (
      <UserProvider>
        <Component {...props} />
      </UserProvider>
    );
  };

  WrappedComponent.displayName = `WithProviders(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
};
