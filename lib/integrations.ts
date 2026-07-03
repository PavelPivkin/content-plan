import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { createDefaultState } from "./defaults";
import { FunctionType, HuntStage, PlannerState, Publication, Status } from "./types";
import { sheetTabs } from "./sheets-schema";

export function weekday(date: string) {
  if (!date) return "";
  return format(new Date(`${date}T12:00:00`), "EEEE", { locale: ru });
}

function hasMeaningfulContent(state: PlannerState) {
  return Object.values(state.product).some((value) => value.trim())
    || state.audience.some((item) => item.name.trim() || item.description.trim() || item.pains.trim() || item.clientWords.trim())
    || state.rubrics.some((item) => item.name.trim() || item.task.trim() || item.segment.trim())
    || state.ideas.length > 0
    || state.publications.length > 0;
}

export async function syncToSheets(state: PlannerState) {
  const { appsScriptUrl } = state.settings;
  if (!appsScriptUrl) {
    throw new Error("Добавьте Apps Script Web App URL для записи в Google Sheets.");
  }
  if (!hasMeaningfulContent(state)) {
    throw new Error("Синхронизация остановлена: проект не содержит заполненных данных. Это защищает Google Таблицу от случайной очистки.");
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "sync", state })
  });
  if (!response.ok) throw new Error(`Sheets sync failed: ${response.status}`);
  return response.json();
}

export async function pullFromSheets(state: PlannerState): Promise<PlannerState> {
  const { spreadsheetId, googleApiKey, appsScriptUrl } = state.settings;
  if (!spreadsheetId || !googleApiKey) {
    throw new Error("Для Pull нужны Google Spreadsheet ID и Google API key для чтения.");
  }

  const ranges = sheetTabs.map((tab) => `ranges=${encodeURIComponent(`'${tab.name}'!A:Z`)}`).join("&");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet?${ranges}&key=${encodeURIComponent(googleApiKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const details = await readGoogleError(response);
    if (response.status === 403 && appsScriptUrl) return pullViaAppsScript(state, details);
    throw new Error(`Sheets Pull: ${response.status}. ${details}`);
  }
  const payload = await response.json() as { valueRanges?: Array<{ values?: unknown[][] }> };
  const values = payload.valueRanges?.map((range) => range.values || []) || [];
  const rows = (index: number) => values[index]?.slice(1) || [];
  const text = (row: unknown[], index: number) => String(row[index] ?? "");
  const defaults = createDefaultState();
  const product = values[0]?.[1] || [];

  return {
    product: {
      name: text(product, 0), positioning: text(product, 1), usp: text(product, 2),
      competitorPositioning: text(product, 3), offer: text(product, 4)
    },
    audience: rows(1).map((row) => ({
      id: text(row, 0) || crypto.randomUUID(), name: text(row, 1), description: text(row, 2),
      huntStage: (text(row, 3) || "Осознает проблему") as HuntStage, pains: text(row, 4), clientWords: text(row, 5)
    })),
    rubrics: rows(2).map((row) => ({
      id: text(row, 0) || crypto.randomUUID(), name: text(row, 1), task: text(row, 2),
      functionType: (text(row, 3) || "Польза") as FunctionType, formats: text(row, 4), segment: text(row, 5),
      active: row[6] === true || text(row, 6).toLowerCase() === "true"
    })),
    ideas: rows(3).map((row) => ({
      id: text(row, 0) || crypto.randomUUID(), audience: text(row, 1), source: text(row, 2), clientPhrase: text(row, 3),
      hiddenPain: text(row, 4), meaning: text(row, 5), topic: text(row, 6), format: text(row, 7), rubric: text(row, 8),
      huntStage: (text(row, 9) || "Осознает проблему") as HuntStage, functionType: (text(row, 10) || "Польза") as FunctionType
    })),
    publications: rows(4).map((row) => ({
      id: text(row, 0) || crypto.randomUUID(), ideaId: "", publishDate: text(row, 1), publishTime: text(row, 2), weekday: text(row, 3),
      platform: text(row, 4), audience: text(row, 5), rubric: text(row, 6), functionType: (text(row, 7) || "Польза") as FunctionType,
      format: text(row, 8), topic: text(row, 9), hook: text(row, 10), theses: text(row, 11), cta: text(row, 12),
      offer: text(row, 13), status: (text(row, 14) || "Черновик") as Status
    })),
    settings: { ...defaults.settings, ...state.settings }
  };
}

async function readGoogleError(response: Response) {
  try {
    const payload = await response.json() as { error?: { message?: string } };
    return payload.error?.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

async function pullViaAppsScript(state: PlannerState, sheetsError: string): Promise<PlannerState> {
  const response = await fetch(state.settings.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "pull" })
  });
  if (!response.ok) {
    throw new Error(`Sheets API отклонил запрос: ${sheetsError}. Apps Script Pull: ${response.status}. Проверьте deployment Web App.`);
  }
  const payload = await response.json() as { ok?: boolean; state?: PlannerState; error?: string };
  if (!payload.ok || !payload.state) {
    throw new Error("Apps Script ещё не поддерживает Pull. Обновите код скрипта и создайте новую версию deployment.");
  }
  return {
    ...payload.state,
    publications: (payload.state.publications || []).map((publication) => ({ ...publication, ideaId: publication.ideaId || "", hook: publication.hook || "" })),
    settings: state.settings
  };
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
