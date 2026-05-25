"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";

type Column<T> = {
  key: keyof T;
  label: string;
  tone?: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "neutral";
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  editHref,
  onDelete,
  emptyText = "Пока нет записей"
}: {
  rows: T[];
  columns: Column<T>[];
  editHref: (id: string) => string;
  onDelete: (id: string) => void;
  emptyText?: string;
}) {
  const badgeTone = {
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    neutral: "badge-neutral"
  };

  const renderValue = (column: Column<T>, row: T) => {
    const value = row[column.key];
    if (column.render) return column.render(value, row);
    if (typeof value === "boolean") {
      return <span className={clsx("rounded-full px-3 py-1 text-sm font-semibold", value ? "bg-success/10 text-success" : "bg-base-200 text-neutral/55")}>{value ? "Да" : "Нет"}</span>;
    }
    if (column.tone) {
      return <span className={clsx("badge whitespace-nowrap px-3 py-3 text-sm font-semibold", badgeTone[column.tone])}>{String(value || "—")}</span>;
    }
    return <span className="line-clamp-3 whitespace-pre-wrap">{String(value || "—")}</span>;
  };

  return (
    <div>
      {rows.length === 0 && <div className="glass-panel premium-border rounded-xl p-8 text-center text-neutral/60">{emptyText}</div>}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => {
          const titleColumn = columns[0];
          const badgeColumns = columns.filter((column) => column.tone).slice(0, 3);
          const detailColumns = columns.filter((column) => column !== titleColumn);

          return (
            <article key={row.id} className="premium-border rounded-xl bg-white/95 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral/45">{titleColumn.label}</div>
                  <div className="mt-1 line-clamp-2 text-lg font-bold leading-snug">{renderValue(titleColumn, row)}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link className="btn btn-primary btn-xs rounded-lg" href={editHref(row.id)} title="Редактировать"><Pencil size={14} /></Link>
                  <button className="btn btn-ghost btn-xs rounded-lg text-error" onClick={() => onDelete(row.id)} title="Удалить"><Trash2 size={14} /></button>
                </div>
              </div>
              {badgeColumns.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {badgeColumns.map((column) => <span key={String(column.key)}>{renderValue(column, row)}</span>)}
                </div>
              )}
              <div className="collapse collapse-arrow mt-4 rounded-lg bg-base-100/80">
                <input type="checkbox" />
                <div className="collapse-title min-h-0 py-3 text-sm font-semibold text-neutral/70">Показать детали</div>
                <div className="collapse-content grid gap-3 pt-0">
                  {detailColumns.map((column) => (
                    <div key={String(column.key)} className="rounded-lg border border-base-300/70 bg-white/70 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral/45">{column.label}</div>
                      <div className="mt-1 text-sm">{renderValue(column, row)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
            </div>
      {rows.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-base-300/80 bg-white/90 shadow-sm md:block">
          <table className="table table-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="whitespace-nowrap bg-base-200/80 text-neutral/70">{column.label}</th>
                ))}
                <th className="w-28 bg-base-200/80 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="max-w-72 align-top text-sm">
                      {renderValue(column, row)}
                    </td>
                  ))}
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link className="btn btn-ghost btn-xs rounded-lg" href={editHref(row.id)} title="Редактировать"><Pencil size={15} /></Link>
                      <button className="btn btn-ghost btn-xs rounded-lg text-error" onClick={() => onDelete(row.id)} title="Удалить">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
