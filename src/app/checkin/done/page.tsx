"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { team } from "@/lib/data";

export default function DonePage() {
  const { contact } = useStore();
  const href =
    contact.channel === "email"
      ? `mailto:${contact.value}`
      : contact.channel === "phone"
        ? `tel:${contact.value.replace(/[^\d+]/g, "")}`
        : contact.value;
  const label =
    contact.channel === "email"
      ? `Email ${team.manager.split(" ")[0]}`
      : contact.channel === "phone"
        ? `Call or text ${team.manager.split(" ")[0]}`
        : contact.channel === "slack"
          ? `Message ${team.manager.split(" ")[0]} on Slack`
          : `Contact ${team.manager.split(" ")[0]}`;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md flex-col justify-center gap-5 px-4 py-6">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#2F5BEA" strokeWidth="2" />
          <path d="M12 20l6 6 10-12" fill="none" stroke="#2F5BEA" strokeWidth="2.5" />
        </svg>
        <h1 className="text-2xl font-bold">Thanks, you&apos;re done for today</h1>
        <p className="text-sm text-muted">Sent to Product Design and Launch squad</p>
      </div>

      <section className="flex flex-col gap-2.5 rounded-xl border border-line p-4">
        <h2 className="text-base font-bold">Need to talk with a manager?</h2>
        <p className="text-sm leading-relaxed text-muted">
          This steps outside anonymity: your manager will know it&apos;s you.
        </p>
        <a
          href={href}
          target={contact.channel === "email" || contact.channel === "phone" ? undefined : "_blank"}
          rel="noreferrer"
          className="flex min-h-12 items-center justify-center rounded-xl border border-brand px-4 font-semibold text-brand-ink no-underline hover:bg-brand-soft"
        >
          {label} ({team.name})
        </a>
      </section>

      <Link href="/trainings/" className="text-center">
        See past trainings →
      </Link>
    </main>
  );
}
