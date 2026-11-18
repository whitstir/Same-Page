"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import type { Slide } from "@/lib/data";
import { downloadPptx } from "@/lib/pptx";
import { btn, MinutesInput, Pill, PrototypeNote } from "@/components/ui";
import { SlideView } from "@/components/SlideView";

export default function EditorPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
      <Editor />
    </Suspense>
  );
}

type Proposal = { slide: number; before: Slide; after: Slide; summary: string };
type ChatItem = { from: "you" | "ai"; text: string; proposal?: Proposal; resolved?: "accepted" | "rejected" };

function proposeChange(req: string, index: number, s: Slide): Proposal {
  const r = req.toLowerCase();
  let after: Slide;
  let summary: string;
  if (/short|trim|cut/.test(r)) {
    after = { ...s, bullets: s.bullets.slice(0, Math.max(1, s.bullets.length - 1)), minutes: Math.max(1, s.minutes - 1) };
    summary = "Remove the last bullet and save a minute";
  } else if (/remote/.test(r)) {
    after = {
      ...s,
      bullets: s.bullets.map((b) =>
        b.replace(/the day before a deadline/i, "on a video call, with cameras off").replace(/room/i, "call"),
      ),
      notes: s.notes + " Ask how this feels different on a call than in person.",
    };
    summary = "Set the scenario on a video call";
  } else {
    after = { ...s, bullets: [...s.bullets, req.replace(/^(add|make|please)\s+/i, "").replace(/^\w/, (c) => c.toUpperCase())] };
    summary = "Add a bullet for your request";
  }
  return { slide: index, before: s, after, summary };
}

