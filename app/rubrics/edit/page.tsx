"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Wand2 } from "lucide-react";
import { EditableField } from "@/components/EditableField";
import { FieldLabel, FormCard, MultiFormatSelect } from "@/components/FormCard";
import { PageHeader } from "@/components/PageHeader";
import { generateWithOpenAI } from "@/lib/ai";
import { usePlanner } from "@/lib/store";
import { formats, functionTypes } from "@/lib/theory";
import { Rubric } from "@/lib/types";

const emptyRubric: Rubric = {
  id: "",
  name: "",
  task: "",
  functionType: "Польза",
  formats: "Пост, Карусель",
  segment: "",
  active: true
};

export default function RubricEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const [item, setItem] = useState<Rubric>(emptyRubric);
  const [id, setId] = useState("");

  useEffect(() => {
    const queryId = new URLSearchParams(window.location.search).get("id") || "";
    setId(queryId);
    setItem(state.rubrics.find((row) => row.id === queryId) || { ...emptyRubric, id: queryId });
  }, [state.rubrics]);

  function update(key: keyof Rubric, value: any) {
    setItem((prev) => ({ ...prev, [key]: value }));
  }

  async function fillWithAi() {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй одну рубрику как JSON объект с полями name, task, functionType, formats, segment, active", count: 1 });
    const next = Array.isArray(result) ? result[0] : result;
    if (next) setItem((prev) => ({ ...prev, ...next }));
  }

  function save() {
    const next = { ...item, id: id || crypto.randomUUID() };
    setState((prev) => ({
      ...prev,
      rubrics: id ? prev.rubrics.map((row) => (row.id === id ? next : row)) : [...prev.rubrics, next]
    }));
    router.push("/rubrics");
  }

  return (
    <>
      <PageHeader
        title={id ? "Редактировать рубрику" : "Новая рубрика"}
        subtitle="Рубрика должна быть повторяемой, связанной с продуктом и понятной по функции."
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/rubrics"><ArrowLeft size={16} />Назад</Link>
            <button className="btn btn-outline rounded-lg gap-2" onClick={fillWithAi}><Wand2 size={16} />Заполнить с ИИ</button>
            <button className="btn btn-primary rounded-lg gap-2" onClick={save}><Save size={16} />Сохранить</button>
          </>
        }
      />
      <FormCard>
        <div className="grid gap-5 lg:grid-cols-2">
          <EditableField label="Название рубрики" value={item.name} onChange={(v) => update("name", v)} multiline={false} prompt="Название регулярного смыслового контейнера." />
          <label className="form-control">
            <div className="label"><FieldLabel>Функция</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.functionType} onChange={(e) => update("functionType", e.target.value)}>
              {functionTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Сегмент</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.segment} onChange={(e) => update("segment", e.target.value)}>
              <option value="">Все сегменты</option>
              {state.audience.map((segment) => <option key={segment.id} value={segment.name}>{segment.name || "Без названия"}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Активна</FieldLabel></div>
            <input type="checkbox" className="toggle toggle-primary" checked={item.active} onChange={(e) => update("active", e.target.checked)} />
          </label>
          <div className="lg:col-span-2">
            <EditableField label="Задача рубрики" value={item.task} onChange={(v) => update("task", v)} prompt="Зачем нужна рубрика, какой смысл и реакцию она формирует." />
          </div>
          <div className="lg:col-span-2">
            <div className="label"><FieldLabel>Форматы</FieldLabel></div>
            <MultiFormatSelect selected={item.formats} onChange={(v) => update("formats", v)} options={formats} />
          </div>
        </div>
      </FormCard>
    </>
  );
}
