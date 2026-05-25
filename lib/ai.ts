import { PlannerState } from "./types";

type GenerateArgs = {
  state: PlannerState;
  task: string;
  count?: number;
};

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
          content: JSON.stringify({ task, count, state })
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
  return JSON.parse(text);
}

function mockGenerate(task: string, count: number, state: PlannerState) {
  const product = state.product.name || "продукт";
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
