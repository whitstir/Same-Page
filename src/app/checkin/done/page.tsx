"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { team } from "@/lib/data";
import { Icon } from "@/components/Icon";

export default function DonePage() {
  const { contact } = useStore();
  const first = team.manager.split(" ")[0];
  const href =
    contact.channel === "email"
      ? `mailto:${contact.value}`
      : contact.channel === "phone"
        ? `tel:${contact.value.replace(/[^\d+]/g, "")}`
        : contact.value;
  const label =
    contact.channel === "email"
      ? `Email ${first}`
      : contact.channel === "phone"
        ? `Call or text ${first}`
        : contact.channel === "slack"
          ? `Message ${first} on Slack`
          : `Contact ${first}`;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon name="check" size={28} />
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Thanks, you&apos;re done for today</h1>
        <p className="text-sm text-muted">Sent to Product Design and Launch squad</p>
      </div>

      <section className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(16,38,47,0.06)]">
        <div className="flex flex-col gap-1 border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-semibold">Need to talk with a manager?</h2>
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="eye" size={14} />
            This isn&apos;t anonymous. {first} will know it&apos;s you.
          </p>
        </div>
        <div className="p-4">
          <a
            href={href}
            target={contact.channel === "email" || contact.channel === "phone" ? undefined : "_blank"}
            rel="noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink no-underline hover:bg-subtle hover:text-ink"
          >
            <Icon name="mail" size={16} />
            {label}
          </a>
        </div>
      </section>

      <Link href="/trainings/" className="inline-flex items-center justify-center gap-1 text-sm font-medium no-underline">
        View past trainings
        <Icon name="chevronRight" size={16} />
      </Link>
    </main>
  );
}
