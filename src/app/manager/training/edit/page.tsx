"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Slide } from "@/lib/data";
import { downloadPptx } from "@/lib/pptx";
import { aiErrorMessage, toSlide, useAI } from "@/lib/ai";
import { btn, inputCls, MinutesInput, PageHeader, Tag } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SlideView } from "@/components/SlideView";
import { useFlip } from "@/lib/useFlip";

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
      <Editor />
    </Suspense>
  );
}

type Proposal = { slide: number; before: Slide; after: Slide; summary: string };
type ChatItem = {
  from: "you" | "ai";
  text: string;
  proposal?: Proposal;
  resolved?: "accepted" | "rejected";
  pending?: boolean;
  error?: boolean;
};

// Stable ids for slides so reordering animates; kept outside the deck data.
const slideIds = new WeakMap<Slide, string>();
let slideSeq = 0;
const idOf = (s: Slide) => {
  let v = slideIds.get(s);
  if (!v) slideIds.set(s, (v = `sl${++slideSeq}`));
  return v;
};

function Editor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { trainings, updateTraining, updateSlide } = useStore();
  const t = trainings.find((x) => x.id === id);
  const [sel, setSel] = useState(0);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [msg, setMsg] = useState("");
  const [thinking, setThinking] = useState(false);
  const ai = useAI();
  const slides = t?.slides ?? [];
  const register = useFlip(slides.map(idOf));

  if (!t) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <p>That training wasn&apos;t found.</p>
        <Link href="/manager/">Back to overview</Link>
      </main>
    );
  }

  const i = Math.min(sel, t.slides.length - 1);
  const slide = t.slides[i];
  const total = t.slides.reduce((a, s) => a + s.minutes, 0);
  const setSlides = (next: Slide[]) => updateTraining(t.id, (x) => ({ ...x, slides: next }));
  const moveSlide = (dir: -1 | 1) => {
    const n = [...t.slides];
    [n[i + dir], n[i]] = [n[i], n[i + dir]];
    setSlides(n);
    setSel(i + dir);
  };

  // Ask the AI to change the selected slide. The result is a proposal the
  // manager applies or dismisses, like a tracked change.
  const ask = async (request: string, shown: string) => {
    if (!slide || thinking) return;
    const index = i;
    const before = slide;
    setThinking(true);
    setChat((c) => [...c, { from: "you", text: shown }, { from: "ai", text: `Working on slide ${index + 1}…`, pending: true }]);
    let reply: ChatItem;
    try {
      const out = await ai.run("revise", {
        topic: t.topic,
        outline: t.slides.map((s) => s.title),
        index,
        slide: before,
        request,
      });
      const after = toSlide(out.slide);
      const summary = out.summary.replace(/\.$/, "");
      reply = { from: "ai", text: summary, proposal: { slide: index, before, after, summary } };
    } catch (e) {
      reply = { from: "ai", text: aiErrorMessage(e), error: true };
    }
    setChat((c) => [...c.slice(0, -1), reply]);
    setThinking(false);
  };
  const send = () => {
    const text = msg.trim();
    if (!text) return;
    setMsg("");
    ask(text, text);
  };
  const resolve = (k: number, accept: boolean) => {
    const item = chat[k];
    if (accept && item.proposal) updateSlide(t.id, item.proposal.slide, item.proposal.after);
    setChat(chat.map((c, j) => (j === k ? { ...c, resolved: accept ? "accepted" : "rejected" } : c)));
  };

  return (
    <>
      <PageHeader
        title={t.topic}
        back={{ href: "/manager/", label: "Overview" }}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            {t.status === "draft" ? <Tag>Draft</Tag> : t.status === "published" ? <Tag tone="info">Scheduled</Tag> : <Tag tone="good">Discussion done</Tag>}
            <span>
              {t.slides.length} slides · about {total} min
            </span>
          </span>
        }
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-muted">
              Discussion date
              <input
                type="date"
                value={t.discussionDate ?? ""}
                onChange={(e) => updateTraining(t.id, (x) => ({ ...x, discussionDate: e.target.value || undefined }))}
                className="min-h-10 rounded-md border border-line-strong px-2 text-ink"
              />
            </label>
            <button type="button" className={btn.secondary} onClick={() => downloadPptx(t)}>
              <Icon name="download" size={16} />
              Download .pptx
            </button>
            {t.status === "draft" && (
              <button
                type="button"
                className={btn.primary}
                onClick={() => {
                  updateTraining(t.id, (x) => ({ ...x, status: "published" }));
                  router.push("/manager/");
                }}
              >
                Approve
              </button>
            )}
          </>
        }
      />

      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-0 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <aside aria-label="Slides" className="border-b border-line bg-surface lg:min-h-[calc(100vh-150px)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Slides</span>
            <button
              type="button"
              aria-label="Add slide"
              title="Add slide"
              onClick={() => {
                const n = [...t.slides];
                n.splice(i + 1, 0, { kind: "idea", title: "New slide", bullets: ["New point"], notes: "", minutes: 1 });
                setSlides(n);
                setSel(i + 1);
              }}
              className={btn.icon}
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          <ol className="flex gap-2 overflow-x-auto p-2 lg:flex-col lg:gap-0 lg:p-0">
            {t.slides.map((s, k) => (
              <li key={idOf(s)} ref={register(idOf(s))} className="flex-none bg-surface lg:border-b lg:border-line">
                <button
                  type="button"
                  onClick={() => setSel(k)}
                  aria-current={k === i ? "true" : undefined}
                  className={
                    "flex w-44 items-start gap-2.5 border-l-[3px] px-3 py-2.5 text-left lg:w-full " +
                    (k === i ? "border-brand bg-brand-wash" : "border-transparent hover:bg-subtle")
                  }
                >
                  <span className="mt-0.5 w-4 text-right text-xs text-muted">{k + 1}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13px] font-medium">{s.title}</span>
                    <span className="text-xs text-muted">
                      {s.kind[0].toUpperCase() + s.kind.slice(1)} · {s.minutes} min
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {slide && (
          <section aria-label="Selected slide" className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2">
              <span className="text-sm text-muted">
                Slide {i + 1} of {t.slides.length}
              </span>
              <div className="flex flex-wrap items-center">
                <button type="button" aria-label="Move slide up" title="Move up" className={btn.icon} disabled={i === 0} onClick={() => moveSlide(-1)}>
                  <Icon name="up" />
                </button>
                <button
                  type="button"
                  aria-label="Move slide down"
                  title="Move down"
                  className={btn.icon}
                  disabled={i === t.slides.length - 1}
                  onClick={() => moveSlide(1)}
                >
                  <Icon name="down" />
                </button>
                <button
                  type="button"
                  className={btn.ghost}
                  disabled={thinking}
                  onClick={() =>
                    ask(
                      "Rewrite this slide from scratch with fresh wording and a different angle. Keep its kind, purpose and timing.",
                      `Regenerate slide ${i + 1}`,
                    )
                  }
                >
                  <Icon name="sparkle" size={16} />
                  Regenerate
                </button>
                <button
                  type="button"
                  aria-label="Delete slide"
                  title="Delete slide"
                  className={btn.icon}
                  disabled={t.slides.length <= 1}
                  onClick={() => { setSlides(t.slides.filter((_, k) => k !== i)); setSel(Math.max(0, i - 1)); }}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-4 sm:p-6">
              <div className="mx-auto w-full max-w-3xl shadow-[0_2px_8px_rgba(16,38,47,0.12)]">
                <SlideView slide={slide} />
              </div>

              <div className="mx-auto grid w-full max-w-3xl gap-4 rounded-md border border-line bg-surface p-5 sm:grid-cols-[1fr_120px]">
                <Field label="Title" value={slide.title} onChange={(v) => updateSlide(t.id, i, { title: v })} />
                <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                  Minutes
                  <MinutesInput
                    key={`${t.id}-${i}`}
                    value={slide.minutes}
                    onChange={(n) => updateSlide(t.id, i, { minutes: n })}
                    className={inputCls + " font-normal"}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
                  Bullet points, one per line
                  <textarea
                    rows={4}
                    value={slide.bullets.join("\n")}
                    onChange={(e) => updateSlide(t.id, i, { bullets: e.target.value.split("\n") })}
                    className={inputCls + " py-2 font-normal"}
                  />
                </label>
                <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                  <Field label="Discussion prompt" value={slide.prompt ?? ""} onChange={(v) => updateSlide(t.id, i, { prompt: v || undefined })} />
                  <Field label="Video title" value={slide.videoTitle ?? ""} onChange={(v) => updateSlide(t.id, i, { videoTitle: v || undefined })} />
                  <Field label="Video link (YouTube)" value={slide.videoUrl ?? ""} onChange={(v) => updateSlide(t.id, i, { videoUrl: v || undefined })} />
                </div>
                <label className="flex flex-col gap-1.5 text-[13px] font-medium sm:col-span-2">
                  Speaker notes
                  <textarea
                    rows={3}
                    value={slide.notes}
                    onChange={(e) => updateSlide(t.id, i, { notes: e.target.value })}
                    className={inputCls + " py-2 font-normal"}
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        <aside aria-label="Revise with AI" className="flex flex-col border-t border-line bg-surface lg:min-h-[calc(100vh-150px)] lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Icon name="sparkle" size={16} className="text-brand" />
            <span className="text-sm font-semibold">Revise with AI</span>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {chat.length === 0 && (
              <p className="text-sm text-muted">
                Describe a change to slide {i + 1}. You&apos;ll review each suggested edit before it&apos;s applied.
              </p>
            )}
            {chat.map((c, k) =>
              c.from === "you" ? (
                <div key={k} className="max-w-[85%] self-end rounded-md bg-nav px-3 py-2 text-sm text-nav-text">
                  {c.text}
                </div>
              ) : !c.proposal ? (
                <div
                  key={k}
                  role={c.error ? "alert" : "status"}
                  className={"rounded-md border px-3 py-2 text-sm " + (c.error ? "border-[#f3c1bd] bg-[#fdf0ef] text-[#b42318]" : "border-line text-muted")}
                >
                  {c.text}
                </div>
              ) : (
                <div key={k} className="flex flex-col gap-2 rounded-md border border-line bg-surface text-sm">
                  <div className="border-b border-line px-3 py-2 text-[13px] font-medium">
                    Slide {c.proposal ? c.proposal.slide + 1 : ""}: {c.text}
                  </div>
                  {c.proposal && (
                    <div className="flex flex-col gap-1 px-3 pb-3">
                      {c.proposal.after.title !== c.proposal.before.title && (
                        <div>
                          <span className="text-muted">Title:</span> {c.proposal.after.title}
                        </div>
                      )}
                      {c.proposal.before.bullets
                        .filter((b) => !c.proposal!.after.bullets.includes(b))
                        .map((b) => (
                          <div key={"o" + b} className="bg-[#fbe9e7] px-1.5 py-0.5 text-[#7a2a1d] line-through">
                            {b}
                          </div>
                        ))}
                      {c.proposal.after.bullets
                        .filter((b) => !c.proposal!.before.bullets.includes(b))
                        .map((b) => (
                          <div key={"n" + b} className="bg-good-soft px-1.5 py-0.5 text-good">
                            {b}
                          </div>
                        ))}
                      {(c.proposal.after.prompt ?? "") !== (c.proposal.before.prompt ?? "") && (
                        <div>
                          <span className="text-muted">Discuss:</span> {c.proposal.after.prompt || "(removed)"}
                        </div>
                      )}
                      {c.proposal.after.notes !== c.proposal.before.notes && (
                        <div className="text-xs text-muted">Speaker notes updated</div>
                      )}
                      {c.resolved ? (
                        <div className="pt-1 text-xs font-medium text-muted">{c.resolved === "accepted" ? "Applied" : "Dismissed"}</div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button type="button" className={btn.primary} onClick={() => resolve(k, true)}>
                            Apply
                          </button>
                          <button type="button" className={btn.secondary} onClick={() => resolve(k, false)}>
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label className="sr-only" htmlFor="chat">
              Ask for a change
            </label>
            <input
              id="chat"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="e.g. Make the scenario about remote work"
              className={inputCls}
            />
            <button type="submit" aria-label="Send" className={btn.primary + " px-3"} disabled={thinking || !msg.trim()}>
              <Icon name="send" size={16} />
            </button>
          </form>
        </aside>
      </div>
    </>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium">
      {label}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " font-normal"} />
    </label>
  );
}
