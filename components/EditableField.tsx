"use client";

import { Wand2 } from "lucide-react";
import { useState } from "react";
import { usePlanner } from "@/lib/store";
import { generateWithOpenAI } from "@/lib/ai";

export function EditableField({
  label,
  value,
  onChange,
  multiline = true,
  prompt,
  ai = true
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  prompt: string;
  ai?: boolean;
}) {
  const { state } = usePlanner();
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function improve() {
    setLoading(true);
    try {
      const result = await generateWithOpenAI({
        state,
        task: `Дай 3 варианта для поля "${label}". Контекст: ${prompt}. Текущее значение: ${value}. Верни JSON массив строк.`,
        count: 3
      });
      setOptions(Array.isArray(result) ? result.map(String) : []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="form-control">
      <div className="label">
        {label && <span className="label-text font-semibold text-neutral/80">{label}</span>}
        {ai && (
          <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={improve}>
            <Wand2 size={14} />
            {loading ? "Думаю" : "ИИ"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea className="textarea textarea-bordered min-h-32 resize-y rounded-lg leading-6" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="input input-bordered rounded-lg" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {options.length > 0 && (
        <div className="mt-2 grid gap-2">
          {options.map((option, index) => (
            <button key={index} type="button" className="rounded-md border border-base-300 bg-white p-3 text-left text-sm hover:border-primary" onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