function Editor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { trainings, updateTraining, updateSlide } = useStore();
  const t = trainings.find((x) => x.id === id);
  const [sel, setSel] = useState(0);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [msg, setMsg] = useState("");

  if (!t) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <p>That training wasn&apos;t found.</p>
        <Link href="/manager/">Back to the dashboard</Link>
      </main>
    );
  }

  const i = Math.min(sel, t.slides.length - 1);
  const slide = t.slides[i];
  const total = t.slides.reduce((a, s) => a + s.minutes, 0);
  const setSlides = (slides: Slide[]) => updateTraining(t.id, (x) => ({ ...x, slides }));

  const send = () => {
    const text = msg.trim();
    if (!text || !slide) return;
    const p = proposeChange(text, i, slide);
    setChat([...chat, { from: "you", text }, { from: "ai", text: `Proposed change to slide ${i + 1}: ${p.summary}.`, proposal: p }]);
    setMsg("");
  };
  const resolve = (k: number, accept: boolean) => {
    const item = chat[k];
    if (accept && item.proposal) updateSlide(t.id, item.proposal.slide, item.proposal.after);
    setChat(chat.map((c, j) => (j === k ? { ...c, resolved: accept ? "accepted" : "rejected" } : c)));
  };

  return (
    <main className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/manager/" className="text-sm">
            ← Dashboard
          </Link>
          <input
            aria-label="Training title"
            value={t.topic}
            onChange={(e) => updateTraining(t.id, (x) => ({ ...x, topic: e.target.value }))}
            className="min-h-11 min-w-0 rounded-md border border-transparent px-2 font-bold hover:border-line focus:border-line"
          />
          <Pill>{t.status === "draft" ? "Draft" : t.status === "published" ? "Approved" : "Discussion done"}</Pill>
          <span className="text-sm text-muted">
            {t.slides.length} slides · about {total} min
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            Discussion date
            <input
              type="date"
              value={t.discussionDate ?? ""}
              onChange={(e) => updateTraining(t.id, (x) => ({ ...x, discussionDate: e.target.value || undefined }))}
              className="min-h-11 rounded-lg border border-line px-2"
            />
          </label>
          <button type="button" className={btn.secondary} onClick={() => downloadPptx(t)}>
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
        </div>
      </div>

      <div className="flex flex-wrap">
        <aside aria-label="Slides" className="flex max-w-full flex-[1_1_200px] flex-col gap-2.5 border-line p-4 md:border-r">
          {t.slides.map((s, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSel(k)}
              aria-current={k === i ? "true" : undefined}
              className={
                "flex min-h-11 w-full items-start gap-2 rounded-lg p-2.5 text-left " +
                (k === i ? "border-2 border-brand bg-brand-wash" : "border border-line bg-white")
              }
            >
              <span className="text-xs text-muted">{k + 1}</span>
              <span className="text-[13px] font-semibold">{s.title}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const n = [...t.slides];
              n.splice(i + 1, 0, { kind: "idea", title: "New slide", bullets: ["New point"], notes: "", minutes: 1 });
              setSlides(n);
              setSel(i + 1);
            }}
            className="min-h-11 rounded-lg border border-dashed border-line-strong text-sm"
          >
            + Add slide
          </button>
        </aside>

        {slide ? (
          <section aria-label="Selected slide" className="flex min-w-0 flex-[999_1_460px] flex-col gap-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">
                Slide {i + 1} of {t.slides.length} · {slide.kind} · {slide.minutes} min
              </span>
              <div className="flex flex-wrap gap-1">
                <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => { const n = [...t.slides]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setSlides(n); setSel(i - 1); }}>
                  Move up
                </button>
                <button type="button" className={btn.ghost} disabled={i === t.slides.length - 1} onClick={() => { const n = [...t.slides]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setSlides(n); setSel(i + 1); }}>
                  Move down
                </button>
                <button
                  type="button"
                  className={btn.secondary}
                  onClick={() => updateSlide(t.id, i, { bullets: [...slide.bullets].reverse(), title: slide.title.replace(/ \(v\d+\)$/, "") + " (v2)" })}
                >
                  Regenerate this slide
                </button>
                <button
                  type="button"
                  className={btn.secondary}
                  disabled={t.slides.length <= 1}
                  onClick={() => { setSlides(t.slides.filter((_, k) => k !== i)); setSel(Math.max(0, i - 1)); }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="max-w-3xl">
              <SlideView slide={slide} />
            </div>

            <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
              <Field label="Title" value={slide.title} onChange={(v) => updateSlide(t.id, i, { title: v })} />
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Minutes
                <MinutesInput
                  key={`${t.id}-${i}`}
                  value={slide.minutes}
                  onChange={(n) => updateSlide(t.id, i, { minutes: n })}
                  className="min-h-11 rounded-lg border border-line px-2.5 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                Bullet points (one per line)
                <textarea
                  rows={4}
                  value={slide.bullets.join("\n")}
                  onChange={(e) => updateSlide(t.id, i, { bullets: e.target.value.split("\n") })}
                  className="rounded-lg border border-line p-2.5 font-normal"
                />
              </label>
              <Field label="Discussion prompt" value={slide.prompt ?? ""} onChange={(v) => updateSlide(t.id, i, { prompt: v || undefined })} />
              <Field label="YouTube video" value={slide.videoTitle ?? ""} onChange={(v) => updateSlide(t.id, i, { videoTitle: v || undefined })} />
              <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                Speaker notes
                <textarea
                  rows={3}
                  value={slide.notes}
                  onChange={(e) => updateSlide(t.id, i, { notes: e.target.value })}
                  className="rounded-lg border border-line p-2.5 font-normal"
                />
              </label>
            </div>
          </section>
        ) : null}

        <aside aria-label="Side chat" className="flex max-w-full flex-[1_1_300px] flex-col gap-3 border-line bg-subtle p-4 md:border-l">
          <div className="font-semibold">Revise with AI</div>
          <PrototypeNote>Stand-in for the AI. Try &quot;make the scenario about remote work&quot; or &quot;shorten this&quot;.</PrototypeNote>
          {chat.map((c, k) =>
            c.from === "you" ? (
              <div key={k} className="max-w-[85%] self-end rounded-xl bg-brand-soft px-3 py-2.5 text-sm">
                {c.text}
              </div>
            ) : (
              <div key={k} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 text-sm">
                <div className="text-muted">{c.text}</div>
                {c.proposal && (
                  <>
                    {c.proposal.before.bullets
                      .filter((b) => !c.proposal!.after.bullets.includes(b))
                      .map((b) => (
                        <div key={"o" + b} className="text-muted line-through">
                          {b}
                        </div>
                      ))}
                    {c.proposal.after.bullets
                      .filter((b) => !c.proposal!.before.bullets.includes(b))
                      .map((b) => (
                        <div key={"n" + b} className="rounded bg-[#e6f4ea] px-1">
                          {b}
                        </div>
                      ))}
                    {c.resolved ? (
                      <div className="text-xs font-semibold text-muted">{c.resolved === "accepted" ? "Accepted" : "Rejected"}</div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" className={btn.primary} onClick={() => resolve(k, true)}>
                          Accept
                        </button>
                        <button type="button" className={btn.secondary} onClick={() => resolve(k, false)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ),
          )}
          <form
            className="mt-auto flex gap-2"
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
              placeholder={`Change slide ${i + 1}…`}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm"
            />
            <button type="submit" className={btn.primary}>
              Send
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-lg border border-line px-2.5 font-normal"
      />
    </label>
  );
}
