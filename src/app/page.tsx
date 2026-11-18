"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Home() {
  const { reset } = useStore();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold">SamePage</h1>
        <p className="text-lg text-muted">
          Help your team resolve conflict and grow toward its goals with short, AI-designed trainings built from
          anonymous daily check-ins.
        </p>
        <p className="rounded-lg border border-dashed border-line-strong bg-subtle px-3 py-2 text-sm text-muted">
          This is a prototype. It uses sample data saved in your browser. The AI steps are real and need the app passcode from your team.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/checkin/"
          className="flex flex-col gap-2 rounded-xl border border-line p-5 text-ink no-underline hover:border-brand"
        >
          <span className="text-sm text-muted">Try it as</span>
          <span className="text-xl font-bold">A team member</span>
          <span className="text-sm text-muted">Take today&apos;s check-in, review your summary, see past trainings.</span>
        </Link>
        <Link
          href="/manager/"
          className="flex flex-col gap-2 rounded-xl border border-line p-5 text-ink no-underline hover:border-brand"
        >
          <span className="text-sm text-muted">Try it as</span>
          <span className="text-xl font-bold">The manager</span>
          <span className="text-sm text-muted">
            See the anonymous summary, build a training, edit slides, track team growth.
          </span>
        </Link>
      </div>

      <button
        type="button"
        onClick={reset}
        className="self-start text-sm text-muted underline hover:text-ink"
      >
        Reset the prototype&apos;s sample data
      </button>
    </main>
  );
}
