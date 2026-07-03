"use client";

import { Download, DownloadCloud, Upload, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { usePlanner } from "@/lib/store";
import { Settings } from "@/lib/types";

export function SettingsPanel() {
  const { state, updateSettings, projects, activeProjectId, syncStatus, publishNow, pullNow } = usePlanner();
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeProject = projects.find((project) => project.id === activeProjectId);

  function update(key: keyof typeof state.settings, value: string) {
    updateSettings({ [key]: value });
  }

  function exportSettings() {
    const blob = new Blob([JSON.stringify(state.settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `content-lab-${activeProject?.name || "project"}-integrations.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Настройки интеграций выгружены в JSON.");
  }

  async function importSettings(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Settings>;
      const allowedKeys: Array<keyof Settings> = ["spreadsheetId", "googleApiKey", "appsScriptUrl", "calendarId", "openaiApiKey", "openaiModel"];
      const next = allowedKeys.reduce<Partial<Settings>>((acc, key) => {
        if (typeof parsed[key] === "string") acc[key] = parsed[key];
        return acc;
      }, {});
      updateSettings(next);
      setMessage("Настройки интеграций загружены и сохранены локально.");
    } catch {
      setMessage("Не удалось прочитать JSON с настройками интеграций.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function publish() {
    setMessage("Публикую в Google Таблицу...");
    try {
      await publishNow();
      setMessage("Данные опубликованы в Google Таблицу.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось опубликовать данные.");
    }
  }

  async function pull() {
    setMessage("Загружаю из Google Таблицы...");
    try {
      await pullNow();
      setMessage("Данные загружены из Google Таблицы.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить данные.");
    }
  }

  return (
    <div className="glass-panel premium-border rounded-xl p-5">
      <div className="mb-5 border-b border-base-300 pb-4">
        <div className="text-xs font-bold uppercase tracking-wide text-primary">Текущий проект</div>
        <div className="mt-1 text-xl font-bold">{activeProject?.name || "Проект"}</div>
        <p className="mt-1 text-sm text-neutral/55">Эти ключи и адреса используются только для выбранного проекта.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="form-control">
          <span className="label-text mb-1 font-semibold">Google Spreadsheet ID</span>
          <input className="input input-bordered rounded-lg" placeholder="1abc..." value={state.settings.spreadsheetId} onChange={(e) => update("spreadsheetId", e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 font-semibold">Google API key для чтения</span>
          <input className="input input-bordered rounded-lg" placeholder="AIza..." value={state.settings.googleApiKey} onChange={(e) => update("googleApiKey", e.target.value)} />
        </label>
        <label className="form-control md:col-span-2">
          <span className="label-text mb-1 font-semibold">Apps Script Web App URL для записи</span>
          <input className="input input-bordered rounded-lg" placeholder="https://script.google.com/macros/s/..." value={state.settings.appsScriptUrl} onChange={(e) => update("appsScriptUrl", e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 font-semibold">Google Calendar ID</span>
          <input className="input input-bordered rounded-lg" placeholder="primary или calendar id" value={state.settings.calendarId} onChange={(e) => update("calendarId", e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 font-semibold">OpenAI model</span>
          <input className="input input-bordered rounded-lg" value={state.settings.openaiModel} onChange={(e) => update("openaiModel", e.target.value)} />
        </label>
        <label className="form-control md:col-span-2">
          <span className="label-text mb-1 font-semibold">OpenAI API key</span>
          <input className="input input-bordered rounded-lg" placeholder="sk-..." type="password" value={state.settings.openaiApiKey} onChange={(e) => update("openaiApiKey", e.target.value)} />
        </label>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button className="btn btn-outline rounded-lg gap-2" onClick={pull} disabled={syncStatus.syncing}>
          <DownloadCloud size={16} />
          Pull
        </button>
        <button className="btn btn-primary rounded-lg gap-2" onClick={publish} disabled={syncStatus.syncing}>
          <UploadCloud size={16} />
          Publish
        </button>
        <button className="btn btn-outline rounded-lg gap-2" onClick={exportSettings}>
          <Download size={16} />
          Выгрузить JSON
        </button>
        <button className="btn btn-outline rounded-lg gap-2" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
          Загрузить JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importSettings(event.target.files?.[0] || null)} />
        <span className="text-sm text-neutral/60">{message}</span>
      </div>
      <div className="mt-4 rounded-xl border border-base-300/70 bg-base-100/75 p-4 text-sm leading-6 text-neutral/70">
        <b>Ручная синхронизация.</b> Pull загружает данные из таблицы, Publish полностью заменяет данные в таблице текущим проектом.
        <br />
        <span>{syncStatus.dirty ? "Есть локальные изменения, которые ещё не опубликованы." : "Локальных неопубликованных изменений нет."}</span>
        {syncStatus.lastSyncedAt && <span> Последняя синхронизация: {syncStatus.lastSyncedAt}.</span>}
        {syncStatus.error && <div className="mt-2 text-error">{syncStatus.error}</div>}
      </div>
    </div>
  );
}
