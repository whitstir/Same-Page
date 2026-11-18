"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatDate, team, teamSummary, type Training } from "@/lib/data";
import { btn, ButtonLink, Card, Pill } from "@/components/ui";
import { downloadPptx } from "@/lib/pptx";

const statusLabel = (t: Training) =>
  t.status === "draft" ? "Draft" : t.status === "published" ? "Approved" : t.sharedWithTeam ? "Shared with team" : "Discussion done";

export default function Dashboard() {
  const { members, goals, trainings, checkInsToday, updateTraining } = useStore();
  const total = members.length;
  const unlocked = checkInsToday >= 3;
  const next = trainings
    .filter((t) => t.status === "published" && t.discussionDate)
    .sort((a, b) => (a.discussionDate ?? "").localeCompare(b.discussionDate ?? ""))[0];


  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="mt-1 text-sm text-muted">Week of Nov 16 · {total} members</p>
        </div>
        <ButtonLink href="/manager/training/new/">+ Create training</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-muted">Today&apos;s check-in</div>
          <div className="mt-1.5 text-3xl font-bold">
            {checkInsToday} of {total}
          </div>
          <div className="mt-1 text-sm text-muted">members completed. We never show who.</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Weekly ratings</div>
          <div className="mt-1.5 text-3xl font-bold">7 of {total}</div>
          <div className="mt-1 text-sm text-muted">members rated goals and values this week</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">Next discussion</div>
          <div className="mt-1.5 text-lg font-bold">{next ? formatDate(next.discussionDate) : "None scheduled"}</div>
          <div className="mt-1 text-sm text-muted">{next ? `${next.topic} · ${next.minutes} min` : "Create a training to schedule one"}</div>
        </Card>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[2_1_420px] flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Anonymous team summary</h2>
            <span className="text-sm text-muted">Updated in batches · last at 3:00 PM</span>
          </div>
          <p className="rounded-lg border border-dashed border-line-strong bg-subtle px-3 py-2.5 text-sm text-muted">
            Written by AI from anonymous response summaries. Shown only after 3 or more members respond. No names, no quotes.
          </p>
          {unlocked ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryList title="Wins" items={teamSummary.wins} />
                <SummaryList title="Friction points" items={teamSummary.friction} />
                <SummaryList title="Issues raised" items={teamSummary.issues} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
                <div className="text-sm">
                  <strong>What the team needs most:</strong> {teamSummary.topNeed}
                </div>
                <Link href="/manager/training/new/" className="text-sm font-semibold">
                  Turn this into a training →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm">Waiting for at least 3 check-ins before showing a summary.</p>
          )}
        </Card>

        <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Goals and core values</h2>
            <Link href="/manager/settings/" className="text-sm">
              Edit
            </Link>
          </div>
          <div className="text-sm text-muted">Average weekly rating, 1 to 5</div>
          {goals
            .filter((g) => !g.archived)
            .map((g) => {
              const score = g.history[g.history.length - 1] ?? 0;
              return (
                <div key={g.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-sm">
                    <span>
                      {g.title} <span className="text-xs text-muted">· {g.kind}</span>
                    </span>
                    <strong>{score ? score.toFixed(1) : "—"}</strong>
                  </div>
                  <div className="h-2 rounded bg-[#eaeef2]">
                    <div className="h-2 rounded bg-brand" style={{ width: `${(score / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          <Link href="/manager/growth/" className="text-sm font-semibold">
            See team growth →
          </Link>
        </Card>
      </div>

      <Card className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Trainings</h2>
          <span className="text-sm text-muted">Members see a training only after the discussion, once you share it</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="border-b border-line p-2 font-medium">Training</th>
                <th className="border-b border-line p-2 font-medium">Status</th>
                <th className="border-b border-line p-2 font-medium">Discussion date</th>
                <th className="border-b border-line p-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t.id}>
                  <td className="border-b border-[#eaeef2] p-2">{t.topic}</td>
                  <td className="border-b border-[#eaeef2] p-2">
                    <Pill>{statusLabel(t)}</Pill>
                  </td>
                  <td className="border-b border-[#eaeef2] p-2">{formatDate(t.discussionDate)}</td>
                  <td className="border-b border-[#eaeef2] p-2">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {t.status === "published" && (
                        <button
                          type="button"
                          className={btn.secondary}
                          onClick={() => updateTraining(t.id, (x) => ({ ...x, status: "completed" }))}
                        >
                          Mark discussion done
                        </button>
                      )}
                      {t.status === "completed" && !t.sharedWithTeam && (
                        <button
                          type="button"
                          className={btn.primary}
                          onClick={() => updateTraining(t.id, (x) => ({ ...x, sharedWithTeam: true }))}
                        >
                          Share slides with team
                        </button>
                      )}
                      {t.status === "completed" && t.sharedWithTeam && (
                        <button
                          type="button"
                          className={btn.ghost}
                          onClick={() => updateTraining(t.id, (x) => ({ ...x, sharedWithTeam: false }))}
                        >
                          Stop sharing
                        </button>
                      )}
                      <Link href={`/manager/training/edit/?id=${t.id}`} className={btn.ghost}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => downloadPptx(t)}
                        aria-label={`Download ${t.topic} as .pptx`}
                        title="Download .pptx"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                      >
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v12" />
                          <path d="M7 10l5 5 5-5" />
                          <path d="M5 21h14" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <ul className="list-disc pl-5 text-sm leading-relaxed">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
