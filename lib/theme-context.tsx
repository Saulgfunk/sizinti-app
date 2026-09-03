import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemeOverride = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-override';

type ThemeContextValue = {
  override: ThemeOverride;
  setOverride: (value: ThemeOverride) => void;
  resolvedScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue>({
  override: 'system',
  setOverride: () => {},
  resolvedScheme: 'light',
});

// Manual toggle — P1/v0.2 per docs/04_Screens_and_Features.md and
// docs/08_Roadmap.md, built ahead of schedule at the user's explicit
// request. Device-local (AsyncStorage), not synced — there's no field for
// it in docs/05_Data_Model.md, and a display preference like this doesn't
// need cross-device sync the way account data does.
export function ThemeOverrideProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [override, setOverrideState] = useState<ThemeOverride>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') setOverrideState(stored);
    });
  }, []);

  const setOverride = (value: ThemeOverride) => {
    setOverrideState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const resolvedScheme: 'light' | 'dark' = override === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : override;

  return (
    <ThemeContext.Provider value={{ override, setOverride, resolvedScheme }}>{children}</ThemeContext.Provider>
  );
}

export function useThemeOverride() {
  return useContext(ThemeContext);
}
