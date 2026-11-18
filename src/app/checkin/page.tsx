"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emptyCheckIn, useStore, type CheckIn } from "@/lib/store";
import { summarizeCheckIn } from "@/lib/data";
import { btn, ButtonLink, Modal, PrototypeNote } from "@/components/ui";

const otherTeamGoals = [{ id: "ls1", title: "Hit the Feb 1 date", kind: "goal" as const }];

export default function CheckInPage() {
  const store = useStore();
  const router = useRouter();
  const { checkIn, weekly, goals, submittedToday, update } = store;
  const [step, setStep] = useState(1);
  const [reviewing, setReviewing] = useState(false);

  const set = (patch: Partial<CheckIn>) => update((s) => ({ ...s, checkIn: { ...s.checkIn, ...patch } }));
  const rate = (id: string, n: number) => set({ ratings: { ...checkIn.ratings, [id]: n } });

  const submit = () => {
    // Raw answers go to the AI and are then thrown away; only the summary and
    // numeric ratings would be saved. The prototype simply clears them.
    update((s) => ({
      ...s,
      checkIn: emptyCheckIn,
      submittedToday: true,
      checkInsToday: Math.min(s.members.length, s.checkInsToday + 1),
    }));
    setReviewing(false);
    router.push("/checkin/done/");
  };

  if (submittedToday) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">You already checked in today</h1>
        <p className="text-muted">Come back tomorrow for the next one.</p>
        <ButtonLink href="/trainings/" variant="secondary">See past trainings</ButtonLink>
        <button
          type="button"
          className="text-sm text-muted underline"
          onClick={() => update((s) => ({ ...s, submittedToday: false }))}
        >
          Prototype: start a new day
        </button>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const activeGoals = goals.filter((g) => !g.archived);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-1">
        {weekly && step === 2 && (
          <span className="self-start rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink">
            First check-in this week
          </span>
        )}
        <h1 className="text-2xl font-bold">{step === 1 ? "Today's check-in" : weekly ? "This week's questions" : "Almost done"}</h1>
        <p className="text-sm text-muted">
          {today} · step {step} of 2
        </p>
        <div aria-hidden="true" className="mt-2 h-1.5 rounded bg-[#eaeef2]">
          <div className="h-1.5 rounded bg-brand transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
        </div>
      </div>

      {step === 1 && (
        <>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-muted">Goes to:</span>
            <span className="rounded-full border border-line px-2.5 py-1">Product Design</span>
            <span className="rounded-full border border-line px-2.5 py-1">Launch squad</span>
          </div>
          <TextQuestion n={1} label="What went well today?" placeholder="A win, big or small" value={checkIn.wentWell} onChange={(v) => set({ wentWell: v })} />
          <TextQuestion n={2} label="What could've gone better?" placeholder="Anything that got in the way" value={checkIn.couldBeBetter} onChange={(v) => set({ couldBeBetter: v })} />
          <TextQuestion n={3} label="Are there any issues that need to be addressed?" placeholder="Optional" value={checkIn.issues} onChange={(v) => set({ issues: v })} />
          <p className="rounded-lg bg-subtle p-3 text-sm leading-relaxed text-muted">
            Your answers are summarized by AI and then deleted. Your manager sees only a team summary, never your words or
            your name.
          </p>
          <button type="button" className={`${btn.primary} min-h-12 text-base`} onClick={() => setStep(2)}>
            Next
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={weekly}
              onChange={(e) => update((s) => ({ ...s, weekly: e.target.checked }))}
              className="h-4 w-4 accent-brand"
            />
            Prototype: treat this as the first check-in of the week
          </label>
        </>
      )}

      {step === 2 && (
        <>
          <button type="button" className="self-start text-sm text-brand" onClick={() => setStep(1)}>
            ← Back
          </button>

          {weekly && (
            <>
              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-2.5 text-base font-semibold">4. How do you feel you&apos;ve improved since last week?</legend>
                <Scale label="Improvement" value={checkIn.improvement} onChange={(n) => set({ improvement: n })} />
                <div className="flex justify-between text-xs text-muted">
                  <span>Not at all</span>
                  <span>A lot</span>
                </div>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-muted">Tell us more (optional)</span>
                  <textarea
                    rows={2}
                    value={checkIn.improvementNote}
                    onChange={(e) => set({ improvementNote: e.target.value })}
                    className="rounded-lg border border-line p-3 text-base"
                  />
                </label>
              </fieldset>

              <div className="flex flex-col gap-3">
                <div className="text-base font-semibold">5. How is each team doing on its goals and values?</div>
                <div className="text-sm text-muted">1 = not yet, 5 = nailing it</div>
                <TeamRatings name="Product Design" goals={activeGoals} ratings={checkIn.ratings} onRate={rate} />
                <TeamRatings name="Launch squad" goals={otherTeamGoals} ratings={checkIn.ratings} onRate={rate} />
              </div>
            </>
          )}

          <TextQuestion
            n={weekly ? 6 : 4}
            label="Anything else you want to say? (feel free to rant)"
            value={checkIn.anythingElse}
            onChange={(v) => set({ anythingElse: v })}
          />

          <button type="button" className={`${btn.outline} min-h-12 text-base`} onClick={() => setReviewing(true)}>
            Review summary
          </button>
          <button type="button" className={`${btn.primary} min-h-12 text-base`} onClick={submit}>
            Submit check-in
          </button>
        </>
      )}

      <Modal open={reviewing} onClose={() => setReviewing(false)} title="Here's what we heard from you">
        <p className="leading-relaxed">{summarizeCheckIn(checkIn)}</p>
        <p className="text-sm leading-relaxed text-muted">
          Only you can see this. Your manager gets a team summary built from 3 or more check-ins, never this one on its
          own.
        </p>
        <PrototypeNote>In the real app, AI writes this summary. The prototype builds it from your answers.</PrototypeNote>
        <div className="flex gap-2">
          <button type="button" className={`${btn.secondary} min-h-12 flex-1`} onClick={() => setReviewing(false)}>
            Edit answers
          </button>
          <button type="button" className={`${btn.primary} min-h-12 flex-1`} onClick={submit}>
            Looks right, submit
          </button>
        </div>
      </Modal>
    </main>
  );
}

function TextQuestion({
  n,
  label,
  placeholder,
  value,
  onChange,
}: {
  n: number;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-semibold">
        {n}. {label}
      </span>
      <textarea
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-line p-3 text-base"
      />
    </label>
  );
}

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${label}: ${n} of 5`}
          onClick={() => onChange(n)}
          className={
            "h-12 flex-1 rounded-xl text-base " +
            (value === n ? "bg-brand font-semibold text-white" : "border border-line bg-white text-ink hover:border-brand")
          }
        >
          {n}
        </button>
      ))}
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
    <div className="flex flex-col gap-3.5 rounded-xl border border-line p-3.5">
      <div className="text-sm font-bold">{name}</div>
      {goals.map((g) => (
        <div key={g.id} className="flex flex-col gap-2">
          <div className="text-sm">
            {g.title} <span className="text-xs text-muted">· {g.kind}</span>
          </div>
          <Scale label={g.title} value={ratings[g.id] ?? 0} onChange={(n) => onRate(g.id, n)} />
        </div>
      ))}
    </div>
  );
}
