"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ContactChannel, Goal } from "@/lib/data";
import { btn, Card, Pill } from "@/components/ui";

const channels: { id: ContactChannel; label: string; field: string; type: string }[] = [
  { id: "email", label: "Email", field: "Email address", type: "email" },
  { id: "phone", label: "Phone (call or text)", field: "Phone number", type: "tel" },
  { id: "slack", label: "Slack link", field: "Slack link", type: "url" },
  { id: "link", label: "Other link", field: "Link", type: "url" },
];

export default function SettingsPage() {
  const { goals, members, contact, update } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [emails, setEmails] = useState("");
  const [copied, setCopied] = useState(false);

  const setGoal = (id: string, patch: Partial<Goal>) =>
    update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const addGoal = (kind: Goal["kind"]) => {
    const id = `g${Date.now()}`;
    update((s) => ({
      ...s,
      goals: [...s.goals, { id, kind, title: kind === "goal" ? "New goal" : "New core value", description: "", history: [] }],
    }));
    setEditing(id);
  };
  const invite = () => {
    const list = emails.split(/[,\s]+/).map((e) => e.trim()).filter((e) => /.+@.+\..+/.test(e));
    if (!list.length) return;
    update((s) => ({
      ...s,
      members: [...s.members, ...list.map((e, k) => ({ id: `m${Date.now()}${k}`, name: e, status: "invite pending" as const }))],
    }));
    setEmails("");
  };
  const ch = channels.find((c) => c.id === contact.channel)!;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold">Team settings</h1>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Goals and core values</h2>
          <span className="text-sm text-muted">Members rate each one in their weekly questions</span>
        </div>
        {goals.map((g) => (
          <div
            key={g.id}
            className={"flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2.5 " + (g.archived ? "opacity-60" : "")}
          >
            <Pill>{g.kind}</Pill>
            {editing === g.id ? (
              <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1.5">
                <input
                  aria-label="Title"
                  autoFocus
                  value={g.title}
                  onChange={(e) => setGoal(g.id, { title: e.target.value })}
                  className="min-h-11 rounded-md border border-line px-2 font-semibold"
                />
                <input
                  aria-label="Description"
                  value={g.description}
                  placeholder="Description"
                  onChange={(e) => setGoal(g.id, { description: e.target.value })}
                  className="min-h-11 rounded-md border border-line px-2 text-sm"
                />
              </div>
            ) : (
              <span className="min-w-0 flex-[1_1_240px] text-sm">
                <strong>{g.title}</strong>
                {g.archived && " (archived)"}
                <br />
                <span className="text-muted">{g.description}</span>
              </span>
            )}
            <button type="button" className={btn.ghost} onClick={() => setEditing(editing === g.id ? null : g.id)}>
              {editing === g.id ? "Done" : "Edit"}
            </button>
            <button type="button" className="min-h-11 px-2 text-sm text-muted hover:text-ink" onClick={() => setGoal(g.id, { archived: !g.archived })}>
              {g.archived ? "Restore" : "Archive"}
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addGoal("goal")} className="min-h-11 rounded-lg border border-dashed border-line-strong px-3.5 text-sm">
            + Add goal
          </button>
          <button type="button" onClick={() => addGoal("core value")} className="min-h-11 rounded-lg border border-dashed border-line-strong px-3.5 text-sm">
            + Add core value
          </button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Members ({members.length})</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5 text-sm">
            Invite by email
            <input
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="name@company.com, another@company.com"
              className="min-h-11 rounded-lg border border-line px-3"
            />
          </label>
          <button type="button" className={btn.primary} onClick={invite}>
            Send invites
          </button>
          <button
            type="button"
            className={btn.secondary}
            onClick={() => {
              try {
                navigator.clipboard?.writeText("https://example.com/join/product-design");
              } catch {}
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy invite link"}
          </button>
        </div>
        <ul className="flex flex-col">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-[#eaeef2] py-2 text-sm">
              <span aria-hidden="true" className="h-8 w-8 flex-none rounded-full bg-line" />
              <span className="flex-1">
                {m.name} <span className="text-muted">· {m.status}</span>
              </span>
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-muted hover:text-ink"
                onClick={() => update((s) => ({ ...s, members: s.members.filter((x) => x.id !== m.id) }))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">The members list never shows who has checked in.</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">&quot;Need to talk with a manager?&quot; button</h2>
        <p className="text-sm text-muted">Where members reach you after a check-in. Members are told this is not anonymous.</p>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Contact channel</legend>
          {channels.map((c) => (
            <label
              key={c.id}
              className={
                "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm " +
                (contact.channel === c.id ? "border-2 border-brand bg-brand-wash" : "border border-line")
              }
            >
              <input
                type="radio"
                name="channel"
                checked={contact.channel === c.id}
                onChange={() => update((s) => ({ ...s, contact: { channel: c.id, value: "" } }))}
                className="h-[18px] w-[18px] accent-brand"
              />
              {c.label}
            </label>
          ))}
        </fieldset>
        <label className="flex max-w-md flex-col gap-1.5 text-sm">
          {ch.field}
          <input
            type={ch.type}
            value={contact.value}
            onChange={(e) => update((s) => ({ ...s, contact: { ...s.contact, value: e.target.value } }))}
            className="min-h-11 rounded-lg border border-line px-3"
          />
        </label>
      </Card>
    </main>
  );
}
