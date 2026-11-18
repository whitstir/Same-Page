"use client";

import { useStore } from "@/lib/store";
import { weekLabels } from "@/lib/data";
import { PageBody, PageHeader, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";

export default function GrowthPage() {
  const { goals, trainings } = useStore();
  const trainingWeeks = trainings
    .filter((t) => t.status === "completed" && t.discussionDate)
    .map((t) => ({ topic: t.topic, week: weekIndex(t.discussionDate!) }))
    .filter((t) => t.week >= 0);

  return (
    <>
      <PageHeader title="Team growth" meta="Average weekly rating from members, out of 5 · last 8 weeks" />
      <PageBody>
        <Panel bodyClassName="flex gap-3 px-5 py-4 text-sm leading-relaxed">
          <Icon name="sparkle" className="mt-0.5 text-brand" />
          <p>
            <span className="font-semibold">This week:</span> &ldquo;Give useful feedback&rdquo; dropped for two weeks,
            then started to recover after the Nov 5 discussion on handoffs. &ldquo;Own our work&rdquo; is still the
            team&apos;s strongest value.
          </p>
        </Panel>

        <div className="grid gap-5 md:grid-cols-2">
          {goals
            .filter((g) => !g.archived)
            .map((g) => {
              const now = g.history[g.history.length - 1];
              const prev = g.history[g.history.length - 2];
              const delta = now != null && prev != null ? now - prev : 0;
              return (
                <Panel
                  key={g.id}
                  title={g.title}
                  subtitle={g.kind === "goal" ? "Goal" : "Core value"}
                  actions={
                    <span className="flex items-baseline gap-2">
                      <span className={"text-xs font-medium " + (delta > 0.05 ? "text-good" : delta < -0.05 ? "text-warn" : "text-muted")}>
                        {Math.abs(delta) < 0.05 ? "No change" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} vs last week`}
                      </span>
                      <span className="text-2xl font-semibold">{now != null ? now.toFixed(1) : "—"}</span>
                    </span>
                  }
                  bodyClassName="px-3 pb-2 pt-3"
                >
                  <Chart values={g.history} title={g.title} markers={trainingWeeks} />
                </Panel>
              );
            })}
        </div>
        <div className="flex items-center gap-5 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-5 bg-brand" />
            Weekly average
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-0 border-l border-dashed border-muted" />
            Team discussion
          </span>
        </div>
      </PageBody>
    </>
  );
}

function weekIndex(iso: string) {
  const start = new Date("2026-09-28T00:00:00").getTime();
  const d = new Date(iso + "T12:00:00").getTime();
  const w = Math.floor((d - start) / (7 * 86400000));
  return w >= 0 && w < weekLabels.length ? w : -1;
}

function Chart({ values, title, markers }: { values: number[]; title: string; markers: { topic: string; week: number }[] }) {
  if (values.length === 0)
    return <p className="px-2 py-8 text-sm text-muted">No ratings yet. Members rate this in their next weekly check-in.</p>;
  const n = weekLabels.length;
  const W = 420;
  const x = (i: number) => 28 + i * ((W - 40) / (n - 1));
  const y = (v: number) => 116 - (v - 1) * 25;
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${x(0)},${y(1)} ${pts} ${x(values.length - 1)},${y(1)}`;
  return (
    <svg
      role="img"
      aria-label={`${title}: weekly average from ${values[0]} to ${values[values.length - 1]} over ${values.length} weeks`}
      viewBox={`0 0 ${W} 150`}
      className="h-auto w-full"
    >
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1="28" y1={y(v)} x2={W - 12} y2={y(v)} stroke={v === 1 ? "#7f8c99" : "#e3e8ec"} />
          <text x="14" y={y(v) + 4} fontSize="11" fill="#4f5e6b" textAnchor="middle">
            {v}
          </text>
        </g>
      ))}
      {markers.map((m) => (
        <line key={m.topic} x1={x(m.week)} y1="12" x2={x(m.week)} y2={y(1)} stroke="#4f5e6b" strokeDasharray="3 3">
          <title>{`Discussion: ${m.topic}`}</title>
        </line>
      ))}
      <polygon points={area} fill="#1d6b73" opacity="0.08" />
      <polyline points={pts} fill="none" stroke="#1d6b73" strokeWidth="2" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" stroke="#1d6b73" strokeWidth="2">
          <title>{`${weekLabels[i]}: ${v.toFixed(1)}`}</title>
        </circle>
      ))}
      {weekLabels.map((l, i) =>
        i === 0 || i === 2 || i === 4 || i === n - 1 ? (
          <text key={l} x={x(i)} y="138" fontSize="11" fill="#4f5e6b" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
            {l}
          </text>
        ) : null,
      )}
    </svg>
  );
}
