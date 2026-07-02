"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Wand2 } from "lucide-react";
import { EditableField } from "@/components/EditableField";
import { FieldLabel, FormCard } from "@/components/FormCard";
import { IdeaTopicCombobox } from "@/components/IdeaTopicCombobox";
import { PageHeader } from "@/components/PageHeader";
import { generateWithOpenAI, getGeneratedRows } from "@/lib/ai";
import { weekday } from "@/lib/integrations";
import { usePlanner } from "@/lib/store";
import { formats, functionTypes, platforms } from "@/lib/theory";
import { Idea, Publication } from "@/lib/types";

const statuses = ["Черновик", "В работе", "Запланировано", "Готово", "Опубликовано"];

const emptyPublication: Publication = {
  id: "",
  ideaId: "",
  publishDate: new Date().toISOString().slice(0, 10),
  publishTime: "10:00",
  weekday: "",
  platform: "Instagram",
  audience: "",
  rubric: "",
  functionType: "Польза",
  format: "Пост",
  topic: "",
  hook: "",
  theses: "",
  cta: "",
  offer: "",
  status: "Черновик"
};

function buildThesesFromIdea(idea: Idea) {
  return [
    idea.clientPhrase ? `Фраза клиента: ${idea.clientPhrase}` : "",
    idea.hiddenPain ? `Скрытая боль: ${idea.hiddenPain}` : "",
    idea.meaning ? `Смысл: ${idea.meaning}` : ""
  ].filter(Boolean).join("\n");
}

function createIdeaFromPublication(publication: Publication, id: string): Idea {
  return {
    id,
    audience: publication.audience,
    source: "Контент-план",
    clientPhrase: "",
    hiddenPain: "",
    meaning: publication.theses,
    topic: publication.topic,
    format: publication.format,
    rubric: publication.rubric,
    huntStage: "Ищет решение",
    functionType: publication.functionType
  };
}

export default function PlanEditPage() {
  const router = useRouter();
  const { state, setState } = usePlanner();
  const [item, setItem] = useState<Publication>({ ...emptyPublication, weekday: weekday(emptyPublication.publishDate) });
  const [id, setId] = useState("");
  const selectedIdea = state.ideas.find((row) => row.id === item.ideaId);
  const publicationContext = { entity: "publication", publication: item, selectedIdea, product: state.product, audience: state.audience, rubrics: state.rubrics };

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

  function applyIdea(ideaId: string) {
    const idea = state.ideas.find((row) => row.id === ideaId);
    setItem((prev) => {
      if (!idea) return { ...prev, ideaId, topic: "" };

      return {
        ...prev,
        ideaId,
        topic: idea.topic || idea.meaning || idea.clientPhrase,
        audience: idea.audience || prev.audience,
        rubric: idea.rubric || prev.rubric,
        functionType: idea.functionType || prev.functionType,
        format: idea.format || prev.format,
        theses: prev.theses || buildThesesFromIdea(idea)
      };
    });
  }

  function updateCustomTopic(value: string) {
    setItem((prev) => ({
      ...prev,
      ideaId: "",
      topic: value
    }));
  }

  async function fillWithAi() {
    const idea = state.ideas.find((row) => row.id === item.ideaId);
    const result = await generateWithOpenAI({
      state,
      task: `Сгенерируй или дополни одну публикацию контент-плана как JSON объект с полями platform, audience, rubric, functionType, format, topic, hook, theses, cta, offer, status. Учитывай уже заполненные поля текущей публикации: ${JSON.stringify(item)}. ${idea ? `Разверни выбранную идею вглубь и вширь: ${JSON.stringify(idea)}` : item.topic ? `Разверни новую тему, которую пользователь ввел вручную, и не меняй ее без необходимости: ${item.topic}` : "Если банк идей заполнен, выбери одну идею из банка и используй ее тему."}`,
      count: 1
    });
    const next = getGeneratedRows<Publication>(result, ["publication", "publications", "plan"])[0];
    if (next) {
      const { id: _id, ...safeNext } = next;
      setItem((prev) => ({ ...prev, ...safeNext }));
    }
  }

  function save() {
    const next = { ...item, id: id || crypto.randomUUID(), weekday: weekday(item.publishDate) };
    setState((prev) => {
      let publication = next;
      let ideas = prev.ideas;
      const topic = publication.topic.trim();

      if (!publication.ideaId && topic) {
        const existingIdea = prev.ideas.find((idea) => (idea.topic || "").trim().toLowerCase() === topic.toLowerCase());
        if (existingIdea) {
          publication = { ...publication, ideaId: existingIdea.id };
        } else {
          const ideaId = crypto.randomUUID();
          publication = { ...publication, ideaId };
          ideas = [...prev.ideas, createIdeaFromPublication(publication, ideaId)];
        }
      }

      return {
        ...prev,
        ideas,
        publications: id ? prev.publications.map((row) => (row.id === id ? publication : row)) : [...prev.publications, publication]
      };
    });
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
            <IdeaTopicCombobox
              ideas={state.ideas}
              selectedIdeaId={item.ideaId}
              topic={item.topic}
              onSelectIdea={applyIdea}
              onCustomTopic={updateCustomTopic}
            />
            {item.topic ? (
              <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-primary">{item.ideaId ? "Выбранная тема" : "Новая тема"}</div>
                <div className="mt-2 text-lg font-bold leading-7 text-neutral">{item.topic}</div>
                {item.ideaId && (
                  <div className="mt-2 text-sm leading-6 text-neutral/65">
                    {state.ideas.find((idea) => idea.id === item.ideaId)?.meaning || "Разверните тему в крючок, тезисы и CTA через ИИ-помощника."}
                  </div>
                )}
                {!item.ideaId && <div className="mt-2 text-sm leading-6 text-neutral/65">После сохранения эта тема будет добавлена в банк идей и связана с публикацией.</div>}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-base-300 bg-base-100 p-4 text-sm text-neutral/55">
                Выберите идею из банка или введите новую тему. Так публикация будет связана с банком идей и подтянет ЦА, рубрику, формат и функцию.
              </div>
            )}
          </div>
          <div className="lg:col-span-3">
            <EditableField label="Крючок захвата внимания" value={item.hook} onChange={(v) => update("hook", v)} prompt="Первый экран, заход, провокационный вопрос или фраза, которая останавливает внимание перед темой." entityContext={publicationContext} />
          </div>
          <div className="lg:col-span-2">
            <EditableField label="Идея / тезисы" value={item.theses} onChange={(v) => update("theses", v)} prompt="Ключевые мысли, рефрейм, доказательство и структура публикации." entityContext={publicationContext} />
          </div>
          <div>
            <EditableField label="CTA" value={item.cta} onChange={(v) => update("cta", v)} prompt="Одно целевое действие: заявка, вопрос, сохранение, диагностика." entityContext={publicationContext} />
            <EditableField label="Оффер" value={item.offer} onChange={(v) => update("offer", v)} prompt="Куда ведет публикация и какой следующий шаг продает." entityContext={publicationContext} />
          </div>
        </div>
      </FormCard>
    </>
  );
}
