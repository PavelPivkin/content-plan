import { PlannerState } from "./types";

type GenerateArgs = {
  state: PlannerState;
  task: string;
  count?: number;
};

export type FieldAssistSuggestion = {
  title: string;
  text: string;
  why: string;
  strength: string;
};

export type FieldAssistResponse = {
  summary: string;
  currentReview: string;
  recommendation: string;
  suggestions: FieldAssistSuggestion[];
};

function getPromptState(state: PlannerState) {
  return {
    product: state.product,
    audience: state.audience,
    rubrics: state.rubrics,
    ideas: state.ideas,
    publications: state.publications
  };
}

function extractJsonCandidate(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const arrayStart = trimmed.indexOf("[");
    const objectStart = trimmed.indexOf("{");
    const starts = [arrayStart, objectStart].filter((index) => index >= 0);
    const start = Math.min(...starts);
    if (!Number.isFinite(start)) throw new Error("AI response does not contain JSON.");

    const open = trimmed[start];
    const close = open === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < trimmed.length; index += 1) {
      const char = trimmed[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") inString = !inString;
      if (inString) continue;
      if (char === open) depth += 1;
      if (char === close) depth -= 1;
      if (depth === 0) return JSON.parse(trimmed.slice(start, index + 1));
    }
  }

  throw new Error("AI response JSON is incomplete.");
}

function stringifyAiValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringifyAiValue(item)).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const text = stringifyAiValue(item);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return fallback;
}

export function getGeneratedRows<T>(result: unknown, keys: string[] = []): Partial<T>[] {
  if (Array.isArray(result)) return result as Partial<T>[];
  if (!result || typeof result !== "object") return [];

  const record = result as Record<string, unknown>;
  const candidates = [...keys, "items", "rows", "data", "results"];
  for (const key of candidates) {
    if (Array.isArray(record[key])) return record[key] as Partial<T>[];
    if (record[key] && typeof record[key] === "object") return [record[key] as Partial<T>];
  }

  const firstArray = Object.values(record).find(Array.isArray);
  if (Array.isArray(firstArray)) return firstArray as Partial<T>[];

  return [record as Partial<T>];
}

export async function generateWithOpenAI({ state, task, count = 5 }: GenerateArgs) {
  if (!state.settings.openaiApiKey) {
    return mockGenerate(task, count, state);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: state.settings.openaiModel || "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "Ты маркетолог-стратег. Отвечай на русском. Возвращай только JSON без markdown. Помогай собрать продукт, ЦА, рубрики, идеи и контент-план по методологии смыслов, рубрикатора, лестницы Ханта и баланса функций."
        },
        {
          role: "user",
          content: JSON.stringify({ task, count, state: getPromptState(state) })
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  const text =
    data.output_text ||
    data.output?.flatMap((item: any) => item.content || []).map((c: any) => c.text).join("\n") ||
    "[]";
  return extractJsonCandidate(text);
}

export async function generateFieldAssist({
  state,
  label,
  value,
  prompt,
  entityContext
}: {
  state: PlannerState;
  label: string;
  value: string;
  prompt: string;
  entityContext?: unknown;
}): Promise<FieldAssistResponse> {
  if (!state.settings.openaiApiKey) {
    return {
      summary: "Демо-разбор без OpenAI API key.",
      currentReview: value ? "Текущий вариант можно оставить как базовый, но его стоит сделать конкретнее." : "Поле пока пустое, лучше начать с короткой рабочей формулировки.",
      recommendation: "Выберите вариант, который точнее связан с продуктом, ЦА и действием пользователя.",
      suggestions: [
        {
          title: "Более конкретно",
          text: value || "Сформулируйте мысль через боль клиента, результат и следующий понятный шаг.",
          why: "Конкретика быстрее считывается и меньше похожа на общую маркетинговую фразу.",
          strength: "Хорошо для первого экрана и коротких форматов."
        }
      ]
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.settings.openaiApiKey}`
    },
    body: JSON.stringify({
      model: state.settings.openaiModel || "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "Ты маркетолог-стратег и редактор. Отвечай на русском. Верни только JSON без markdown. Анализируй текст с точки зрения ясности, силы оффера, ЦА, рубрики, формата, лестницы Ханта и задачи контента."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Проанализируй поле "${label}" и предложи 3 варианта замены. Объясни, что лучше/хуже и почему. Контекст поля: ${prompt}`,
            currentValue: value,
            entityContext,
            state: getPromptState(state),
            instructions:
              "Используй entityContext как главный контекст редактируемой сущности. Если поле пустое, выводи значение из уже заполненных соседних полей этой сущности. Например: из фразы клиента вычленяй скрытую боль, из боли и темы формулируй смысл, из темы и рубрики формируй крючок/тезисы/CTA.",
            responseShape: {
              responseRules: "Все значения должны быть строками. Не возвращай вложенные объекты внутри summary, currentReview, recommendation, title, text, why или strength.",
              summary: "короткий общий вывод",
              currentReview: "оценка текущего варианта",
              recommendation: "какой вариант лучше выбрать и почему",
              suggestions: [
                {
                  title: "название варианта",
                  text: "текст для замены",
                  why: "почему этот вариант сильнее или когда его выбрать",
                  strength: "главная сильная сторона"
                }
              ]
            }
          })
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  const text =
    data.output_text ||
    data.output?.flatMap((item: any) => item.content || []).map((c: any) => c.text).join("\n") ||
    "{}";
  const parsed = extractJsonCandidate(text) as Partial<FieldAssistResponse>;
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
        .map((item) => ({
          title: stringifyAiValue(item?.title, "Вариант"),
          text: stringifyAiValue(item?.text),
          why: stringifyAiValue(item?.why, "Подходит как альтернативная формулировка."),
          strength: stringifyAiValue(item?.strength, "Ясность")
        }))
        .filter((item) => item.text)
    : [];

  return {
    summary: stringifyAiValue(parsed.summary, "ИИ подготовил варианты."),
    currentReview: stringifyAiValue(parsed.currentReview, "Текущий вариант можно оставить, если он точно решает задачу поля."),
    recommendation: stringifyAiValue(parsed.recommendation, "Выберите вариант, который звучит конкретнее и ближе к языку ЦА."),
    suggestions
  };
}

