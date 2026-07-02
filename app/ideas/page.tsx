"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AiGenerateButton } from "@/components/AiGenerateButton";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";
import { Idea } from "@/lib/types";
import { generateWithOpenAI, getGeneratedRows } from "@/lib/ai";

export default function IdeasPage() {
  const { state, setState } = usePlanner();

  function add(row?: Partial<Idea>) {
    const { id: _id, ...safeRow } = row || {};
    setState((prev) => ({
      ...prev,
      ideas: [...prev.ideas, { audience: prev.audience[0]?.name || "", source: "", clientPhrase: "", hiddenPain: "", meaning: "", topic: "", format: "Пост", rubric: "", huntStage: "Ищет решение", functionType: "Польза", ...safeRow, id: crypto.randomUUID() }]
    }));
  }

  async function autoFill(count: number) {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй банк идей из продукта, ЦА и рубрик", count });
    getGeneratedRows<Idea>(result, ["ideas", "идеи"]).forEach((row) => add(row));
  }

  return (
    <>
      <PageHeader
        title="Банк идей"
        subtitle="Здесь хранятся фразы клиентов, скрытые боли, смыслы и темы. Это сырье для рубрик и контент-плана."
        actions={
          <>
            <AiGenerateButton defaultCount={3} max={50} onGenerate={autoFill} />
            <Link className="btn btn-primary rounded-lg gap-2" href="/ideas/edit"><Plus size={16} />Добавить</Link>
          </>
        }
      />
      <DataTable
        rows={state.ideas}
        columns={[
          { key: "audience", label: "ЦА", tone: "primary" },
          { key: "source", label: "Где нашли" },
          { key: "clientPhrase", label: "Фраза клиента" },
          { key: "hiddenPain", label: "Что болит" },
          { key: "meaning", label: "Смысл" },
          { key: "topic", label: "Тема" },
          { key: "format", label: "Формат", tone: "accent" },
          { key: "rubric", label: "Рубрика" },
          { key: "huntStage", label: "Хант", tone: "primary" },
          { key: "functionType", label: "Функция", tone: "secondary" }
        ]}
        editHref={(id) => `/ideas/edit?id=${id}`}
        onDelete={(id) => setState((prev) => ({ ...prev, ideas: prev.ideas.filter((row) => row.id !== id) }))}
      />
    </>
  );
}
