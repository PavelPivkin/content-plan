"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultState } from "./defaults";
import { PlannerState } from "./types";
import { syncToSheets } from "./integrations";

const STORAGE_KEY = "content-marketing-planner:v1";
const AUTOSYNC_INTERVAL_MS = 30000;

type Store = {
  state: PlannerState;
  setState: React.Dispatch<React.SetStateAction<PlannerState>>;
  reset: () => void;
  syncStatus: {
    dirty: boolean;
    syncing: boolean;
    lastSyncedAt: string;
    error: string;
  };
  syncNow: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlannerState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    setHydrated(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (hydrated) setDirty(true);
  }, [state, hydrated]);

  async function syncNow() {
    if (!state.settings.appsScriptUrl || syncing) return;
    setSyncing(true);
    setError("");
    try {
      await syncToSheets(state);
      setDirty(false);
      setLastSyncedAt(new Date().toLocaleString("ru-RU"));
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Ошибка автосинхронизации");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dirty && state.settings.appsScriptUrl && !syncing) {
        void syncNow();
      }
    }, AUTOSYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [dirty, state, syncing]);

  const value = useMemo(
    () => ({
      state,
      setState,
      reset: () => setState(defaultState),
      syncStatus: { dirty, syncing, lastSyncedAt, error },
      syncNow
    }),
    [state, dirty, syncing, lastSyncedAt, error]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("usePlanner must be used inside StoreProvider");
  return ctx;
}
