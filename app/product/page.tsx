"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";

export default function ProductPage() {
  const { state } = usePlanner();
  const product = state.product;

  const fields = [
    { label: "Позиционирование", value: product.positioning, help: "positioning" as const },
    { label: "УТП", value: product.usp, help: "offer" as const },
    { label: "Отстройка от конкурентов", value: product.competitorPositioning },
    { label: "Оффер на текущий период", value: product.offer }
  ];

  return (
    <>
      <PageHeader
        title="Продукт и оффер"
        subtitle="Зафиксируйте, что продаем, кому, чем отличаемся и как формулируем оффер на текущий период."
        actions={<Link className="btn btn-primary rounded-lg gap-2" href="/product/edit"><Pencil size={16} />Редактировать</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel premium-border rounded-xl p-5 lg:col-span-2">
          {product.name ? (
            <h2 className="text-3xl font-bold leading-tight text-neutral">{product.name}</h2>
          ) : (
            <>
              <div className="mb-4 border-b border-base-300 pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-neutral/65">Название продукта</h2>
              </div>
              <div className="text-lg leading-8 text-neutral/40">Пока не заполнено</div>
            </>
          )}
        </section>
        {fields.map((field, index) => (
          <section key={field.label} className={`glass-panel premium-border rounded-xl p-5 ${index < 2 ? "lg:col-span-2" : ""}`}>
            <div className="mb-4 flex items-center gap-2 border-b border-base-300 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral/65">{field.label}</h2>
              {field.help && <Help id={field.help} />}
            </div>
            <div className="whitespace-pre-wrap text-lg leading-8 text-neutral">
              {field.value || <span className="text-neutral/40">Пока не заполнено</span>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
