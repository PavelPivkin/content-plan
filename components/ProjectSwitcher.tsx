"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { usePlanner } from "@/lib/store";

export function ProjectSwitcher({ compact = false }: { compact?: boolean }) {
  const { projects, activeProjectId, switchProject } = usePlanner();

  if (compact) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <select
          aria-label="Текущий проект"
          className="select select-bordered select-sm min-w-0 max-w-44 flex-1 rounded-lg bg-base-100"
          value={activeProjectId}
          onChange={(event) => switchProject(event.target.value)}
        >
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <Link className="btn btn-ghost btn-sm h-9 w-9 shrink-0 rounded-lg p-0" href="/projects" title="Управление проектами">
          <FolderKanban size={17} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-base-300/80 bg-base-100/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-neutral/45">Проект</span>
        <Link className="btn btn-ghost btn-xs h-7 w-7 rounded-lg p-0" href="/projects" title="Управление проектами">
          <FolderKanban size={15} />
        </Link>
      </div>
      <select
        aria-label="Текущий проект"
        className="select select-bordered select-sm w-full rounded-lg bg-white"
        value={activeProjectId}
        onChange={(event) => switchProject(event.target.value)}
      >
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
    </div>
  );
}
