"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatDate, team, teamSummary, type Training } from "@/lib/data";
import { downloadPptx } from "@/lib/pptx";
import { btn, ButtonLink, PageBody, PageHeader, Panel, Stat, Tag } from "@/components/ui";
import { Icon } from "@/components/Icon";

function status(t: Training) {
  if (t.status === "draft") return <Tag>Draft</Tag>;
  if (t.status === "published") return <Tag tone="info">Scheduled</Tag>;
  if (t.sharedWithTeam) return <Tag tone="good">Shared with team</Tag>;
  return <Tag tone="warn">Ready to share</Tag>;
}

export default function Dashboard() {
  const { members, goals, trainings, checkInsToday, updateTraining } = useStore();
  const total = members.length;
  const unlocked = checkInsToday >= 3;
  const next = trainings
    .filter((t) => t.status === "published" && t.discussionDate)
    .sort((a, b) => (a.discussionDate ?? "").localeCompare(b.discussionDate ?? ""))[0];
  const shared = trainings.filter((t) => t.sharedWithTeam).length;

  return (
    <>
      <PageHeader
        title={team.name}
        meta={`Week of Nov 16 · ${total} members`}
        actions={
          <ButtonLink href="/manager/training/new/">
            <Icon name="plus" size={16} />
            New training
          </ButtonLink>
        }
      />
      <PageBody>
        <Panel bodyClassName="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-line lg:grid-cols-4 [&>*]:bg-surface">
          <div>
            <Stat
              label="Checked in today"
              value={
                <>
                  {checkInsToday}
                  <span className="text-lg font-normal text-muted"> / {total}</span>
                </>
              }
              detail="Individual responses are never shown"
            />
            <div className="mx-5 mb-4 h-1.5 bg-[#e3e8ec]">
              <div className="h-1.5 bg-brand" style={{ width: `${(checkInsToday / total) * 100}%` }} />
            </div>
          </div>
          <Stat
            label="Weekly ratings"
            value={
              <>
                7<span className="text-lg font-normal text-muted"> / {total}</span>
              </>
            }
            detail="Goals and values rated this week"
          />
          <Stat
            label="Next discussion"
            value={<span className="text-xl">{next ? formatDate(next.discussionDate) : "None scheduled"}</span>}
            detail={next ? `${next.topic} · ${next.minutes} min` : "Create a training to schedule one"}
          />
          <Stat label="Trainings shared" value={shared} detail="Visible to members after the discussion" />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Team summary"
            subtitle={unlocked ? `Anonymous · ${checkInsToday} responses today · updated 3:00 PM` : "Anonymous"}
            actions={
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Icon name="lock" size={14} />
                Shown at 3+ responses
              </span>
            }
            bodyClassName=""
          >
            {unlocked ? (
              <>
                <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
                  <SummaryList title="Wins" color="bg-good" items={teamSummary.wins} />
                  <SummaryList title="Friction" color="bg-warn" items={teamSummary.friction} />
                  <SummaryList title="Issues raised" color="bg-info" items={teamSummary.issues} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-brand-wash px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-brand-ink">Top need this week:</span> {teamSummary.topNeed}
                  </div>
                  <ButtonLink href="/manager/training/new/" variant="outline">
                    Build a training
                  </ButtonLink>
                </div>
              </>
            ) : (
              <p className="px-5 py-8 text-sm text-muted">The summary appears once at least 3 members have checked in.</p>
            )}
          </Panel>

          <Panel
            title="Goals and values"
            subtitle="Average weekly rating, out of 5"
            actions={
              <Link href="/manager/growth/" className={btn.ghost}>
                Growth
                <Icon name="chevronRight" size={16} />
              </Link>
            }
            bodyClassName="divide-y divide-line"
          >
            {goals
              .filter((g) => !g.archived)
              .map((g) => {
                const score = g.history[g.history.length - 1] ?? 0;
                const prev = g.history[g.history.length - 2] ?? score;
                const d = score - prev;
                return (
                  <div key={g.id} className="flex flex-col gap-2 px-5 py-3">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">{g.title}</span>
                        <span className="ml-1.5 text-xs text-muted">{g.kind === "goal" ? "Goal" : "Value"}</span>
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className={"text-xs " + (d > 0.05 ? "text-good" : d < -0.05 ? "text-warn" : "text-muted")}>
                          {d > 0.05 ? `+${d.toFixed(1)}` : d < -0.05 ? d.toFixed(1) : "0.0"}
                        </span>
                        <strong className="font-semibold">{score ? score.toFixed(1) : "—"}</strong>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#e3e8ec]">
                      <div className="h-1.5 bg-brand" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </Panel>
        </div>

        <Panel title="Trainings" subtitle="Members see a training after the discussion, once you share it" bodyClassName="relative overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="bg-subtle text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="border-b border-line px-5 py-2.5 font-medium">Training</th>
                <th className="border-b border-line px-3 py-2.5 font-medium">Status</th>
                <th className="border-b border-line px-3 py-2.5 font-medium">Discussion</th>
                <th className="border-b border-line px-3 py-2.5 font-medium">Length</th>
                <th className="border-b border-line px-5 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t.id} className="hover:bg-subtle">
                  <td className="border-b border-line px-5 py-3 font-medium">{t.topic}</td>
                  <td className="border-b border-line px-3 py-3">{status(t)}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{formatDate(t.discussionDate)}</td>
                  <td className="border-b border-line px-3 py-3 text-muted">{t.minutes} min</td>
                  <td className="border-b border-line px-5 py-2">
                    <div className="flex items-center justify-end gap-1">
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
                          Share with team
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
                        className={btn.icon}
                      >
                        <Icon name="download" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </PageBody>
    </>
  );
}

function SummaryList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="px-5 py-4">
      <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span aria-hidden="true" className={`h-2 w-2 ${color}`} />
        {title}
      </h3>
      <ul className="flex flex-col gap-2 text-sm leading-relaxed">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
