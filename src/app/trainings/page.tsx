"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatDate, type Training } from "@/lib/data";
import { downloadPptx } from "@/lib/pptx";
import { btn, Modal, PageBody, PageHeader, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
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
    <>
      <PageHeader title="Past trainings" meta="Slides from your team's discussions, shared by your manager" narrow />
      <PageBody narrow>
        <Panel bodyClassName="">
          {past.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No trainings have been shared yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {past.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-brand-soft text-brand-ink">
                    <Icon name="slides" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{t.topic}</span>
                    <span className="text-[13px] text-muted">
                      {formatDate(t.discussionDate)} · Product Design · {t.slides.length} slides
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <button type="button" className={btn.secondary} onClick={() => { setOpen(t); setI(0); }}>
                      View slides
                    </button>
                    <button
                      type="button"
                      className={btn.icon}
                      aria-label={`Download ${t.topic} as .pptx`}
                      title="Download .pptx"
                      onClick={() => downloadPptx(t)}
                    >
                      <Icon name="download" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </PageBody>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.topic ?? ""} wide>
        {open && (
          <>
            <SlideView slide={open.slides[i]} />
            <div className="flex items-center justify-between gap-2">
              <button type="button" className={btn.secondary} disabled={i === 0} onClick={() => setI(i - 1)}>
                <Icon name="chevronLeft" size={16} />
                Previous
              </button>
              <span className="text-sm text-muted">
                {i + 1} / {open.slides.length}
              </span>
              <button type="button" className={btn.secondary} disabled={i === open.slides.length - 1} onClick={() => setI(i + 1)}>
                Next
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
