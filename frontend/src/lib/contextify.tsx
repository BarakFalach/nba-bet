'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export function contextify<T>(useHook: () => T) {
  const Context = createContext<T | undefined>(undefined);

  const useContextifiedHook = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useContextifiedHook must be used within its Provider');
    }
    return context;
  };

  const Provider = ({ children }: { children: ReactNode }) => {
    const value = useHook();
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  return { useContextifiedHook, Provider };
}