"use client";

import { addDays, formatISO } from "date-fns";
import Link from "next/link";
import { CalendarPlus, Plus, Wand2 } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { formats } from "@/lib/theory";
import { createCalendarTask, weekday } from "@/lib/integrations";
import { usePlanner } from "@/lib/store";
import { Publication } from "@/lib/types";
import { generateWithOpenAI } from "@/lib/ai";

export default function PlanPage() {
  const { state, setState } = usePlanner();

  function add(row?: Partial<Publication>) {
    const date = row?.publishDate || formatISO(addDays(new Date(), state.publications.length), { representation: "date" });
    setState((prev) => ({
      ...prev,
      publications: [...prev.publications, { id: crypto.randomUUID(), publishDate: date, publishTime: "10:00", weekday: weekday(date), platform: "Instagram", audience: prev.audience[0]?.name || "", rubric: "", functionType: "Польза", format: "Пост", topic: "", theses: "", cta: "", offer: prev.product.offer, status: "Черновик", ...row }]
    }));
  }

  async function autoFill() {
    const rows = await generateWithOpenAI({ state, task: "Сгенерируй контент план с балансом функций", count: 14 });
    rows.forEach((row: Partial<Publication>, index: number) => {
      const date = formatISO(addDays(new Date(), index), { representation: "date" });
      add({ publishDate: date, weekday: weekday(date), ...row });
    });
  }

  async function calendarForFirstReady() {
    const pub = state.publications.find((row) => row.status === "Запланировано") || state.publications[0];
    if (pub) await createCalendarTask(state, pub);
  }

  return (
    <>
      <PageHeader
        title="Контент план"
        subtitle="Разложите идеи по датам, площадкам и форматам. День недели считается автоматически, а запланированные публикации можно отправлять в Google Calendar."
        actions={
          <>
            <button className="btn btn-outline rounded-lg gap-2" onClick={autoFill}><Wand2 size={16} />+14 с ИИ</button>
            <button className="btn btn-outline rounded-lg gap-2" onClick={calendarForFirstReady}><CalendarPlus size={16} />В календарь</button>
            <Link className="btn btn-primary rounded-lg gap-2" href="/plan/edit"><Plus size={16} />Добавить</Link>
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span>Проверка баланса</span>
        <Help id="balance" />
      </div>
      <DataTable
        rows={state.publications}
        columns={[
          { key: "publishDate", label: "Дата" },
          { key: "publishTime", label: "Время" },
          { key: "weekday", label: "День" },
          { key: "platform", label: "Площадка", tone: "neutral" },
          { key: "audience", label: "ЦА", tone: "primary" },
          { key: "rubric", label: "Рубрика" },
          { key: "functionType", label: "Функция", tone: "secondary" },
          { key: "format", label: "Формат", tone: "accent" },
          { key: "topic", label: "Тема" },
          { key: "theses", label: "Тезисы" },
          { key: "cta", label: "CTA" },
          { key: "offer", label: "Оффер" },
          { key: "status", label: "Статус", tone: "primary" }
        ]}
        editHref={(id) => `/plan/edit?id=${id}`}
        onDelete={(id) => setState((prev) => ({ ...prev, publications: prev.publications.filter((row) => row.id !== id) }))}
      />
    </>
  );
}
