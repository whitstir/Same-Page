"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { contentOptions, generateDeck, suggestSubtopics, topicSuggestions, type ContentId } from "@/lib/data";
import { btn, inputCls, MinutesInput, PageBody, PageHeader, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useFlip } from "@/lib/useFlip";

type Sub = { id: string; title: string; minutes: number };
let subSeq = 0;
const withIds = (list: { title: string; minutes: number }[]): Sub[] =>
  list.map((s) => ({ ...s, id: `s${++subSeq}` }));

const steps = [
  { label: "Topic", hint: "What the team needs" },
  { label: "Length", hint: "How long to discuss" },
  { label: "Slide contents", hint: "What to include" },
  { label: "Subtopics", hint: "Outline and timing" },
  { label: "Generate", hint: "Review and create" },
];

export default function NewTraining() {
  const router = useRouter();
  const { update } = useStore();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(0); // index into topics, or -1 for custom
  const [topics, setTopics] = useState(topicSuggestions.map((t) => ({ ...t })));
  const [editing, setEditing] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [contents, setContents] = useState<ContentId[]>(["intro", "idea", "discussion", "scenario", "video", "wrap-up"]);
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const topic = picked === -1 ? custom.trim() : topics[picked]?.title ?? "";
  const [fallback] = useState(() => withIds(suggestSubtopics("this topic", 10)));
  const subtopics = subs ?? fallback;
  const register = useFlip(subtopics.map((s) => s.id));
  const totalMin = subtopics.reduce((a, s) => a + s.minutes, 0);

  const goTo = (n: number) => {
    if (n === 3 && !subs) setSubs(withIds(suggestSubtopics(topic, minutes)));
    setStep(n);
  };

  const move = (i: number, dir: -1 | 1) => {
    const n = [...subtopics];
    [n[i + dir], n[i]] = [n[i], n[i + dir]];
    setSubs(n);
  };

  const generate = () => {
    setGenerating(true);
    const id = `t${Date.now()}`;
    const slides = generateDeck(topic, minutes, contents, subtopics);
    setTimeout(() => {
      update((s) => ({
        ...s,
        trainings: [{ id, topic, minutes, status: "draft", sharedWithTeam: false, slides }, ...s.trainings],
      }));
      router.push(`/manager/training/edit/?id=${id}`);
    }, 900);
  };

  return (
    <>
      <PageHeader title="New training" meta="Discussion slides for your team" back={{ href: "/manager/", label: "Overview" }} />
      <PageBody>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Steps" className="lg:sticky lg:top-20">
            <ol className="flex gap-1 overflow-x-auto rounded-md border border-line bg-surface p-1 lg:flex-col lg:gap-0 lg:p-0">
              {steps.map((s, i) => {
                const state = i === step ? "current" : i < step ? "done" : "todo";
                return (
                  <li key={s.label} className="flex-none lg:border-b lg:border-line lg:last:border-b-0">
                    <button
                      type="button"
                      disabled={i > step}
                      onClick={() => goTo(i)}
                      aria-current={state === "current" ? "step" : undefined}
                      className={
                        "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left lg:rounded-none lg:border-l-[3px] lg:px-4 lg:py-3 " +
                        (state === "current"
                          ? "bg-brand-wash lg:border-brand"
                          : "lg:border-transparent " + (state === "done" ? "hover:bg-subtle" : ""))
                      }
                    >
                      <span
                        className={
                          "flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold " +
                          (state === "done"
                            ? "bg-brand text-white"
                            : state === "current"
                              ? "border-2 border-brand text-brand-ink"
                              : "border border-line-strong text-muted")
                        }
                      >
                        {state === "done" ? <Icon name="check" size={14} /> : i + 1}
                      </span>
                      <span className="flex flex-col">
                        <span className={"whitespace-nowrap text-sm font-medium " + (state === "todo" ? "text-muted" : "text-ink")}>{s.label}</span>
                        <span className="hidden text-xs text-muted lg:block">{s.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <Panel
            title={["Choose a topic", "Set the length", "Choose slide contents", "Plan the subtopics", "Review and generate"][step]}
            subtitle={
              [
                "Ranked by what this week's team summary shows the team needs most",
                "Most team discussions run 5 to 10 minutes",
                "Every slide includes speaker notes with talking points and timing",
                `Fit to ${minutes} minutes · reorder, rename or retime each one`,
                "Check the details, then generate the slide deck",
              ][step]
            }
            bodyClassName=""
          >
            <div className="p-5">
              {step === 0 && (
                <fieldset className="flex flex-col divide-y divide-line rounded-md border border-line">
                  <legend className="sr-only">Topics</legend>
                  {topics.map((t, i) => (
                    <div key={i} className={"flex items-start gap-3 px-4 py-3.5 " + (picked === i ? "bg-brand-wash" : "")}>
                      <input
                        id={`topic-${i}`}
                        type="radio"
                        name="topic"
                        checked={picked === i}
                        onChange={() => setPicked(i)}
                        className="mt-1 h-4 w-4 accent-brand"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {editing === i ? (
                          <input
                            autoFocus
                            aria-label="Topic"
                            value={t.title}
                            onChange={(e) => setTopics(topics.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                            className={inputCls + " font-medium"}
                          />
                        ) : (
                          <label htmlFor={`topic-${i}`} className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            {t.title}
                            {i === 0 && <span className="text-xs font-medium text-brand-ink">Recommended</span>}
                          </label>
                        )}
                        <span className="text-[13px] text-muted">{t.why[0].toUpperCase() + t.why.slice(1)}</span>
                      </div>
                      <button type="button" aria-label={`Edit ${t.title}`} className={btn.icon} onClick={() => { setPicked(i); setEditing(i); }}>
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  ))}
                  <div className={"flex items-start gap-3 px-4 py-3.5 " + (picked === -1 ? "bg-brand-wash" : "")}>
                    <input
                      id="topic-custom"
                      type="radio"
                      name="topic"
                      checked={picked === -1}
                      onChange={() => setPicked(-1)}
                      className="mt-3 h-4 w-4 accent-brand"
                    />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label htmlFor="topic-custom-text" className="text-sm font-medium">
                        Your own topic
                      </label>
                      <input
                        id="topic-custom-text"
                        type="text"
                        value={custom}
                        onFocus={() => setPicked(-1)}
                        onChange={(e) => { setCustom(e.target.value); setPicked(-1); }}
                        placeholder="e.g. Running meetings that end on time"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <div className="flex max-w-md flex-col gap-4">
                  <label className="flex flex-col gap-3 text-sm">
                    <span className="flex items-baseline justify-between">
                      <span className="font-medium">Discussion length</span>
                      <span className="text-2xl font-semibold">{minutes} min</span>
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={5}
                      value={minutes}
                      onChange={(e) => { setMinutes(Number(e.target.value)); setSubs(null); }}
                      className="w-full accent-brand"
                    />
                    <span className="flex justify-between text-xs text-muted">
                      <span>5 min</span>
                      <span>30 min</span>
                    </span>
                  </label>
                  <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                    <span className="text-muted">Format</span>
                    <span className="font-medium">Discussion slides (.pptx)</span>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {contentOptions.map((c) => (
                    <label key={c.id} className="flex min-h-11 items-center gap-3 border-b border-line text-sm">
                      <input
                        type="checkbox"
                        checked={contents.includes(c.id)}
                        onChange={(e) =>
                          setContents(e.target.checked ? [...contents, c.id] : contents.filter((x) => x !== c.id))
                        }
                        className="h-4 w-4 accent-brand"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{subtopics.length} subtopics</span>
                    <span className={totalMin > minutes ? "font-medium text-warn" : "text-muted"}>
                      {totalMin} of {minutes} min planned
                    </span>
                  </div>
                  <ol className="flex flex-col rounded-md border border-line">
                    {subtopics.map((s, i) => (
                      <li
                        key={s.id}
                        ref={register(s.id)}
                        className="relative flex flex-wrap items-center gap-2 border-b border-line bg-surface px-2 py-1.5 last:border-b-0"
                      >
                        <span className="w-6 text-center text-xs font-medium text-muted">{i + 1}</span>
                        <input
                          aria-label={`Subtopic ${i + 1}`}
                          value={s.title}
                          onChange={(e) => setSubs(subtopics.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                          className="min-h-10 min-w-0 flex-[1_1_220px] rounded-md border border-transparent px-2 text-sm hover:border-line focus:border-brand focus:outline-none"
                        />
                        <span className="flex items-center gap-1.5 text-sm text-muted">
                          <MinutesInput
                            aria-label={`Minutes for subtopic ${i + 1}`}
                            value={s.minutes}
                            max={30}
                            onChange={(n) => setSubs(subtopics.map((x, j) => (j === i ? { ...x, minutes: n } : x)))}
                            className="min-h-10 w-12 rounded-md border border-line-strong px-2 text-center text-ink"
                          />
                          min
                        </span>
                        <span className="flex">
                          <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className={btn.icon}>
                            <Icon name="up" />
                          </button>
                          <button
                            type="button"
                            aria-label="Move down"
                            disabled={i === subtopics.length - 1}
                            onClick={() => move(i, 1)}
                            className={btn.icon}
                          >
                            <Icon name="down" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${s.title}`}
                            onClick={() => setSubs(subtopics.filter((_, j) => j !== i))}
                            className={btn.icon}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    onClick={() => setSubs([...subtopics, ...withIds([{ title: "New subtopic", minutes: 2 }])])}
                    className={btn.ghost + " self-start"}
                  >
                    <Icon name="plus" size={16} />
                    Add subtopic
                  </button>
                </div>
              )}

              {step === 4 && (
                <dl className="divide-y divide-line rounded-md border border-line text-sm">
                  {[
                    ["Topic", topic],
                    ["Length", `${minutes} min`],
                    ["Format", "Discussion slides (.pptx)"],
                    ["Slide contents", contentOptions.filter((c) => contents.includes(c.id)).map((c) => c.label).join(", ")],
                    ["Subtopics", subtopics.map((s) => `${s.title} (${s.minutes} min)`).join(" · ")],
                  ].map(([k, v]) => (
                    <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-subtle px-5 py-3">
              {step === 0 ? (
                <Link href="/manager/" className={btn.secondary}>
                  Cancel
                </Link>
              ) : (
                <button type="button" className={btn.secondary} onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              {step < 4 ? (
                <button type="button" className={btn.primary} disabled={!topic} onClick={() => goTo(step + 1)}>
                  Continue
                </button>
              ) : (
                <button type="button" className={btn.primary} disabled={generating || !topic} onClick={generate}>
                  <Icon name="sparkle" size={16} />
                  {generating ? "Generating slides…" : "Generate slides"}
                </button>
              )}
            </footer>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
