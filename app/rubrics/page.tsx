"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AiGenerateButton } from "@/components/AiGenerateButton";
import { DataTable } from "@/components/DataTable";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { formats } from "@/lib/theory";
import { usePlanner } from "@/lib/store";
import { Rubric } from "@/lib/types";
import { generateWithOpenAI, getGeneratedRows } from "@/lib/ai";
import { TagList } from "@/components/FormCard";

export default function RubricsPage() {
  const { state, setState } = usePlanner();

  function add(row?: Partial<Rubric>) {
    const { id: _id, ...safeRow } = row || {};
    setState((prev) => ({
      ...prev,
      rubrics: [...prev.rubrics, { name: "", task: "", functionType: "Польза", formats: formats.slice(0, 2).join(", "), segment: "", active: true, ...safeRow, id: crypto.randomUUID() }]
    }));
  }

  async function autoFill(count: number) {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй рубрики для контент-системы", count });
    getGeneratedRows<Rubric>(result, ["rubrics", "рубрики"]).forEach((row) => add(row));
  }

  return (
    <>
      <PageHeader
        title="Рубрики"
        subtitle="Соберите повторяемые смысловые контейнеры. У каждой рубрики должна быть задача, функция и набор рабочих форматов."
        actions={
          <>
            <AiGenerateButton defaultCount={3} max={20} onGenerate={autoFill} />
            <Link className="btn btn-primary rounded-lg gap-2" href="/rubrics/edit"><Plus size={16} />Добавить</Link>
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span>Как проверить рубрику</span>
        <Help id="rubric" />
        <span className="ml-4">Как выбрать формат</span>
        <Help id="format" />
      </div>
      <DataTable
        rows={state.rubrics}
        columns={[
          { key: "name", label: "Рубрика" },
          { key: "task", label: "Задача" },
          { key: "functionType", label: "Функция", tone: "secondary" },
          { key: "formats", label: "Форматы", render: (value) => <TagList value={String(value || "")} /> },
          { key: "segment", label: "Сегмент" },
          { key: "active", label: "Активна" }
        ]}
        editHref={(id) => `/rubrics/edit?id=${id}`}
        onDelete={(id) => setState((prev) => ({ ...prev, rubrics: prev.rubrics.filter((row) => row.id !== id) }))}
      />
    </>
  );
}
