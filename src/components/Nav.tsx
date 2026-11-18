"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const managerLinks = [
  { href: "/manager/", label: "Dashboard" },
  { href: "/manager/training/new/", label: "New training" },
  { href: "/manager/growth/", label: "Team growth" },
  { href: "/manager/settings/", label: "Team settings" },
];

const memberLinks = [
  { href: "/checkin/", label: "Check-in" },
  { href: "/trainings/", label: "Trainings" },
];

function isActive(pathname: string, href: string) {
  const p = pathname.endsWith("/") ? pathname : pathname + "/";
  if (href === "/manager/") return p === "/manager/";
  if (href === "/checkin/") return p.startsWith("/checkin/");
  if (href === "/manager/training/new/") return p.startsWith("/manager/training/");
  return p.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname() || "/";
  const role = pathname.startsWith("/manager") ? "manager" : pathname === "/" ? null : "member";
  const links = role === "manager" ? managerLinks : role === "member" ? memberLinks : [];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-subtle">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/" className="text-xl font-bold text-ink no-underline">
            SamePage
          </Link>
          <nav aria-label="Main" className="hidden flex-1 flex-wrap gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={
                  "flex min-h-11 items-center rounded-lg px-3 text-sm no-underline " +
                  (isActive(pathname, l.href) ? "bg-brand-soft font-semibold text-brand-ink" : "text-ink hover:bg-white")
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {role && (
              <span className="hidden text-sm text-muted sm:inline">
                {role === "manager" ? "Jordan Lee · Manager" : "Sam Ortiz · Member"}
              </span>
            )}
            <RoleSwitch role={role} />
          </div>
        </div>
      </header>
      {links.length > 0 && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 flex h-[72px] border-t border-line bg-white md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(pathname, l.href) ? "page" : undefined}
              className={
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs no-underline " +
                (isActive(pathname, l.href) ? "font-semibold text-brand-ink" : "text-muted")
              }
            >
              <span
                aria-hidden="true"
                className={"h-[22px] w-[22px] rounded-md " + (isActive(pathname, l.href) ? "bg-brand" : "bg-line-strong")}
              />
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

function RoleSwitch({ role }: { role: "manager" | "member" | null }) {
  if (!role) return null;
  return (
    <Link
      href={role === "manager" ? "/checkin/" : "/manager/"}
      className="flex min-h-11 items-center rounded-lg border border-line bg-white px-3 text-sm text-ink no-underline hover:border-brand"
    >
      {role === "manager" ? "View as member" : "View as manager"}
    </Link>
  );
}
