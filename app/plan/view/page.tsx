"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";
import { Publication } from "@/lib/types";

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <section className={`glass-panel premium-border rounded-xl p-5 ${wide ? "lg:col-span-2" : ""}`}>
      <div className="mb-3 border-b border-base-300 pb-2 text-sm font-bold uppercase tracking-wide text-neutral/55">{label}</div>
      <div className="whitespace-pre-wrap text-lg leading-8 text-neutral">{value || <span className="text-neutral/40">Пока не заполнено</span>}</div>
    </section>
  );
}

export default function PlanViewPage() {
  const { state } = usePlanner();
  const [item, setItem] = useState<Publication | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setItem(state.publications.find((publication) => publication.id === id) || null);
  }, [state.publications]);

  if (!item) {
    return (
      <>
        <PageHeader title="Публикация не найдена" subtitle="Запись могла быть удалена или ссылка устарела." actions={<Link className="btn btn-ghost rounded-lg gap-2" href="/plan"><ArrowLeft size={16} />Назад</Link>} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={item.topic || "Публикация"}
        subtitle={`${item.publishDate || "Без даты"} ${item.publishTime || ""} · ${item.platform || "Площадка не выбрана"}`}
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/plan"><ArrowLeft size={16} />Назад</Link>
            <Link className="btn btn-primary rounded-lg gap-2" href={`/plan/edit?id=${item.id}`}><Pencil size={16} />Редактировать</Link>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Тема" value={item.topic} wide />
        <Field label="Крючок захвата внимания" value={item.hook} wide />
        <Field label="Идея / тезисы" value={item.theses} wide />
        <Field label="CTA" value={item.cta} />
        <Field label="Оффер" value={item.offer} />
        <Field label="Рубрика" value={item.rubric} />
        <Field label="Функция" value={item.functionType} />
        <Field label="ЦА" value={item.audience} />
        <Field label="Формат" value={item.format} />
        <Field label="Статус" value={item.status} />
        <Field label="Дата и время" value={`${item.publishDate || "Без даты"} ${item.publishTime || ""}\n${item.weekday || ""}`} />
      </div>
    </>
  );
}
