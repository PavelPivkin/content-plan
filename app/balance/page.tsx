"use client";

import { BalanceWidget } from "@/components/BalanceWidget";
import { PageHeader } from "@/components/PageHeader";
import { usePlanner } from "@/lib/store";

export default function BalancePage() {
  const { state } = usePlanner();
  const planned = state.publications.length;
  const ready = state.publications.filter((pub) => ["Запланировано", "Готово", "Опубликовано"].includes(pub.status)).length;

  return (
    <>
      <PageHeader title="Баланс" subtitle="Быстрая проверка перекосов по функциям контента, статусам и наличию продающих точек." />
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="glass-panel premium-border rounded-xl p-4">
          <div className="text-sm text-neutral/60">Публикаций</div>
          <div className="text-3xl font-bold">{planned}</div>
        </div>
        <div className="glass-panel premium-border rounded-xl p-4">
          <div className="text-sm text-neutral/60">Готовы к выходу</div>
          <div className="text-3xl font-bold">{ready}</div>
        </div>
        <div className="glass-panel premium-border rounded-xl p-4">
          <div className="text-sm text-neutral/60">Рубрик</div>
          <div className="text-3xl font-bold">{state.rubrics.filter((r) => r.active).length}</div>
        </div>
      </div>
      <BalanceWidget publications={state.publications} />
    </>
  );
}
