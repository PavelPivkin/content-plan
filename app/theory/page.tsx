import { PageHeader } from "@/components/PageHeader";
import { formatMatrix, theoryBlocks } from "@/lib/theory";
import { sheetTabs as tabs } from "@/lib/sheets-schema";

export default function TheoryPage() {
  return (
    <>
      <PageHeader title="Теория" subtitle="Короткая база, спрятанная в интерфейсе за подсказками. Здесь она собрана как справочник." />
      <div className="grid gap-5 lg:grid-cols-3">
        {theoryBlocks.map((block) => (
          <section key={block.title} className="rounded-md border border-base-300 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">{block.title}</h2>
            <div className="space-y-3">
              {block.rows.map((row) => (
                <div key={row[0]} className="rounded-md bg-base-100 p-3">
                  <b>{row[0]}</b>
                  <p className="text-sm text-neutral/70">{row[1]}</p>
                  <p className="mt-1 text-sm">{row[2]}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="mt-5 rounded-md border border-base-300 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Матрица форматов</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead><tr><th>Задача</th><th>Форматы</th><th>Что важно</th></tr></thead>
            <tbody>{formatMatrix.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="mt-5 rounded-md border border-base-300 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Вкладки Google Sheets</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {tabs.map((tab) => (
            <div key={tab.name} className="rounded-md bg-base-100 p-3">
              <b>{tab.name}</b>
              <p className="mt-1 text-sm text-neutral/65">{tab.columns.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
