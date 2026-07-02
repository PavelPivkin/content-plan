"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lightbulb, Plus } from "lucide-react";
import { FieldLabel } from "@/components/FormCard";
import { Idea } from "@/lib/types";

function ideaTitle(idea: Idea) {
  return idea.topic || idea.meaning || idea.clientPhrase || "Идея без темы";
}

export function IdeaTopicCombobox({
  ideas,
  selectedIdeaId,
  topic,
  onSelectIdea,
  onCustomTopic
}: {
  ideas: Idea[];
  selectedIdeaId: string;
  topic: string;
  onSelectIdea: (ideaId: string) => void;
  onCustomTopic: (topic: string) => void;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState(topic);

  useEffect(() => {
    setQuery(topic);
  }, [topic]);

  const filteredIdeas = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return ideas;
    return ideas.filter((idea) => [ideaTitle(idea), idea.audience, idea.rubric, idea.meaning].join(" ").toLowerCase().includes(search));
  }, [ideas, query]);

  function selectIdea(ideaId: string) {
    onSelectIdea(ideaId);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  function typeCustomTopic(value: string) {
    setQuery(value);
    onCustomTopic(value);
  }

  return (
    <div className="form-control">
      <div className="label">
        <FieldLabel>Тема</FieldLabel>
        <Link className="btn btn-ghost btn-xs gap-1" href="/ideas/edit">
          <Lightbulb size={14} />
          Добавить идею
        </Link>
      </div>
      <details ref={detailsRef} className="dropdown w-full">
        <summary className="btn btn-outline h-auto min-h-12 w-full justify-between rounded-lg border-base-300 bg-base-100 px-4 py-3 text-left font-normal hover:bg-base-100">
          <span className={topic ? "line-clamp-2 text-neutral" : "text-neutral/45"}>
            {topic || "Выберите тему из банка идей или введите новую"}
          </span>
          <ChevronDown className="shrink-0 text-neutral/45" size={18} />
        </summary>
        <div className="dropdown-content z-[100] mt-2 w-full rounded-xl border border-base-300 bg-base-100 p-3 shadow-2xl">
          <input
            className="input input-bordered w-full rounded-lg"
            placeholder="Найти идею или ввести новую тему"
            value={query}
            onChange={(event) => typeCustomTopic(event.target.value)}
          />
          {query.trim() && !selectedIdeaId && (
            <div className="mt-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-neutral/70">
              <Plus className="mr-1 inline-block align-[-2px]" size={14} />
              Новая тема будет добавлена в банк идей после сохранения.
            </div>
          )}
          <div className="mt-3 max-h-80 overflow-y-auto">
            {filteredIdeas.length > 0 ? (
              <div className="grid gap-2">
                {filteredIdeas.map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    className={`rounded-lg border p-3 text-left transition hover:border-primary/40 hover:bg-primary/5 ${selectedIdeaId === idea.id ? "border-primary bg-primary/10" : "border-base-300 bg-white"}`}
                    onClick={() => selectIdea(idea.id)}
                  >
                    <div className="font-bold leading-6">{ideaTitle(idea)}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral/55">
                      {idea.audience && <span>{idea.audience}</span>}
                      {idea.rubric && <span>{idea.rubric}</span>}
                      {idea.format && <span>{idea.format}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-base-300 p-4 text-sm text-neutral/55">
                Совпадений нет. Оставьте введенный текст, и он станет новой темой в банке идей.
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
