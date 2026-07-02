import { PlannerState } from "./types";

export function createDefaultState(): PlannerState {
  return {
    product: {
      name: "",
      positioning: "",
      usp: "",
      competitorPositioning: "",
      offer: ""
    },
    audience: [
      {
        id: "aud-1",
        name: "",
        description: "",
        huntStage: "Осознает проблему",
        pains: "",
        clientWords: ""
      }
    ],
    rubrics: [
      {
        id: "rub-1",
        name: "",
        task: "",
        functionType: "Польза",
        formats: "Пост, карусель",
        segment: "",
        active: true
      }
    ],
    ideas: [],
    publications: [],
    settings: {
      spreadsheetId: "",
      googleApiKey: "",
      appsScriptUrl: "",
      calendarId: "",
      openaiApiKey: "",
      openaiModel: "gpt-5-mini"
    }
  };
}

export const defaultState: PlannerState = createDefaultState();
