const SHEETS = {
  product: "Продукт",
  audience: "ЦА",
  rubrics: "Рубрики",
  ideas: "Банк идей",
  publications: "Контент план"
};

const HEADERS = {
  [SHEETS.product]: ["Название", "Позиционирование", "УТП", "Отстройка", "Оффер"],
  [SHEETS.audience]: ["ID", "Сегмент", "Описание", "Ступень Ханта", "Боли", "Слова клиента"],
  [SHEETS.rubrics]: ["ID", "Рубрика", "Задача", "Функция", "Форматы", "Сегмент", "Активна"],
  [SHEETS.ideas]: ["ID", "ЦА", "Источник", "Фраза клиента", "Скрытая боль", "Смысл", "Тема", "Формат", "Рубрика", "Хант", "Функция"],
  [SHEETS.publications]: ["ID", "Дата", "Время", "День недели", "Площадка", "ЦА", "Рубрика", "Функция", "Формат", "Тема", "Крючок захвата внимания", "Тезисы", "CTA", "Оффер", "Статус"]
};

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  if (payload.action === "calendar") return json(createCalendarEvent_(payload.calendarId, payload.publication));
  if (payload.action === "sync") return json(sync_(payload.state));
  return json({ ok: false, error: "Unknown action" });
}

function sync_(state) {
  if (!hasMeaningfulContent_(state)) {
    throw new Error("Sync rejected: the project contains no meaningful content.");
  }
  const spreadsheet = SpreadsheetApp.getActive();
  writeRows_(spreadsheet, SHEETS.product, [[
    state.product.name,
    state.product.positioning,
    state.product.usp,
    state.product.competitorPositioning,
    state.product.offer
  ]]);
  writeRows_(spreadsheet, SHEETS.audience, state.audience.map((x) => [x.id, x.name, x.description, x.huntStage, x.pains, x.clientWords]));
  writeRows_(spreadsheet, SHEETS.rubrics, state.rubrics.map((x) => [x.id, x.name, x.task, x.functionType, x.formats, x.segment, x.active]));
  writeRows_(spreadsheet, SHEETS.ideas, state.ideas.map((x) => [x.id, x.audience, x.source, x.clientPhrase, x.hiddenPain, x.meaning, x.topic, x.format, x.rubric, x.huntStage, x.functionType]));
  writeRows_(spreadsheet, SHEETS.publications, state.publications.map((x) => [x.id, x.publishDate, x.publishTime, x.weekday, x.platform, x.audience, x.rubric, x.functionType, x.format, x.topic, x.hook, x.theses, x.cta, x.offer, x.status]));
  return { ok: true };
}

function hasMeaningfulContent_(state) {
  const product = state.product || {};
  const hasProduct = [product.name, product.positioning, product.usp, product.competitorPositioning, product.offer]
    .some((value) => String(value || "").trim());
  const hasAudience = (state.audience || []).some((item) => [item.name, item.description, item.pains, item.clientWords]
    .some((value) => String(value || "").trim()));
  const hasRubrics = (state.rubrics || []).some((item) => [item.name, item.task, item.segment]
    .some((value) => String(value || "").trim()));
  return hasProduct || hasAudience || hasRubrics || (state.ideas || []).length > 0 || (state.publications || []).length > 0;
}

function writeRows_(spreadsheet, sheetName, rows) {
  const sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS[sheetName].length).setValues([HEADERS[sheetName]]);
  if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS[sheetName].length).setValues(rows);
  sheet.autoResizeColumns(1, HEADERS[sheetName].length);
}

function createCalendarEvent_(calendarId, publication) {
  const calendar = CalendarApp.getCalendarById(calendarId);
  const start = new Date(`${publication.publishDate}T${publication.publishTime || "10:00"}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const event = calendar.createEvent(`Публикация: ${publication.topic}`, start, end, {
    description: [
      `Площадка: ${publication.platform}`,
      `Рубрика: ${publication.rubric}`,
      `Формат: ${publication.format}`,
      `Крючок: ${publication.hook}`,
      `ЦА: ${publication.audience}`,
      `CTA: ${publication.cta}`,
      "",
      publication.theses
    ].join("\n")
  });
  return { ok: true, eventId: event.getId() };
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
