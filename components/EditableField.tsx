"use client";

import { Wand2 } from "lucide-react";
import { useAiAssist } from "@/components/AiAssistProvider";

export function EditableField({
  label,
  value,
  onChange,
  multiline = true,
  prompt,
  entityContext,
  ai = true
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  prompt: string;
  entityContext?: unknown;
  ai?: boolean;
}) {
  const { openAssist, loading } = useAiAssist();

  async function improve() {
    await openAssist({
      label,
      value,
      prompt,
      entityContext,
      onApply: onChange
    });
  }

  return (
    <div className="form-control">
      <div className="label">
        {label && <span className="label-text font-semibold text-neutral/80">{label}</span>}
        {ai && (
          <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={improve} disabled={loading}>
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
    </div>
  );
}
