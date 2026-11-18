"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ContactChannel, Goal } from "@/lib/data";
import { Avatar, btn, inputCls, PageBody, PageHeader, Panel, Tag } from "@/components/ui";
import { Icon } from "@/components/Icon";

const channels: { id: ContactChannel; label: string; field: string; type: string }[] = [
  { id: "email", label: "Email", field: "Email address", type: "email" },
  { id: "phone", label: "Phone", field: "Phone number (call or text)", type: "tel" },
  { id: "slack", label: "Slack", field: "Slack link", type: "url" },
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
    <>
      <PageHeader title="Team settings" meta="Product Design" />
      <PageBody>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <Panel
              title="Goals and core values"
              subtitle="Members rate each one in their weekly check-in"
              actions={
                <>
                  <button type="button" onClick={() => addGoal("goal")} className={btn.ghost}>
                    <Icon name="plus" size={16} />
                    Goal
                  </button>
                  <button type="button" onClick={() => addGoal("core value")} className={btn.ghost}>
                    <Icon name="plus" size={16} />
                    Core value
                  </button>
                </>
              }
              bodyClassName="divide-y divide-line"
            >
              {goals.map((g) => (
                <div key={g.id} className={"flex flex-wrap items-center gap-3 px-5 py-3 " + (g.archived ? "bg-subtle" : "")}>
                  <span className="w-20 flex-none">
                    <Tag tone={g.kind === "goal" ? "info" : "brand"}>{g.kind === "goal" ? "Goal" : "Value"}</Tag>
                  </span>
                  {editing === g.id ? (
                    <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2">
                      <input aria-label="Title" autoFocus value={g.title} onChange={(e) => setGoal(g.id, { title: e.target.value })} className={inputCls + " font-medium"} />
                      <input
                        aria-label="Description"
                        value={g.description}
                        placeholder="Description"
                        onChange={(e) => setGoal(g.id, { description: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <div className="min-w-0 flex-[1_1_240px] text-sm">
                      <div className={"font-medium " + (g.archived ? "text-muted" : "")}>
                        {g.title}
                        {g.archived && <span className="ml-2 text-xs font-normal">Archived</span>}
                      </div>
                      <div className="text-muted">{g.description}</div>
                    </div>
                  )}
                  <div className="flex">
                    <button type="button" className={btn.ghost} onClick={() => setEditing(editing === g.id ? null : g.id)}>
                      {editing === g.id ? "Done" : "Edit"}
                    </button>
                    <button type="button" className={btn.ghost + " text-muted hover:text-ink"} onClick={() => setGoal(g.id, { archived: !g.archived })}>
                      {g.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title={`Members · ${members.length}`} subtitle="Check-in status is never shown per person" bodyClassName="">
              <div className="flex flex-wrap items-end gap-2 border-b border-line bg-subtle px-5 py-4">
                <label className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5 text-[13px] font-medium">
                  Invite by email
                  <input
                    type="text"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && invite()}
                    placeholder="name@company.com, another@company.com"
                    className={inputCls + " font-normal"}
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
                  {copied ? "Link copied" : "Copy invite link"}
                </button>
              </div>
              <ul className="divide-y divide-line">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-2 text-sm">
                    <Avatar name={m.name} />
                    <span className="flex-1 font-medium">{m.name}</span>
                    {m.status === "invite pending" ? <Tag tone="warn">Invite pending</Tag> : <Tag>Member</Tag>}
                    <button
                      type="button"
                      aria-label={`Remove ${m.name}`}
                      title="Remove"
                      className={btn.icon}
                      onClick={() => update((s) => ({ ...s, members: s.members.filter((x) => x.id !== m.id) }))}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Contact a manager" subtitle="Where the button after each check-in sends members" bodyClassName="flex flex-col gap-4 p-5">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium">Channel</legend>
              <div className="grid grid-cols-2 overflow-hidden rounded-md border border-line-strong sm:grid-cols-4 lg:grid-cols-2">
                {channels.map((c) => (
                  <label
                    key={c.id}
                    className={
                      "flex min-h-10 cursor-pointer items-center justify-center gap-2 border-line px-3 text-sm font-medium [&:not(:last-child)]:border-r " +
                      (contact.channel === c.id ? "bg-brand text-white" : "bg-surface text-ink hover:bg-subtle")
                    }
                  >
                    <input
                      type="radio"
                      name="channel"
                      className="sr-only"
                      checked={contact.channel === c.id}
                      onChange={() => update((s) => ({ ...s, contact: { channel: c.id, value: "" } }))}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium">
              {ch.field}
              <input
                type={ch.type}
                value={contact.value}
                onChange={(e) => update((s) => ({ ...s, contact: { ...s.contact, value: e.target.value } }))}
                className={inputCls + " font-normal"}
              />
            </label>
            <p className="flex gap-2 border-t border-line pt-4 text-[13px] text-muted">
              <Icon name="eye" size={16} className="mt-0.5" />
              Members are told that using this button shares who they are with you.
            </p>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
