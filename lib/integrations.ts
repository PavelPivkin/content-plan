import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PlannerState, Publication } from "./types";

export function weekday(date: string) {
  if (!date) return "";
  return format(new Date(`${date}T12:00:00`), "EEEE", { locale: ru });
}

export async function syncToSheets(state: PlannerState) {
  const { appsScriptUrl } = state.settings;
  if (!appsScriptUrl) {
    throw new Error("Добавьте Apps Script Web App URL для записи в Google Sheets.");
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sync", state })
  });
  if (!response.ok) throw new Error(`Sheets sync failed: ${response.status}`);
  return response.json();
}

export async function createCalendarTask(state: PlannerState, publication: Publication) {
  const { appsScriptUrl, calendarId } = state.settings;
  if (!appsScriptUrl || !calendarId) {
    throw new Error("Для календаря нужны Apps Script Web App URL и Calendar ID.");
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "calendar", calendarId, publication })
  });
  if (!response.ok) throw new Error(`Calendar task failed: ${response.status}`);
  return response.json();
}
