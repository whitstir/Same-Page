import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

const options: { href: string; title: string; detail: string; icon: IconName }[] = [
  {
    href: "/checkin/",
    title: "Team member",
    detail: "Daily check-in, your summary, and past team trainings",
    icon: "checkCircle",
  },
  {
    href: "/manager/",
    title: "Manager",
    detail: "Team summary, trainings, growth and team settings",
    icon: "chart",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold tracking-tight">Welcome to SamePage</h1>
        <p className="text-muted">Anonymous daily check-ins that turn into short team discussions.</p>
      </div>
      <div className="rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(16,38,47,0.06)]">
        <div className="border-b border-line px-5 py-3 text-[13px] font-medium text-muted">Continue as</div>
        <ul className="divide-y divide-line">
          {options.map((o) => (
            <li key={o.href}>
              <Link href={o.href} className="flex items-center gap-4 px-5 py-4 text-ink no-underline hover:bg-subtle hover:text-ink">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-brand-soft text-brand-ink">
                  <Icon name={o.icon} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{o.title}</span>
                  <span className="text-[13px] text-muted">{o.detail}</span>
                </span>
                <Icon name="chevronRight" className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
