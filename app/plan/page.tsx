"use client";

import { addDays, formatISO } from "date-fns";
import Link from "next/link";
import { CalendarPlus, Plus } from "lucide-react";
import { AiGenerateButton } from "@/components/AiGenerateButton";
import { DataTable } from "@/components/DataTable";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { formats } from "@/lib/theory";
import { createCalendarTask, weekday } from "@/lib/integrations";
import { usePlanner } from "@/lib/store";
import { Publication } from "@/lib/types";
import { generateWithOpenAI, getGeneratedRows } from "@/lib/ai";

export default function PlanPage() {
  const { state, setState } = usePlanner();
  const sortedPublications = [...state.publications].sort((a, b) => {
    const left = `${a.publishDate || "9999-12-31"}T${a.publishTime || "23:59"}`;
    const right = `${b.publishDate || "9999-12-31"}T${b.publishTime || "23:59"}`;
    return left.localeCompare(right);
  });

  function add(row?: Partial<Publication>) {
    const date = row?.publishDate || formatISO(addDays(new Date(), state.publications.length), { representation: "date" });
    const { id: _id, ...safeRow } = row || {};
    setState((prev) => ({
      ...prev,
      publications: [...prev.publications, { ideaId: "", publishDate: date, publishTime: "10:00", weekday: weekday(date), platform: "Instagram", audience: prev.audience[0]?.name || "", rubric: "", functionType: "Польза", format: "Пост", topic: "", hook: "", theses: "", cta: "", offer: prev.product.offer, status: "Черновик", ...safeRow, id: crypto.randomUUID() }]
    }));
  }

  async function autoFill(count: number) {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй контент план с балансом функций. Темы бери из банка идей, если он заполнен, и разворачивай их в конкретные публикации.", count });
    getGeneratedRows<Publication>(result, ["publications", "plan", "contentPlan", "контентПлан"]).forEach((row, index) => {
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
            <AiGenerateButton defaultCount={3} max={60} onGenerate={autoFill} />
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
        rows={sortedPublications}
        columns={[
          { key: "topic", label: "Тема", render: (value) => <span className="line-clamp-3 whitespace-pre-wrap font-bold text-neutral">{String(value || "—")}</span> },
          { key: "rubric", label: "Рубрика" },
          { key: "functionType", label: "Функция", tone: "secondary" },
          { key: "audience", label: "ЦА", tone: "primary" },
          { key: "status", label: "Статус", tone: "primary" },
          { key: "publishDate", label: "Дата" },
          { key: "publishTime", label: "Время" }
        ]}
        viewHref={(id) => `/plan/view?id=${id}`}
        editHref={(id) => `/plan/edit?id=${id}`}
        onDelete={(id) => setState((prev) => ({ ...prev, publications: prev.publications.filter((row) => row.id !== id) }))}
      />
    </>
  );
}
