"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatDate, type Training } from "@/lib/data";
import { downloadPptx } from "@/lib/pptx";
import { btn, Modal } from "@/components/ui";
import { SlideView } from "@/components/SlideView";

export default function TrainingsPage() {
  const { trainings } = useStore();
  // Members only see a training after the discussion happened and the manager
  // approved sharing the slides.
  const past = trainings
    .filter((t) => t.status === "completed" && t.sharedWithTeam)
    .sort((a, b) => (b.discussionDate ?? "").localeCompare(a.discussionDate ?? ""));
  const [open, setOpen] = useState<Training | null>(null);
  const [i, setI] = useState(0);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Past trainings</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          A training shows up here after your team&apos;s discussion, once your manager shares the slides.
        </p>
      </div>

      {past.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-muted">
          No trainings have been shared yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {past.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-line p-3.5">
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{t.topic}</span>
                <span className="text-sm text-muted">
                  {formatDate(t.discussionDate)} · Product Design · {t.slides.length} slides
                </span>
              </span>
              <span className="flex gap-2">
                <button type="button" className={btn.secondary} onClick={() => { setOpen(t); setI(0); }}>
                  View slides
                </button>
                <button type="button" className={btn.ghost} onClick={() => downloadPptx(t)}>
                  Download .pptx
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.topic ?? ""}>
        {open && (
          <>
            <SlideView slide={open.slides[i]} />
            <div className="flex items-center justify-between gap-2">
              <button type="button" className={btn.secondary} disabled={i === 0} onClick={() => setI(i - 1)}>
                Previous
              </button>
              <span className="text-sm text-muted">
                {i + 1} of {open.slides.length}
              </span>
              <button
                type="button"
                className={btn.secondary}
                disabled={i === open.slides.length - 1}
                onClick={() => setI(i + 1)}
              >
                Next
              </button>
            </div>
            <button type="button" className={btn.ghost} onClick={() => setOpen(null)}>
              Close
            </button>
          </>
        )}
      </Modal>
    </main>
  );
}
