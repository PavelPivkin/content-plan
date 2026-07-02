"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";
import { FieldAssistResponse, generateFieldAssist } from "@/lib/ai";
import { usePlanner } from "@/lib/store";

type AssistRequest = {
  label: string;
  value: string;
  prompt: string;
  entityContext?: unknown;
  onApply: (value: string) => void;
};

type AiAssistContextValue = {
  openAssist: (request: AssistRequest) => Promise<void>;
  loading: boolean;
};

const AiAssistContext = createContext<AiAssistContextValue | null>(null);

export function AiAssistProvider({ children }: { children: React.ReactNode }) {
  const { state } = usePlanner();
  const [request, setRequest] = useState<AssistRequest | null>(null);
  const [assist, setAssist] = useState<FieldAssistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openAssist(nextRequest: AssistRequest) {
    setRequest(nextRequest);
    setAssist(null);
    setError("");
    setLoading(true);

    try {
      const result = await generateFieldAssist({
        state,
        label: nextRequest.label,
        value: nextRequest.value,
        prompt: nextRequest.prompt,
        entityContext: nextRequest.entityContext
      });
      setAssist(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось получить варианты ИИ.");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setRequest(null);
    setAssist(null);
    setError("");
    setLoading(false);
  }

  const value = useMemo(() => ({ openAssist, loading }), [loading, state]);

  return (
    <AiAssistContext.Provider value={value}>
      {children}
      {request && (
        <div className="fixed inset-0 z-50 bg-neutral/35 backdrop-blur-sm lg:left-72 lg:bg-transparent lg:backdrop-blur-0">
          <aside className="ml-auto flex h-dvh w-full max-w-xl flex-col border-l border-base-300 bg-base-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-base-300 bg-base-100 p-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-primary">ИИ-редактор</div>
                <h3 className="mt-1 text-xl font-bold">{request.label || "Поле"}</h3>
              </div>
              <button className="btn btn-ghost btn-sm h-9 w-9 rounded-lg p-0" onClick={close} title="Закрыть">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loading && <div className="loading loading-spinner loading-lg text-primary" />}
              {!loading && assist && (
                <div className="space-y-4">
                  <section className="rounded-xl border border-base-300 bg-white/80 p-4">
                    <h4 className="font-bold">Разбор</h4>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-neutral/75">{assist.summary}</p>
                    <p className="mt-3 whitespace-pre-wrap leading-7 text-neutral/75">{assist.currentReview}</p>
                  </section>
                  <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="font-bold text-primary">Рекомендация</h4>
                    <p className="mt-2 whitespace-pre-wrap leading-7">{assist.recommendation}</p>
                  </section>
                  <section className="rounded-xl border border-base-300 bg-white/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-bold">Текущий вариант</h4>
                      <button className="btn btn-outline btn-sm rounded-lg" onClick={close}>
                        Оставить
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap leading-7 text-neutral/75">{request.value || "Поле пока пустое."}</p>
                  </section>
                  {assist.suggestions.map((suggestion, index) => (
                    <section key={`${suggestion.text}-${index}`} className="rounded-xl border border-base-300 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold">{suggestion.title}</h4>
                          <div className="mt-1 text-sm text-neutral/55">{suggestion.strength}</div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm rounded-lg"
                          onClick={() => {
                            request.onApply(suggestion.text);
                            close();
                          }}
                        >
                          Заменить
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap rounded-lg bg-base-100 p-3 leading-7">{suggestion.text}</p>
                      <p className="mt-3 whitespace-pre-wrap leading-7 text-neutral/70">{suggestion.why}</p>
                    </section>
                  ))}
                </div>
              )}
              {!loading && !assist && !error && <p className="text-neutral/60">Нажмите ИИ, чтобы получить разбор и варианты.</p>}
              {error && <div className="rounded-lg border border-error/25 bg-error/5 p-3 text-sm text-error">{error}</div>}
            </div>
          </aside>
        </div>
      )}
    </AiAssistContext.Provider>
  );
}

export function useAiAssist() {
  const ctx = useContext(AiAssistContext);
  if (!ctx) throw new Error("useAiAssist must be used inside AiAssistProvider");
  return ctx;
}
