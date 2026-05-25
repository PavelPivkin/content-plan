"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Wand2 } from "lucide-react";
import { EditableField } from "@/components/EditableField";
import { FieldLabel, FormCard } from "@/components/FormCard";
import { PageHeader } from "@/components/PageHeader";
import { generateWithOpenAI } from "@/lib/ai";
import { usePlanner } from "@/lib/store";
import { formats, functionTypes, huntStages } from "@/lib/theory";
import { Idea } from "@/lib/types";

const emptyIdea: Idea = {
  id: "",
  audience: "",
  source: "",
  clientPhrase: "",
  hiddenPain: "",
  meaning: "",
  topic: "",
  format: "Пост",
  rubric: "",
  huntStage: "Ищет решение",
  functionType: "Польза"
};

export default function IdeaEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const [item, setItem] = useState<Idea>(emptyIdea);
  const [id, setId] = useState("");

  useEffect(() => {
    const queryId = new URLSearchParams(window.location.search).get("id") || "";
    setId(queryId);
    setItem(state.ideas.find((row) => row.id === queryId) || { ...emptyIdea, id: queryId, audience: state.audience[0]?.name || "" });
  }, [state.ideas, state.audience]);

  function update(key: keyof Idea, value: string) {
    setItem((prev) => ({ ...prev, [key]: value }));
  }

  async function fillWithAi() {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй одну идею контента как JSON объект с полями audience, source, clientPhrase, hiddenPain, meaning, topic, format, rubric, huntStage, functionType", count: 1 });
    const next = Array.isArray(result) ? result[0] : result;
    if (next) setItem((prev) => ({ ...prev, ...next }));
  }

  function save() {
    const next = { ...item, id: id || crypto.randomUUID() };
    setState((prev) => ({ ...prev, ideas: id ? prev.ideas.map((row) => (row.id === id ? next : row)) : [...prev.ideas, next] }));
    router.push("/ideas");
  }

  return (
    <>
      <PageHeader
        title={id ? "Редактировать идею" : "Новая идея"}
        subtitle="Идея связывает живую фразу клиента, скрытую боль, смысл и тему публикации."
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/ideas"><ArrowLeft size={16} />Назад</Link>
            <button className="btn btn-outline rounded-lg gap-2" onClick={fillWithAi}><Wand2 size={16} />Заполнить с ИИ</button>
            <button className="btn btn-primary rounded-lg gap-2" onClick={save}><Save size={16} />Сохранить</button>
          </>
        }
      />
      <FormCard>
        <div className="grid gap-5 lg:grid-cols-2">
          <EditableField label="Где нашли" value={item.source} onChange={(v) => update("source", v)} multiline={false} prompt="Источник идеи: форум, отзыв, комментарий, гипотеза." />
          <EditableField label="Тема / заголовок" value={item.topic} onChange={(v) => update("topic", v)} multiline={false} prompt="Тема, которая превращает смысл в публикацию." />
          <label className="form-control">
            <div className="label"><FieldLabel>ЦА</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.audience} onChange={(e) => update("audience", e.target.value)}>
              <option value="">Не выбрана</option>
              {state.audience.map((segment) => <option key={segment.id} value={segment.name}>{segment.name || "Без названия"}</option>)}
            </select>
          </label>
          <EditableField label="Фраза клиента" value={item.clientPhrase} onChange={(v) => update("clientPhrase", v)} prompt="Живая формулировка боли или желания клиента." />
          <EditableField label="Скрытая боль" value={item.hiddenPain} onChange={(v) => update("hiddenPain", v)} prompt="Что на самом деле стоит за словами клиента." />
          <EditableField label="Смысл" value={item.meaning} onChange={(v) => update("meaning", v)} prompt="Какой вывод должен остаться после контента." />
          <div className="grid gap-4">
            <label className="form-control">
              <div className="label"><FieldLabel>Рубрика</FieldLabel></div>
              <select className="select select-bordered rounded-lg" value={item.rubric} onChange={(e) => update("rubric", e.target.value)}>
                <option value="">Не выбрана</option>
                {state.rubrics.map((rubric) => <option key={rubric.id} value={rubric.name}>{rubric.name || "Без названия"}</option>)}
              </select>
            </label>
            <label className="form-control">
              <div className="label"><FieldLabel>Формат</FieldLabel></div>
              <select className="select select-bordered rounded-lg" value={item.format} onChange={(e) => update("format", e.target.value)}>
                {formats.map((format) => <option key={format}>{format}</option>)}
              </select>
            </label>
            <label className="form-control">
              <div className="label"><FieldLabel>Ступень Ханта</FieldLabel></div>
              <select className="select select-bordered rounded-lg" value={item.huntStage} onChange={(e) => update("huntStage", e.target.value)}>
                {huntStages.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </label>
            <label className="form-control">
              <div className="label"><FieldLabel>Функция</FieldLabel></div>
              <select className="select select-bordered rounded-lg" value={item.functionType} onChange={(e) => update("functionType", e.target.value)}>
                {functionTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
          </div>
        </div>
      </FormCard>
    </>
  );
}
