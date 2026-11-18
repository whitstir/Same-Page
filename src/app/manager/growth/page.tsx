"use client";

import { useStore } from "@/lib/store";
import { weekLabels } from "@/lib/data";
import { Card, Pill } from "@/components/ui";

export default function GrowthPage() {
  const { goals, trainings } = useStore();
  const trainingWeeks = trainings
    .filter((t) => t.status === "completed" && t.discussionDate)
    .map((t) => ({ topic: t.topic, week: weekIndex(t.discussionDate!) }))
    .filter((t) => t.week >= 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Team growth</h1>
        <p className="mt-1 text-sm text-muted">
          Average weekly rating from members, 1 to 5. A week shows only when at least 3 members rated.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-subtle px-4 py-3.5 text-sm leading-relaxed">
        <strong>What changed this week (AI note):</strong> &quot;Give useful feedback&quot; dropped for two weeks, then
        started to recover after the Nov 5 discussion on handoffs. &quot;Own our work&quot; stays the team&apos;s strongest
        value.
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {goals
          .filter((g) => !g.archived)
          .map((g) => {
            const now = g.history[g.history.length - 1];
            const prev = g.history[g.history.length - 2];
            const delta = now != null && prev != null ? now - prev : 0;
            return (
              <Card key={g.id} className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-bold">{g.title}</h2>
                  <Pill>{g.kind}</Pill>
                </div>
                <div className="text-sm text-muted">
                  This week <strong className="text-lg text-ink">{now != null ? now.toFixed(1) : "—"}</strong> ·{" "}
                  {Math.abs(delta) < 0.05 ? "no change" : `${delta > 0 ? "up" : "down"} ${Math.abs(delta).toFixed(1)} from last week`}
                </div>
                <Chart values={g.history} title={g.title} markers={trainingWeeks} />
              </Card>
            );
          })}
      </div>
    </main>
  );
}

function weekIndex(iso: string) {
  const start = new Date("2026-09-28T00:00:00").getTime();
  const d = new Date(iso + "T12:00:00").getTime();
  const w = Math.floor((d - start) / (7 * 86400000));
  return w >= 0 && w < weekLabels.length ? w : -1;
}

function Chart({ values, title, markers }: { values: number[]; title: string; markers: { topic: string; week: number }[] }) {
  if (values.length === 0) return <p className="text-sm text-muted">No ratings yet. Members rate this in their next weekly check-in.</p>;
  const n = weekLabels.length;
  const x = (i: number) => 30 + i * (360 / (n - 1));
  const y = (v: number) => 120 - (v - 1) * 25;
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg
      role="img"
      aria-label={`${title}: weekly average from ${values[0]} to ${values[values.length - 1]} over ${values.length} weeks (sample data)`}
      viewBox="0 0 400 160"
      className="h-auto w-full"
    >
      {[5, 3, 1].map((v) => (
        <g key={v}>
          <line x1="30" y1={y(v)} x2="390" y2={y(v)} stroke="#EAEEF2" />
          <text x="4" y={y(v) + 4} fontSize="11" fill="#57606A">
            {v}
          </text>
        </g>
      ))}
      {markers.map((m) => (
        <g key={m.topic}>
          <line x1={x(m.week)} y1="14" x2={x(m.week)} y2="126" stroke="#57606A" strokeDasharray="4 4" />
          <text x={x(m.week)} y="152" fontSize="11" fill="#57606A" textAnchor="middle">
            Training
            <title>{m.topic}</title>
          </text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke="#2F5BEA" strokeWidth="2.5" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#2F5BEA">
          <title>
            {weekLabels[i]}: {v.toFixed(1)}
          </title>
        </circle>
      ))}
      <text x="30" y="140" fontSize="11" fill="#57606A">
        {weekLabels[0]}
      </text>
      <text x="390" y="140" fontSize="11" fill="#57606A" textAnchor="end">
        {weekLabels[n - 1]}
      </text>
    </svg>
  );
}
