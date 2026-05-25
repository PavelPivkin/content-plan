"use client";

import { HelpCircle } from "lucide-react";
import { helpCards } from "@/lib/theory";

export function Help({ id }: { id: keyof typeof helpCards }) {
  const card = helpCards[id];
  return (
    <>
      <button className="btn btn-ghost btn-xs h-7 w-7 rounded-full p-0" onClick={() => (document.getElementById(`help-${id}`) as HTMLDialogElement)?.showModal()} title={card.title}>
        <HelpCircle size={16} />
      </button>
      <dialog id={`help-${id}`} className="modal">
        <div className="modal-box max-w-2xl rounded-md">
          <h3 className="text-lg font-bold">{card.title}</h3>
          <div className="paper my-4 rounded-md border border-base-300 p-4">
            <p className="leading-7">{card.body}</p>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary">Понятно</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
