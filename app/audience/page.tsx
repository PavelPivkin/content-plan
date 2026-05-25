"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";

export default function AudiencePage() {
  const { state, setState } = usePlanner();

  return (
    <>
      <PageHeader
        title="Целевая аудитория"
        subtitle="Опишите сегменты, их контекст, боли и реальные слова. Из этого будут собираться смыслы и темы."
        actions={<Link className="btn btn-primary rounded-lg gap-2" href="/audience/edit"><Plus size={16} />Добавить сегмент</Link>}
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
