"use client";

import { useState } from "react";
import { Check, Copy, FolderKanban, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";

export default function ProjectsPage() {
  const {
    projects,
    activeProjectId,
    createProject,
    switchProject,
    renameProject,
    duplicateProject,
    deleteProject
  } = usePlanner();
  const [newProjectName, setNewProjectName] = useState("");

  function create() {
    const name = newProjectName.trim();
    if (!name) return;
    createProject(name);
    setNewProjectName("");
  }

  function remove(id: string, name: string) {
    if (projects.length <= 1) return;
    if (window.confirm(`Удалить проект «${name}» из этого браузера?`)) deleteProject(id);
  }

  return (
    <>
      <PageHeader
        title="Проекты"
        subtitle="У каждого проекта свой продукт, ЦА, рубрики, идеи, контент-план и настройки интеграций."
      />

      <section className="premium-border mb-5 rounded-lg bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="form-control flex-1">
            <span className="label-text mb-1 font-semibold">Новый проект</span>
            <input
              className="input input-bordered rounded-lg"
              placeholder="Например, Личный бренд"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && create()}
            />
          </label>
          <button className="btn btn-primary rounded-lg gap-2 sm:self-end" onClick={create} disabled={!newProjectName.trim()}>
            <Plus size={17} />
            Создать
          </button>
        </div>
      </section>

      <div className="grid gap-3">
        {projects.map((project) => {
          const active = project.id === activeProjectId;
          const counts = [
            `${project.state.audience.length} ЦА`,
            `${project.state.rubrics.length} рубрик`,
            `${project.state.ideas.length} идей`,
            `${project.state.publications.length} публикаций`
          ];

          return (
            <article key={project.id} className={`premium-border rounded-lg bg-white/95 p-4 shadow-sm ${active ? "border-primary/35 ring-1 ring-primary/15" : ""}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FolderKanban className="text-primary" size={19} />
                    <input
                      className="input input-ghost h-9 min-w-0 max-w-md flex-1 rounded-lg px-2 text-lg font-bold"
                      value={project.name}
                      aria-label="Название проекта"
                      onChange={(event) => renameProject(project.id, event.target.value)}
                    />
                    {active && <span className="badge badge-primary gap-1 px-3 py-3"><Check size={13} />Активный</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral/55">
                    {counts.map((count) => <span key={count}>{count}</span>)}
                    <span>{project.state.settings.spreadsheetId || project.state.settings.appsScriptUrl ? "Google подключен" : "Без интеграции Google"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!active && <button className="btn btn-primary btn-sm rounded-lg" onClick={() => switchProject(project.id)}>Открыть</button>}
                  <button className="btn btn-outline btn-sm rounded-lg gap-1" onClick={() => duplicateProject(project.id)}><Copy size={14} />Дублировать</button>
                  <button className="btn btn-ghost btn-sm h-9 w-9 rounded-lg p-0 text-error" onClick={() => remove(project.id, project.name)} disabled={projects.length <= 1} title="Удалить проект"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
