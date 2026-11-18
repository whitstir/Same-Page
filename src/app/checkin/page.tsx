"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { emptyCheckIn, useStore, type CheckIn } from "@/lib/store";
import { summarizeCheckIn } from "@/lib/data";
import { btn, ButtonLink, inputCls, Modal, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";

const otherTeamGoals = [{ id: "ls1", title: "Hit the Feb 1 date", kind: "goal" as const }];

export default function CheckInPage() {
  const store = useStore();
  const router = useRouter();
  const { checkIn, weekly, goals, submittedToday, update } = store;
  const [step, setStep] = useState(1);
  const [reviewing, setReviewing] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const set = (patch: Partial<CheckIn>) => update((s) => ({ ...s, checkIn: { ...s.checkIn, ...patch } }));
  const rate = (id: string, n: number) => set({ ratings: { ...checkIn.ratings, [id]: n } });

  const submit = () => {
    // Raw answers are discarded once summarized; only the summary and the
    // numeric ratings are kept.
    update((s) => ({
      ...s,
      checkIn: emptyCheckIn,
      submittedToday: true,
      weekly: false,
      checkInsToday: Math.min(s.members.length, s.checkInsToday + 1),
    }));
    setReviewing(false);
    router.push("/checkin/done/");
  };

  if (submittedToday) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <Icon name="checkCircle" size={40} className="text-brand" />
        <h1 className="text-xl font-semibold">You&apos;ve checked in today</h1>
        <p className="text-sm text-muted">Your next check-in opens tomorrow.</p>
        <ButtonLink href="/trainings/" variant="secondary" className="mt-2">
          View past trainings
        </ButtonLink>
      </main>
    );
  }

  const activeGoals = goals.filter((g) => !g.archived);

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-5">
          <div className="flex items-center justify-between text-[13px] text-muted">
            <span>{today}</span>
            <span>
              Step {step} of 2
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 1 ? "Daily check-in" : weekly ? "Weekly questions" : "Anything else?"}
          </h1>
          <div aria-hidden="true" className="grid grid-cols-2 gap-1">
            <span className="h-1 bg-brand" />
            <span className={"h-1 " + (step === 2 ? "bg-brand" : "bg-[#dfe5ea]")} />
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="lock" size={14} />
            Anonymous · shared with Product Design and Launch squad as a team summary only
          </p>
        </div>
      </div>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5">
        {step === 1 && (
          <>
            <Panel bodyClassName="flex flex-col divide-y divide-line">
              <TextQuestion n={1} label="What went well today?" placeholder="A win, big or small" value={checkIn.wentWell} onChange={(v) => set({ wentWell: v })} />
              <TextQuestion n={2} label="What could've gone better?" placeholder="Anything that got in the way" value={checkIn.couldBeBetter} onChange={(v) => set({ couldBeBetter: v })} />
              <TextQuestion
                n={3}
                label="Are there any issues that need to be addressed?"
                placeholder="Optional"
                value={checkIn.issues}
                onChange={(v) => set({ issues: v })}
              />
            </Panel>
            <button type="button" className={`${btn.primary} min-h-12 text-base`} onClick={() => setStep(2)}>
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {weekly && (
              <>
                <Panel title="4. How much do you feel you've improved since last week?" bodyClassName="flex flex-col gap-3 p-5">
                  <Scale label="Improvement" value={checkIn.improvement} onChange={(n) => set({ improvement: n })} />
                  <div className="flex justify-between text-xs text-muted">
                    <span>Not at all</span>
                    <span>A lot</span>
                  </div>
                  <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                    Details (optional)
                    <textarea
                      rows={2}
                      value={checkIn.improvementNote}
                      onChange={(e) => set({ improvementNote: e.target.value })}
                      className={inputCls + " py-2 text-base font-normal"}
                    />
                  </label>
                </Panel>

                <Panel title="5. How is each team doing on its goals and values?" subtitle="1 = not yet, 5 = consistently" bodyClassName="">
                  <TeamRatings name="Product Design" goals={activeGoals} ratings={checkIn.ratings} onRate={rate} />
                  <TeamRatings name="Launch squad" goals={otherTeamGoals} ratings={checkIn.ratings} onRate={rate} />
                </Panel>
              </>
            )}

            <Panel bodyClassName="">
              <TextQuestion
                n={weekly ? 6 : 4}
                label="Anything else you want to say?"
                hint="Vent if you need to. This stays anonymous."
                value={checkIn.anythingElse}
                onChange={(v) => set({ anythingElse: v })}
              />
            </Panel>

            <div className="flex flex-col gap-2">
              <button type="button" className={`${btn.outline} min-h-12 text-base`} onClick={() => setReviewing(true)}>
                <Icon name="eye" size={18} />
                Review summary
              </button>
              <button type="button" className={`${btn.primary} min-h-12 text-base`} onClick={submit}>
                Submit check-in
              </button>
              <button type="button" className={btn.ghost + " self-center text-muted"} onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          </>
        )}

        <Modal open={reviewing} onClose={() => setReviewing(false)} title="Your summary">
          <p className="border-l-[3px] border-brand bg-brand-wash px-4 py-3 leading-relaxed">{summarizeCheckIn(checkIn)}</p>
          <p className="flex gap-2 text-[13px] leading-relaxed text-muted">
            <Icon name="lock" size={16} className="mt-0.5" />
            Only you see this. Your manager sees a combined summary once 3 or more people have checked in, never your
            words.
          </p>
          <div className="flex gap-2">
            <button type="button" className={`${btn.secondary} min-h-11 flex-1`} onClick={() => setReviewing(false)}>
              Edit answers
            </button>
            <button type="button" className={`${btn.primary} min-h-11 flex-1`} onClick={submit}>
              Submit check-in
            </button>
          </div>
        </Modal>
      </main>
    </>
  );
}

