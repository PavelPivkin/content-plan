export type FunctionType = "Польза" | "Доверие" | "Кейс" | "Продажа" | "Сервис";
export type HuntStage = "Не осознает" | "Осознает проблему" | "Ищет решение" | "Сравнивает" | "Готов купить";
export type Status = "Черновик" | "В работе" | "Запланировано" | "Готово" | "Опубликовано";

export type Product = {
  name: string;
  positioning: string;
  usp: string;
  competitorPositioning: string;
  offer: string;
};

export type AudienceSegment = {
  id: string;
  name: string;
  description: string;
  huntStage: HuntStage;
  pains: string;
  clientWords: string;
};

export type Rubric = {
  id: string;
  name: string;
  task: string;
  functionType: FunctionType;
  formats: string;
  segment: string;
  active: boolean;
};

export type Idea = {
  id: string;
  audience: string;
  source: string;
  clientPhrase: string;
  hiddenPain: string;
  meaning: string;
  topic: string;
  format: string;
  rubric: string;
  huntStage: HuntStage;
  functionType: FunctionType;
};

export type Publication = {
  id: string;
  ideaId: string;
  publishDate: string;
  publishTime: string;
  weekday: string;
  platform: string;
  audience: string;
  rubric: string;
  functionType: FunctionType;
  format: string;
  topic: string;
  hook: string;
  theses: string;
  cta: string;
  offer: string;
  status: Status;
};

export type Settings = {
  spreadsheetId: string;
  googleApiKey: string;
  appsScriptUrl: string;
  calendarId: string;
  openaiApiKey: string;
  openaiModel: string;
};

export type PlannerState = {
  product: Product;
  audience: AudienceSegment[];
  rubrics: Rubric[];
  ideas: Idea[];
  publications: Publication[];
  settings: Settings;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: PlannerState;
};

export type Workspace = {
  version: 2;
  activeProjectId: string;
  projects: Project[];
};
