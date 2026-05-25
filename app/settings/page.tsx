"use client";

import { SettingsPanel } from "@/components/SettingsPanel";
import { PageHeader } from "@/components/PageHeader";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Интеграции"
        subtitle="Подключите Google Sheets, Google Calendar и OpenAI. Данные сохраняются локально, пока интеграции не настроены."
      />
      <SettingsPanel />
    </>
  );
}