function TextQuestion({
  n,
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  n: number;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 p-5">
      <span className="text-[15px] font-semibold">
        {n}. {label}
      </span>
      {hint && <span className="-mt-1 text-[13px] text-muted">{hint}</span>}
      <textarea
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls + " py-2.5 text-base"}
      />
    </label>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const rated = value > 0;
  const shown = rated ? value : 3;
  const pct = ((shown - 1) / 4) * 100;
  const commit = (v: string) => onChange(Number(v));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={shown}
          aria-label={label}
          aria-valuetext={rated ? `${value} of 5` : "Not rated yet"}
          onChange={(e) => commit(e.target.value)}
          onClick={(e) => commit(e.currentTarget.value)}
          onKeyUp={(e) => commit(e.currentTarget.value)}
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
          className={"range flex-1 " + (rated ? "" : "range-unset")}
        />
        <span className={"w-16 flex-none text-right text-sm " + (rated ? "font-semibold text-ink" : "text-muted")}>
          {rated ? `${value} / 5` : "Not rated"}
        </span>
      </div>
      <div aria-hidden="true" className="relative mr-20 h-4 text-xs text-muted">
        {[1, 2, 3, 4, 5].map((n, i) => (
          <span
            key={n}
            className={"absolute -translate-x-1/2 " + (rated && n === value ? "font-semibold text-brand-ink" : "")}
            style={{ left: `calc(11px + (100% - 22px) * ${i / 4})` }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function TeamRatings({
  name,
  goals,
  ratings,
  onRate,
}: {
  name: string;
  goals: { id: string; title: string; kind: string }[];
  ratings: Record<string, number>;
  onRate: (id: string, n: number) => void;
}) {
  return (
    <div className="border-b border-line last:border-b-0">
      <div className="bg-subtle px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{name}</div>
      <div className="flex flex-col gap-4 px-5 py-4">
        {goals.map((g) => (
          <div key={g.id} className="flex flex-col gap-2">
            <div className="text-sm font-medium">
              {g.title} <span className="font-normal text-muted">· {g.kind === "goal" ? "Goal" : "Value"}</span>
            </div>
            <Scale label={g.title} value={ratings[g.id] ?? 0} onChange={(n) => onRate(g.id, n)} />
          </div>
        ))}
      </div>
    </div>
  );
}
