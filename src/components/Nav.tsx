"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, type IconName } from "./Icon";

type NavLink = { href: string; label: string; icon: IconName };

const managerLinks: NavLink[] = [
  { href: "/manager/", label: "Overview", icon: "home" },
  { href: "/manager/training/new/", label: "Trainings", icon: "slides" },
  { href: "/manager/growth/", label: "Growth", icon: "chart" },
  { href: "/manager/settings/", label: "Team", icon: "users" },
];

const memberLinks: NavLink[] = [
  { href: "/checkin/", label: "Check-in", icon: "checkCircle" },
  { href: "/trainings/", label: "Trainings", icon: "slides" },
];

function isActive(pathname: string, href: string) {
  const p = pathname.endsWith("/") ? pathname : pathname + "/";
  if (href === "/manager/") return p === "/manager/";
  if (href === "/checkin/") return p.startsWith("/checkin/");
  if (href === "/manager/training/new/") return p.startsWith("/manager/training/");
  return p.startsWith(href);
}

export function Mark() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26">
      <rect x="2" y="6" width="14" height="14" fill="#6cc3bb" />
      <rect x="10" y="2" width="14" height="14" fill="none" stroke="#eaf1f3" strokeWidth="2" />
    </svg>
  );
}

export function TopNav() {
  const pathname = usePathname() || "/";
  const role = pathname.startsWith("/manager") ? "manager" : pathname === "/" ? null : "member";
  const links = role === "manager" ? managerLinks : role === "member" ? memberLinks : [];

  return (
    <>
      <header className="sticky top-0 z-30 bg-nav text-nav-text">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href={role === "member" ? "/checkin/" : role === "manager" ? "/manager/" : "/"} className="flex items-center gap-2.5 text-nav-text no-underline hover:text-white">
            <Mark />
            <span className="text-[17px] font-semibold tracking-tight">SamePage</span>
          </Link>
          <nav aria-label="Main" className="hidden h-full items-stretch gap-1 md:flex">
            {links.map((l) => {
              const on = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={on ? "page" : undefined}
                  className={
                    "flex items-center border-b-2 px-3 pt-0.5 text-sm font-medium no-underline transition-colors " +
                    (on
                      ? "border-nav-accent text-white hover:text-white"
                      : "border-transparent text-nav-muted hover:text-white")
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {role === "manager" && (
              <span className="hidden items-center gap-2 rounded-md bg-nav-raised px-3 py-1.5 text-sm lg:flex">
                <span className="text-nav-muted">Team</span>
                <span className="font-medium">Product Design</span>
              </span>
            )}
            {role && <UserMenu role={role} />}
          </div>
        </div>
      </header>
      {links.length > 0 && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-line bg-surface md:hidden">
          {links.map((l) => {
            const on = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={
                  "relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium no-underline " +
                  (on ? "text-brand-ink" : "text-muted hover:text-ink")
                }
              >
                {on && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 bg-brand" />}
                <Icon name={l.icon} size={22} />
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

function UserMenu({ role }: { role: "manager" | "member" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { reset } = useStore();
  const router = useRouter();
  const name = role === "manager" ? "Jordan Lee" : "Sam Ortiz";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-10 items-center gap-2 rounded-md px-1.5 text-sm hover:bg-nav-raised"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nav-accent text-[13px] font-semibold text-nav">
          {name.split(" ").map((p) => p[0]).join("")}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block font-medium">{name}</span>
          <span className="block text-xs text-nav-muted">{role === "manager" ? "Manager" : "Member"}</span>
        </span>
        <Icon name="chevronDown" size={16} className="text-nav-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-56 rounded-md border border-line bg-surface py-1 text-ink shadow-lg">
          <Link
            role="menuitem"
            href={role === "manager" ? "/checkin/" : "/manager/"}
            onClick={() => setOpen(false)}
            className="flex min-h-10 items-center px-3 text-sm text-ink no-underline hover:bg-subtle hover:text-ink"
          >
            Switch to {role === "manager" ? "member" : "manager"} view
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
              router.push(role === "manager" ? "/manager/" : "/checkin/");
            }}
            className="flex min-h-10 w-full items-center px-3 text-left text-sm hover:bg-subtle"
          >
            Reset demo data
          </button>
        </div>
      )}
    </div>
  );
}
