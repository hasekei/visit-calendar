"use client";

import { useEffect, useState } from "react";

const SETTINGS_KEY = "visit-calendar-settings";

export interface Settings {
  defaultDurationMinutes: number;
}

const DEFAULT_SETTINGS: Settings = {
  defaultDurationMinutes: 30,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return { settings, updateSettings };
}
