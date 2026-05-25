"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Wand2 } from "lucide-react";
import { EditableField } from "@/components/EditableField";
import { FieldLabel, FormCard } from "@/components/FormCard";
import { PageHeader } from "@/components/PageHeader";
import { generateWithOpenAI } from "@/lib/ai";
import { weekday } from "@/lib/integrations";
import { usePlanner } from "@/lib/store";
import { formats, functionTypes, platforms } from "@/lib/theory";
import { Publication } from "@/lib/types";

const statuses = ["Черновик", "В работе", "Запланировано", "Готово", "Опубликовано"];

const emptyPublication: Publication = {
  id: "",
  publishDate: new Date().toISOString().slice(0, 10),
  publishTime: "10:00",
  weekday: "",
  platform: "Instagram",
  audience: "",
  rubric: "",
  functionType: "Польза",
  format: "Пост",
  topic: "",
  theses: "",
  cta: "",
  offer: "",
  status: "Черновик"
};

export default function PlanEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const [item, setItem] = useState<Publication>({ ...emptyPublication, weekday: weekday(emptyPublication.publishDate) });
  const [id, setId] = useState("");

  useEffect(() => {
    const queryId = new URLSearchParams(window.location.search).get("id") || "";
    setId(queryId);
    setItem(state.publications.find((row) => row.id === queryId) || { ...emptyPublication, id: queryId, audience: state.audience[0]?.name || "", offer: state.product.offer, weekday: weekday(emptyPublication.publishDate) });
  }, [state.publications, state.product.offer, state.audience]);

  function update(key: keyof Publication, value: string) {
    setItem((prev) => {
      const next = { ...prev, [key]: value };
      return key === "publishDate" ? { ...next, weekday: weekday(value) } : next;
    });
  }

  async function fillWithAi() {
    const result = await generateWithOpenAI({ state, task: "Сгенерируй одну публикацию контент-плана как JSON объект с полями platform, audience, rubric, functionType, format, topic, theses, cta, offer, status", count: 1 });
    const next = Array.isArray(result) ? result[0] : result;
    if (next) setItem((prev) => ({ ...prev, ...next }));
  }

  function save() {
    const next = { ...item, id: id || crypto.randomUUID(), weekday: weekday(item.publishDate) };
    setState((prev) => ({
      ...prev,
      publications: id ? prev.publications.map((row) => (row.id === id ? next : row)) : [...prev.publications, next]
    }));
    router.push("/plan");
  }

  return (
    <>
      <PageHeader
        title={id ? "Редактировать публикацию" : "Новая публикация"}
        subtitle="Запланируйте дату, формат, смысл, CTA и оффер. День недели считается автоматически."
        actions={
          <>
            <Link className="btn btn-ghost rounded-lg gap-2" href="/plan"><ArrowLeft size={16} />Назад</Link>
            <button className="btn btn-outline rounded-lg gap-2" onClick={fillWithAi}><Wand2 size={16} />Заполнить с ИИ</button>
            <button className="btn btn-primary rounded-lg gap-2" onClick={save}><Save size={16} />Сохранить</button>
          </>
        }
      />
      <FormCard>
        <div className="grid gap-5 lg:grid-cols-3">
          <label className="form-control">
            <div className="label"><FieldLabel>Дата</FieldLabel></div>
            <input className="input input-bordered rounded-lg" type="date" value={item.publishDate} onChange={(e) => update("publishDate", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Время</FieldLabel></div>
            <input className="input input-bordered rounded-lg" type="time" value={item.publishTime} onChange={(e) => update("publishTime", e.target.value)} />
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>День недели</FieldLabel></div>
            <input className="input input-bordered rounded-lg bg-base-200" value={item.weekday} readOnly />
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Площадка</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.platform} onChange={(e) => update("platform", e.target.value)}>
              {platforms.map((platform) => <option key={platform}>{platform}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Рубрика</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.rubric} onChange={(e) => update("rubric", e.target.value)}>
              <option value="">Не выбрана</option>
              {state.rubrics.map((rubric) => <option key={rubric.id} value={rubric.name}>{rubric.name || "Без названия"}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>ЦА</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.audience} onChange={(e) => update("audience", e.target.value)}>
              <option value="">Не выбрана</option>
              {state.audience.map((segment) => <option key={segment.id} value={segment.name}>{segment.name || "Без названия"}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Функция</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.functionType} onChange={(e) => update("functionType", e.target.value)}>
              {functionTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Формат</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.format} onChange={(e) => update("format", e.target.value)}>
              {formats.map((format) => <option key={format}>{format}</option>)}
            </select>
          </label>
          <label className="form-control">
            <div className="label"><FieldLabel>Статус</FieldLabel></div>
            <select className="select select-bordered rounded-lg" value={item.status} onChange={(e) => update("status", e.target.value)}>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <div className="lg:col-span-3">
            <EditableField label="Тема" value={item.topic} onChange={(v) => update("topic", v)} multiline={false} prompt="Тема публикации с учетом продукта, ЦА, рубрики и формата." />
          </div>
          <div className="lg:col-span-2">
            <EditableField label="Идея / тезисы" value={item.theses} onChange={(v) => update("theses", v)} prompt="Ключевые мысли, рефрейм, доказательство и структура публикации." />
          </div>
          <div>
            <EditableField label="CTA" value={item.cta} onChange={(v) => update("cta", v)} prompt="Одно целевое действие: заявка, вопрос, сохранение, диагностика." />
            <EditableField label="Оффер" value={item.offer} onChange={(v) => update("offer", v)} prompt="Куда ведет публикация и какой следующий шаг продает." />
          </div>
        </div>
      </FormCard>
    </>
  );
}
