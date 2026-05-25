"use client";

import { functionTypes } from "@/lib/theory";
import { Publication } from "@/lib/types";

export function BalanceWidget({ publications }: { publications: Publication[] }) {
  const total = Math.max(publications.length, 1);
  const colors = ["#0f4c81", "#0f766e", "#b7791f", "#b42318", "#64748b"];
  const counts = functionTypes.map((type, index) => ({
    type,
    count: publications.filter((pub) => pub.functionType === type).length,
    color: colors[index]
  }));
  let cursor = 0;
  const gradient = counts
    .map((item) => {
      const size = (item.count / total) * 100;
      const start = cursor;
      const end = cursor + size;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  const hasSales = publications.some((pub) => /заяв|куп|консультац|диагност|расчет/i.test(pub.cta));
  const dominant = counts.reduce((max, item) => (item.count > max.count ? item : max), counts[0]);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="glass-panel premium-border rounded-xl p-6">
        <div className="mx-auto grid h-64 w-64 place-items-center rounded-full" style={{ background: publications.length ? `conic-gradient(${gradient})` : "conic-gradient(#d7cfc2 0% 100%)" }}>
          <div className="grid h-36 w-36 place-items-center rounded-full bg-base-100 text-center shadow-inner">
            <div>
              <div className="text-4xl font-bold">{publications.length}</div>
              <div className="text-sm text-neutral/55">публикаций</div>
            </div>
          </div>
        </div>
      </section>
      <section className="glass-panel premium-border rounded-xl p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {counts.map((item) => (
            <div key={item.type} className="rounded-xl border border-base-300/70 bg-white/70 p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                <span className="font-semibold">{item.type}</span>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">{item.count}</span>
                <span className="pb-1 text-sm text-neutral/50">{Math.round((item.count / total) * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-base-300/70 bg-base-100/80 p-4 leading-7">
          <b>Подсказка:</b>{" "}
          {publications.length > 0 && dominant.count / total > 0.5
            ? `Есть перекос в функцию "${dominant.type}". Добавьте контент других функций, чтобы прогрев не выглядел однообразно.`
            : publications.length === 0
              ? "Сначала добавьте публикации в контент-план."
              : "Баланс выглядит спокойнее: проверьте, чтобы в неделе были и польза, и доверие, и точки действия."}
          <br />
          <span>
            {hasSales
              ? "CTA к действию в плане есть."
              : "Добавьте хотя бы 1-2 публикации с явным CTA: заявка, вопрос, расчет или консультация."}
          </span>
        </div>
      </section>
    </div>
  );
}
