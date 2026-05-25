"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { EditableField } from "@/components/EditableField";
import { FormCard } from "@/components/FormCard";
import { Help } from "@/components/Help";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";

export default function ProductEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const product = state.product;

  function update(key: keyof typeof product, value: string) {
    setState((prev) => ({ ...prev, product: { ...prev.product, [key]: value } }));
  }

  return (
    <>
      <PageHeader
        title="Редактировать продукт"
        subtitle="Заполните позиционирование, УТП, отстройку и оффер. Эти данные используются в генерации рубрик, идей и контент-плана."
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/product"><ArrowLeft size={16} />Назад</Link>
            <button className="btn btn-primary rounded-lg gap-2" onClick={() => router.push("/product")}><Save size={16} />Готово</button>
          </>
        }
      />
      <FormCard>
        <div className="grid gap-5 lg:grid-cols-2">
          <EditableField label="Название продукта" value={product.name} onChange={(v) => update("name", v)} multiline={false} prompt="Короткое понятное имя продукта или услуги." />
          <div className="lg:col-span-2">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">Позиционирование</span>
              <Help id="positioning" />
            </div>
            <EditableField label="" value={product.positioning} onChange={(v) => update("positioning", v)} prompt="Для кого, какую проблему, каким методом и почему это важно." />
          </div>
          <div className="lg:col-span-2">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-semibold">УТП</span>
              <Help id="offer" />
            </div>
            <EditableField label="" value={product.usp} onChange={(v) => update("usp", v)} prompt="Что делаем сильнее, быстрее, безопаснее или понятнее конкурентов." />
          </div>
          <EditableField label="Отстройка от конкурентов" value={product.competitorPositioning} onChange={(v) => update("competitorPositioning", v)} prompt="Какие старые подходы не работают, чем ваш метод отличается." />
          <EditableField label="Оффер на текущий период" value={product.offer} onChange={(v) => update("offer", v)} prompt="Проблема, результат, гарантия, уникальность и почему сейчас." />
        </div>
      </FormCard>
    </>
  );
}
