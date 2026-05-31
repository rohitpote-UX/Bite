/**
 * TiffinFlow Office Context
 * Provides office settings and pricing across the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenToOfficeSettings } from '../services/firebase/firestore.service';
import { DEFAULTS } from '../constants/app';
import type { OfficeSettings } from '../types';
import { useAuth } from './AuthContext';

interface OfficeContextType {
  settings: OfficeSettings | null;
  vegPrice: number;
  nonVegPrice: number;
  cutoffTime: string;
  officeName: string;
  isLoading: boolean;
}

const OfficeContext = createContext<OfficeContextType>({
  settings: null,
  vegPrice: DEFAULTS.VEG_PRICE,
  nonVegPrice: DEFAULTS.NON_VEG_PRICE,
  cutoffTime: DEFAULTS.CUTOFF_TIME,
  officeName: 'My Office',
  isLoading: true,
});

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.officeId) {
      setIsLoading(false);
      return;
    }

    const unsub = listenToOfficeSettings(userProfile.officeId, (s) => {
      setSettings(s);
      setIsLoading(false);
    });

    return unsub;
  }, [userProfile?.officeId]);

  return (
    <OfficeContext.Provider value={{
      settings,
      vegPrice: settings?.vegPrice ?? DEFAULTS.VEG_PRICE,
      nonVegPrice: settings?.nonVegPrice ?? DEFAULTS.NON_VEG_PRICE,
      cutoffTime: settings?.cutoffTime ?? DEFAULTS.CUTOFF_TIME,
      officeName: settings?.officeName ?? 'My Office',
      isLoading,
    }}>
      {children}
    </OfficeContext.Provider>
  );
};

export const useOffice = () => useContext(OfficeContext);
