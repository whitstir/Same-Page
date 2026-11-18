"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { contentOptions, suggestSubtopics, teamSummary, topicSuggestions, type ContentId } from "@/lib/data";
import { aiErrorMessage, toSlide, useAI } from "@/lib/ai";
import { btn, Card, MinutesInput } from "@/components/ui";
import { useFlip } from "@/lib/useFlip";

type Sub = { id: string; title: string; minutes: number };
let subSeq = 0;
const withIds = (list: { title: string; minutes: number }[]): Sub[] =>
  list.map((s) => ({ ...s, id: `s${++subSeq}` }));

const steps = ["Topic", "Length", "Slide contents", "Subtopics", "Generate"];

export default function NewTraining() {
  const router = useRouter();
  const { update, goals } = useStore();
  const ai = useAI();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(0); // index into topics, or -1 for custom
  const [topics, setTopics] = useState<{ title: string; why: string }[]>([]);
  const [topicsState, setTopicsState] = useState<"loading" | "ready" | "failed">("loading");
  const [topicsError, setTopicsError] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [contents, setContents] = useState<ContentId[]>(["intro", "idea", "discussion", "scenario", "video", "wrap-up"]);
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [subsFor, setSubsFor] = useState(""); // topic + length the subtopics were planned for
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const topic = picked === -1 ? custom.trim() : topics[picked]?.title ?? "";
  const subtopics = subs ?? [];
  const register = useFlip(subtopics.map((s) => s.id));
  const totalMin = subtopics.reduce((a, s) => a + s.minutes, 0);

  const loadTopics = async () => {
    setTopicsState("loading");
    setTopicsError("");
    try {
      const { topics: list } = await ai.run("topics", {
        summary: teamSummary,
        goals: goals
          .filter((g) => !g.archived)
          .map((g) => ({ title: g.title, kind: g.kind, recentRatings: g.history.slice(-4) })),
      });
      if (!list.length) throw new Error("The AI didn't suggest any topics.");
      setTopics(list);
      setTopicsState("ready");
    } catch (e) {
      setTopics(topicSuggestions.map((t) => ({ ...t })));
      setTopicsError(aiErrorMessage(e));
      setTopicsState("failed");
    }
  };

  useEffect(() => {
    loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planSubtopics = async () => {
    const key = `${topic}|${minutes}`;
    if (subs && subsFor === key) return;
    setSubsFor(key);
    setSubs(null);
    setSubsLoading(true);
    setSubsError("");
    try {
      const { subtopics: list } = await ai.run("subtopics", { topic, minutes, contents, summary: teamSummary });
      setSubs(withIds(list.map((s) => ({ title: s.title, minutes: Math.max(1, Math.round(s.minutes)) }))));
    } catch (e) {
      setSubs(withIds(suggestSubtopics(topic, minutes)));
      setSubsError(aiErrorMessage(e));
    } finally {
      setSubsLoading(false);
    }
  };

  const goTo = (n: number) => {
    if (n === 3) planSubtopics();
    setStep(n);
  };

  const generate = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const { slides } = await ai.run("deck", {
        topic,
        minutes,
        contents,
        subtopics: subtopics.map(({ title, minutes }) => ({ title, minutes })),
        summary: teamSummary,
      });
      if (!slides.length) throw new Error("The AI returned an empty deck. Try again.");
      const id = `t${Date.now()}`;
      update((s) => ({
        ...s,
        trainings: [
          { id, topic, minutes, status: "draft", sharedWithTeam: false, slides: slides.map(toSlide) },
          ...s.trainings,
        ],
      }));
      router.push(`/manager/training/edit/?id=${id}`);
    } catch (e) {
      setGenError(aiErrorMessage(e));
      setGenerating(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/manager/" className="text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-bold">New training</h1>
      </div>

      <ol aria-label="Steps" className="flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => goTo(i)}
              aria-current={i === step ? "step" : undefined}
              className={
                "rounded-full px-3 py-1.5 text-sm " +
                (i === step
                  ? "bg-brand font-semibold text-white"
                  : i < step
                    ? "border border-brand text-brand-ink"
                    : "border border-line text-muted")
              }
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <div>
            <h2 className="text-xl font-bold">What should this training be about?</h2>
            <p className="mt-1.5 text-sm text-muted">Ranked by what this week&apos;s anonymous summary says the team needs most.</p>
          </div>
          {topicsState === "loading" && (
            <p role="status" className="text-sm text-muted">
              Reading this week&apos;s summary and suggesting topics…
            </p>
          )}
          {topicsState === "failed" && (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-[#b35900]">
              {topicsError} Showing sample topics instead.
              <button type="button" className={btn.ghost} onClick={loadTopics}>
                Try again
              </button>
            </p>
          )}
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Suggested topics</legend>
            {topics.map((t, i) => (
              <div
                key={i}
                className={
                  "flex items-start gap-3 rounded-xl p-4 " +
                  (picked === i ? "border-2 border-brand bg-brand-wash" : "border border-line")
                }
              >
                <input
                  id={`topic-${i}`}
                  type="radio"
                  name="topic"
                  checked={picked === i}
                  onChange={() => setPicked(i)}
                  className="mt-1 h-[18px] w-[18px] accent-brand"
                />
                <div className="flex flex-1 flex-col gap-1">
                  {editing === i ? (
                    <input
                      autoFocus
                      aria-label="Topic"
                      value={t.title}
                      onChange={(e) => setTopics(topics.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      onBlur={() => setEditing(null)}
                      onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                      className="rounded-lg border border-line px-2 py-1.5 font-semibold"
                    />
                  ) : (
                    <label htmlFor={`topic-${i}`} className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-semibold">{t.title}</span>
                      <span className="rounded-full border border-line px-2 text-xs text-muted">#{i + 1} need</span>
                    </label>
                  )}
                  <span className="text-sm text-muted">Why: {t.why}</span>
                </div>
                <button type="button" className={btn.ghost} onClick={() => { setPicked(i); setEditing(i); }}>
                  Edit
                </button>
              </div>
            ))}
            <label
              className={
                "flex flex-col gap-1.5 rounded-xl p-4 " +
                (picked === -1 ? "border-2 border-brand bg-brand-wash" : "border border-dashed border-line-strong")
              }
            >
              <span className="font-semibold">Or write your own topic</span>
              <input
                type="text"
                value={custom}
                onFocus={() => setPicked(-1)}
                onChange={(e) => { setCustom(e.target.value); setPicked(-1); }}
                placeholder="e.g. Running meetings that end on time"
                className="min-h-11 rounded-lg border border-line bg-white px-3"
              />
            </label>
          </fieldset>
        </>
      )}

      {step === 1 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">How long should the discussion take?</h2>
          <label className="flex flex-col gap-2 text-sm">
            <span>
              <strong>{minutes} minutes</strong> (default is 5 to 10)
            </span>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={minutes}
              onChange={(e) => { setMinutes(Number(e.target.value)); setSubs(null); }}
              className="w-full max-w-md accent-brand"
            />
          </label>
          <p className="text-sm text-muted">Format: discussion slides (.pptx) that you present to the team. More formats later.</p>
        </Card>
      )}

      {step === 2 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">What goes in the slides</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {contentOptions.map((c) => (
              <label key={c.id} className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line px-3 text-sm">
                <input
                  type="checkbox"
                  checked={contents.includes(c.id)}
                  onChange={(e) =>
                    setContents(e.target.checked ? [...contents, c.id] : contents.filter((x) => x !== c.id))
                  }
                  className="h-[18px] w-[18px] accent-brand"
                />
                {c.label}
              </label>
            ))}
          </div>
          <p className="text-sm text-muted">Every slide gets speaker notes with talking points and timing.</p>
        </Card>
      )}

      {step === 3 && (
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Subtopics</h2>
            <span className={"text-sm " + (totalMin > minutes ? "font-semibold text-[#b35900]" : "text-muted")}>
              Suggested to fit {minutes} min · total {totalMin} min
            </span>
          </div>
          {subsLoading && (
            <p role="status" className="text-sm text-muted">
              Planning subtopics for {minutes} minutes…
            </p>
          )}
          {subsError && (
            <p role="alert" className="text-sm text-[#b35900]">
              {subsError} Showing a basic outline instead.
            </p>
          )}
          <ol className="flex flex-col gap-2">
            {subtopics.map((s, i) => (
              <li key={s.id} ref={register(s.id)} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-2 text-sm">
                <input
                  aria-label={`Subtopic ${i + 1}`}
                  value={s.title}
                  onChange={(e) => setSubs(subtopics.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                  className="min-h-11 min-w-0 flex-[1_1_220px] rounded-md border border-transparent px-2 hover:border-line focus:border-line"
                />
                <label className="flex items-center gap-1 text-muted">
                  <MinutesInput
                    aria-label={`Minutes for subtopic ${i + 1}`}
                    value={s.minutes}
                    max={30}
                    onChange={(n) => setSubs(subtopics.map((x, j) => (j === i ? { ...x, minutes: n } : x)))}
                    className="min-h-11 w-14 rounded-md border border-line px-2"
                  />
                  min
                </label>
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => {
                    const n = [...subtopics];
                    [n[i - 1], n[i]] = [n[i], n[i - 1]];
                    setSubs(n);
                  }}
                  className={btn.ghost}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === subtopics.length - 1}
                  onClick={() => {
                    const n = [...subtopics];
                    [n[i + 1], n[i]] = [n[i], n[i + 1]];
                    setSubs(n);
                  }}
                  className={btn.ghost}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setSubs(subtopics.filter((_, j) => j !== i))}
                  className="min-h-11 px-2 text-sm text-muted hover:text-ink"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setSubs([...subtopics, ...withIds([{ title: "New subtopic", minutes: 2 }])])}
            className="min-h-11 self-start rounded-lg border border-dashed border-line-strong px-3.5 text-sm"
          >
            + Add subtopic
          </button>
        </Card>
      )}

      {step === 4 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Ready to generate</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">Topic</dt>
            <dd>{topic}</dd>
            <dt className="text-muted">Length</dt>
            <dd>{minutes} min</dd>
            <dt className="text-muted">Contents</dt>
            <dd>{contentOptions.filter((c) => contents.includes(c.id)).map((c) => c.label).join(", ")}</dd>
            <dt className="text-muted">Subtopics</dt>
            <dd>{subtopics.map((s) => s.title).join(" · ")}</dd>
          </dl>
          <p className="text-sm text-muted">
            AI writes the deck and speaker notes. If you chose videos, it searches YouTube and checks each link exists
            before it goes on a slide. This can take up to a minute.
          </p>
          {genError && (
            <p role="alert" className="rounded-lg border border-[#f3c1bd] bg-[#fdf0ef] p-3 text-sm text-[#b42318]">
              {genError}
            </p>
          )}
        </Card>
      )}

      <div className="flex flex-wrap justify-between gap-3">
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
          <button
            type="button"
            className={btn.primary}
            disabled={!topic || (step === 0 && topicsState === "loading" && picked !== -1) || (step === 3 && subsLoading)}
            onClick={() => goTo(step + 1)}
          >
            Continue
          </button>
        ) : (
          <button type="button" className={btn.primary} disabled={generating || !topic || !subtopics.length} onClick={generate}>
            {generating ? "Generating slides…" : "Generate slides →"}
          </button>
        )}
      </div>
    </main>
  );
}
