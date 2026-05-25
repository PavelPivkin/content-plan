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
import { huntStages } from "@/lib/theory";
import { AudienceSegment } from "@/lib/types";

const emptySegment: AudienceSegment = {
  id: "",
  name: "",
  description: "",
  huntStage: "Осознает проблему",
  pains: "",
  clientWords: ""
};

export default function AudienceEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const [item, setItem] = useState<AudienceSegment>(emptySegment);
  const [id, setId] = useState("");

  useEffect(() => {
    const queryId = new URLSearchParams(window.location.search).get("id") || "";
    setId(queryId);
    setItem(state.audience.find((row) => row.id === queryId) || { ...emptySegment, id: queryId });
  }, [state.audience]);

  function update(key: keyof AudienceSegment, value: string) {
    setItem((prev) => ({ ...prev, [key]: value }));
  }

  async function fillWithAi() {
    const result = await generateWithOpenAI({
      state,
      task: "Сгенерируй один сегмент ЦА как JSON объект с полями name, description, huntStage, pains, clientWords",
      count: 1
    });
    const next = Array.isArray(result) ? result[0] : result;
    if (next) setItem((prev) => ({ ...prev, ...next }));
  }

  function save() {
    const next = { ...item, id: id || crypto.randomUUID() };
    setState((prev) => ({
      ...prev,
      audience: id ? prev.audience.map((row) => (row.id === id ? next : row)) : [...prev.audience, next]
    }));
    router.push("/audience");
  }

  return (
    <>
      <PageHeader
        title={id ? "Редактировать сегмент" : "Новый сегмент"}
        subtitle="Заполните контекст, боли и живые формулировки клиента. Эти данные будут использоваться при генерации смыслов."
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/audience"><ArrowLeft size={16} />Назад</Link>
            <button className="btn btn-outline rounded-lg gap-2" onClick={fillWithAi}><Wand2 size={16} />Заполнить с ИИ</button>
            <button className="btn btn-primary rounded-lg gap-2" onClick={save}><Save size={16} />Сохранить</button>
          </>
        }
      />
      <FormCard>
        <div className="grid gap-5 lg:grid-cols-2">
          <EditableField label="Название сегмента" value={item.name} onChange={(v) => update("name", v)} multiline={false} prompt="Коротко назови сегмент целевой аудитории." />
          <label className="form-control">
            <div className="label"><FieldLabel>Ступень Ханта</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.huntStage} onChange={(e) => update("huntStage", e.target.value)}>
              {huntStages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </label>
          <EditableField label="Описание сегмента" value={item.description} onChange={(v) => update("description", v)} prompt="Кто эти люди, в какой ситуации находятся, что уже пробовали." />
          <EditableField label="Боли / желания" value={item.pains} onChange={(v) => update("pains", v)} prompt="Что болит, чего хочет сегмент, чего боится." />
          <div className="lg:col-span-2">
            <EditableField label="Слова клиента" value={item.clientWords} onChange={(v) => update("clientWords", v)} prompt="Живые фразы клиента, возражения, вопросы, бытовые формулировки." />
          </div>
        </div>
      </FormCard>
    </>
  );
}