function mockGenerate(task: string, count: number, state: PlannerState) {
  const product = state.product.name || "продукт";
  if (task.includes("аудит") || task.includes("ЦА") || task.includes("целев")) {
    return Array.from({ length: count }, (_, i) => ({
      name: ["Новички", "Сравнивают решения", "Готовы купить", "Сомневающиеся", "Действующие клиенты"][i % 5],
      description: `Сегмент для ${product}: находится в конкретной ситуации выбора и ищет понятный следующий шаг.`,
      huntStage: ["Осознает проблему", "Ищет решение", "Сравнивает", "Готов купить", "Не осознает"][i % 5],
      pains: "Не хватает ясности, страшно ошибиться, сложно сравнить варианты и понять, кому доверять.",
      clientWords: "Хочу понять, что мне подойдет и с чего начать без лишних затрат."
    }));
  }

  if (task.includes("рубри")) {
    return Array.from({ length: count }, (_, i) => ({
      name: ["Как это работает", "Ошибки клиентов", "Кейсы и доказательства", "Разбор страхов", "Выбор решения"][i % 5],
      task: `Донести ценность ${product} через регулярный смысловой контейнер.`,
      functionType: ["Польза", "Доверие", "Кейс", "Продажа", "Сервис"][i % 5],
      formats: "Пост, карусель, Stories",
      segment: state.audience[0]?.name || "основной сегмент"
    }));
  }

  if (task.includes("план")) {
    return Array.from({ length: count }, (_, i) => ({
      platform: ["Instagram", "Telegram", "VK"][i % 3],
      audience: state.audience[0]?.name || "основной сегмент",
      rubric: state.rubrics[i % Math.max(1, state.rubrics.length)]?.name || "Как это работает",
      functionType: ["Польза", "Доверие", "Кейс", "Продажа", "Сервис"][i % 5],
      format: ["Пост", "Карусель", "Stories", "Reels"][i % 4],
      topic: `${product}: тема ${i + 1} через боль и результат`,
      ideaId: state.ideas[i % Math.max(1, state.ideas.length)]?.id || "",
      hook: "Что, если проблема не в отсутствии идей, а в отсутствии системы?",
      theses: "Проблема, новая рамка, доказательство, следующий шаг.",
      cta: i % 3 === 0 ? "Записаться на диагностику" : "Сохранить и написать вопрос",
      offer: state.product.offer || product,
      status: "Черновик"
    }));
  }

  return Array.from({ length: count }, (_, i) => ({
    source: "Гипотеза",
    audience: state.audience[0]?.name || "основной сегмент",
    clientPhrase: "Не понимаю, как выбрать правильное решение",
    hiddenPain: "Страх ошибиться и потратить ресурсы зря",
    meaning: `${product} дает понятный маршрут вместо хаотичных попыток`,
    topic: `${i + 1}. Почему старый способ не дает результата`,
    format: ["Пост", "Карусель", "Reels"][i % 3],
    rubric: state.rubrics[0]?.name || "Разбор ошибок",
    huntStage: "Ищет решение",
    functionType: ["Польза", "Доверие", "Кейс", "Продажа"][i % 4]
  }));
}
