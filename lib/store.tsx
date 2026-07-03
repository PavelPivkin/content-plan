"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDefaultState, defaultState } from "./defaults";
import { PlannerState, Project, Settings, Workspace } from "./types";
import { pullFromSheets, syncToSheets } from "./integrations";

const LEGACY_STORAGE_KEY = "content-marketing-planner:v1";
const WORKSPACE_STORAGE_KEY = "content-marketing-planner:workspace:v2";

type Store = {
  state: PlannerState;
  setState: React.Dispatch<React.SetStateAction<PlannerState>>;
  updateSettings: (settings: Partial<Settings>) => void;
  projects: Project[];
  activeProjectId: string;
  createProject: (name: string) => string;
  switchProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  reset: () => void;
  syncStatus: {
    dirty: boolean;
    syncing: boolean;
    lastSyncedAt: string;
    error: string;
  };
  publishNow: () => Promise<void>;
  pullNow: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function mergeStoredState(stored: Partial<PlannerState>): PlannerState {
  const publications = stored.publications?.map((publication) => ({
    ...publication,
    ideaId: publication.ideaId || "",
    hook: publication.hook || ""
  }));

  return {
    ...defaultState,
    ...stored,
    product: { ...defaultState.product, ...stored.product },
    settings: { ...defaultState.settings, ...stored.settings },
    audience: stored.audience || createDefaultState().audience,
    rubrics: stored.rubrics || createDefaultState().rubrics,
    ideas: stored.ideas || [],
    publications: publications || []
  };
}

function makeProject(name: string, state = createDefaultState(), id = crypto.randomUUID()): Project {
  const now = new Date().toISOString();
  return { id, name: name.trim() || "Новый проект", createdAt: now, updatedAt: now, state };
}

function initialWorkspace(): Workspace {
  const project = makeProject("Основной проект", createDefaultState(), "project-default");
  return { version: 2, activeProjectId: project.id, projects: [project] };
}

function parseWorkspace(raw: string): Workspace | null {
  const parsed = JSON.parse(raw) as Partial<Workspace>;
  if (parsed.version !== 2 || !Array.isArray(parsed.projects) || parsed.projects.length === 0) return null;

  const projects = parsed.projects.map((project) => ({
    ...project,
    name: project.name || "Проект",
    state: mergeStoredState(project.state || {})
  })) as Project[];
  const activeProjectId = projects.some((project) => project.id === parsed.activeProjectId)
    ? parsed.activeProjectId as string
    : projects[0].id;

  return { version: 2, activeProjectId, projects };
}

function cloneState(state: PlannerState): PlannerState {
  return JSON.parse(JSON.stringify(state)) as PlannerState;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [dirtyProjectIds, setDirtyProjectIds] = useState<Set<string>>(new Set());
  const [syncingProjectId, setSyncingProjectId] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeProject = workspace.projects.find((project) => project.id === workspace.activeProjectId) || workspace.projects[0];
  const state = activeProject?.state || defaultState;

  useEffect(() => {
    try {
      const workspaceRaw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      const storedWorkspace = workspaceRaw ? parseWorkspace(workspaceRaw) : null;
      if (storedWorkspace) {
        setWorkspace(storedWorkspace);
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          const legacyState = mergeStoredState(JSON.parse(legacyRaw));
          const project = makeProject(legacyState.product.name || "Основной проект", legacyState);
          setWorkspace({ version: 2, activeProjectId: project.id, projects: [project] });
        }
      }
    } catch {
      // Keep the safe initial workspace if local data cannot be parsed.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace, hydrated]);

  const setState = useCallback<React.Dispatch<React.SetStateAction<PlannerState>>>(
    (action) => {
      const projectId = workspace.activeProjectId;
      setWorkspace((prev) => ({
        ...prev,
        projects: prev.projects.map((project) => {
          if (project.id !== projectId) return project;
          const nextState = typeof action === "function"
            ? (action as (prevState: PlannerState) => PlannerState)(project.state)
            : action;
          return { ...project, state: nextState, updatedAt: new Date().toISOString() };
        })
      }));
      setDirtyProjectIds((prev) => new Set(prev).add(projectId));
    },
    [workspace.activeProjectId]
  );

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    const projectId = workspace.activeProjectId;
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => project.id === projectId
        ? {
            ...project,
            state: { ...project.state, settings: { ...project.state.settings, ...settings } },
            updatedAt: new Date().toISOString()
          }
        : project)
    }));
  }, [workspace.activeProjectId]);

  function createProject(name: string) {
    const project = makeProject(name);
    setWorkspace((prev) => ({ ...prev, activeProjectId: project.id, projects: [...prev.projects, project] }));
    return project.id;
  }

  function switchProject(id: string) {
    if (!workspace.projects.some((project) => project.id === id)) return;
    setWorkspace((prev) => ({ ...prev, activeProjectId: id }));
  }

  function renameProject(id: string, name: string) {
    const nextName = name.trim();
    if (!nextName) return;
    setWorkspace((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => project.id === id ? { ...project, name: nextName, updatedAt: new Date().toISOString() } : project)
    }));
  }

  function duplicateProject(id: string) {
    const source = workspace.projects.find((project) => project.id === id);
    if (!source) return;
    const project = makeProject(`${source.name} — копия`, cloneState(source.state));
    setWorkspace((prev) => ({ ...prev, activeProjectId: project.id, projects: [...prev.projects, project] }));
  }

  function deleteProject(id: string) {
    if (workspace.projects.length <= 1) return;
    setWorkspace((prev) => {
      const projects = prev.projects.filter((project) => project.id !== id);
      return {
        ...prev,
        projects,
        activeProjectId: prev.activeProjectId === id ? projects[0].id : prev.activeProjectId
      };
    });
    setDirtyProjectIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function syncProject(projectId: string) {
    const project = workspace.projects.find((candidate) => candidate.id === projectId);
    if (!project?.state.settings.appsScriptUrl) {
      throw new Error("Для Publish нужен Apps Script Web App URL.");
    }
    if (syncingProjectId) throw new Error("Дождитесь завершения текущей операции.");
    setSyncingProjectId(projectId);
    setErrors((prev) => ({ ...prev, [projectId]: "" }));
    try {
      await syncToSheets(project.state);
      setDirtyProjectIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      setLastSyncedAt((prev) => ({ ...prev, [projectId]: new Date().toLocaleString("ru-RU") }));
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Ошибка публикации в Google Sheets";
      setErrors((prev) => ({
        ...prev,
        [projectId]: message
      }));
      throw syncError;
    } finally {
      setSyncingProjectId("");
    }
  }

  async function publishNow() {
    await syncProject(workspace.activeProjectId);
  }

  const activeDirty = dirtyProjectIds.has(workspace.activeProjectId);

  async function pullNow() {
    const projectId = workspace.activeProjectId;
    setSyncingProjectId(projectId);
    setErrors((prev) => ({ ...prev, [projectId]: "" }));
    try {
      const pulledState = await pullFromSheets(state);
      setWorkspace((prev) => ({
        ...prev,
        projects: prev.projects.map((project) => project.id === projectId
          ? { ...project, state: pulledState, updatedAt: new Date().toISOString() }
          : project)
      }));
      setDirtyProjectIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
      setLastSyncedAt((prev) => ({ ...prev, [projectId]: new Date().toLocaleString("ru-RU") }));
    } catch (pullError) {
      const message = pullError instanceof Error ? pullError.message : "Ошибка загрузки из Google Sheets";
      setErrors((prev) => ({ ...prev, [projectId]: message }));
      throw pullError;
    } finally {
      setSyncingProjectId("");
    }
  }

  const value = useMemo<Store>(
    () => ({
      state,
      setState,
      updateSettings,
      projects: workspace.projects,
      activeProjectId: workspace.activeProjectId,
      createProject,
      switchProject,
      renameProject,
      duplicateProject,
      deleteProject,
      reset: () => setState(createDefaultState()),
      syncStatus: {
        dirty: activeDirty,
        syncing: syncingProjectId === workspace.activeProjectId,
        lastSyncedAt: lastSyncedAt[workspace.activeProjectId] || "",
        error: errors[workspace.activeProjectId] || ""
      },
      publishNow,
      pullNow
    }),
    [state, setState, updateSettings, workspace, activeDirty, syncingProjectId, lastSyncedAt, errors]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlanner() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("usePlanner must be used inside StoreProvider");
  return ctx;
}
