"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AiGenerateButton } from "@/components/AiGenerateButton";
import { DataTable } from "@/components/DataTable";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { generateWithOpenAI, getGeneratedRows } from "@/lib/ai";
import { usePlanner } from "@/lib/store";
import { AudienceSegment } from "@/lib/types";

export default function AudiencePage() {
  const { state, setState } = usePlanner();

  function add(row?: Partial<AudienceSegment>) {
    const { id: _id, ...safeRow } = row || {};
    setState((prev) => ({
      ...prev,
      audience: [...prev.audience, { name: "", description: "", huntStage: "Осознает проблему", pains: "", clientWords: "", ...safeRow, id: crypto.randomUUID() }]
    }));
  }

  async function autoFill(count: number) {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй сегменты целевой аудитории для продукта", count });
    getGeneratedRows<AudienceSegment>(result, ["audience", "segments", "сегменты"]).forEach((row) => add(row));
  }

  return (
    <>
      <PageHeader
        title="Целевая аудитория"
        subtitle="Опишите сегменты, их контекст, боли и реальные слова. Из этого будут собираться смыслы и темы."
        actions={
          <>
            <AiGenerateButton defaultCount={3} max={15} onGenerate={autoFill} />
            <Link className="btn btn-primary rounded-lg gap-2" href="/audience/edit"><Plus size={16} />Добавить сегмент</Link>
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span>Подсказка по осознанности</span>
        <Help id="hunt" />
      </div>
      <DataTable
        rows={state.audience}
        columns={[
          { key: "name", label: "Сегмент" },
          { key: "description", label: "Описание" },
          { key: "huntStage", label: "Ступень Ханта", tone: "primary" },
          { key: "pains", label: "Боли / желания" },
          { key: "clientWords", label: "Слова клиента" }
        ]}
        editHref={(id) => `/audience/edit?id=${id}`}
        onDelete={(id) => setState((prev) => ({ ...prev, audience: prev.audience.filter((row) => row.id !== id) }))}
      />
    </>
  );
}
