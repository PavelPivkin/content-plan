"use client";

import { useRef, useState } from "react";
import { Wand2 } from "lucide-react";

export function AiGenerateButton({
  defaultCount,
  min = 1,
  max = 50,
  presets,
  onGenerate
}: {
  defaultCount: number;
  min?: number;
  max?: number;
  presets?: number[];
  onGenerate: (count: number) => Promise<void> | void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [count, setCount] = useState(defaultCount);
  const [loading, setLoading] = useState(false);
  const options = presets || [1, 3, 5].filter((value) => value >= min && value <= max);

  function normalizeCount(value: number) {
    return Math.min(max, Math.max(min, Math.round(value || defaultCount)));
  }

  async function submit() {
    setLoading(true);
    try {
      const normalized = normalizeCount(count);
      setCount(normalized);
      await onGenerate(normalized);
      if (detailsRef.current) detailsRef.current.open = false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <details ref={detailsRef} className="dropdown dropdown-end z-[80]">
      <summary className="btn btn-outline rounded-lg gap-2">
        <Wand2 size={16} />
        + с ИИ
      </summary>
      <div className="dropdown-content z-[100] mt-2 w-72 rounded-xl border border-base-300 bg-base-100 p-4 shadow-2xl">
        <div className="text-sm font-bold">Сколько строк добавить?</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`btn btn-sm rounded-lg ${count === option ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setCount(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="form-control mt-3">
          <span className="label-text text-xs text-neutral/60">Точное количество</span>
          <input
            className="input input-bordered input-sm rounded-lg"
            min={min}
            max={max}
            type="number"
            value={count}
            onChange={(event) => setCount(normalizeCount(Number(event.target.value)))}
          />
        </label>
        <button className="btn btn-primary mt-3 w-full rounded-lg" type="button" onClick={submit} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-sm" /> : <Wand2 size={16} />}
          Сгенерировать {normalizeCount(count)}
        </button>
      </div>
    </details>
  );
}
