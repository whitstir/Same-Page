"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
export const btn = {
  primary: `${base} bg-brand text-white shadow-[0_1px_0_rgba(0,0,0,0.08)] hover:bg-brand-ink hover:text-white`,
  secondary: `${base} border border-line-strong bg-surface text-ink hover:bg-subtle hover:text-ink`,
  outline: `${base} border border-brand bg-surface text-brand-ink hover:bg-brand-wash`,
  ghost: `inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand hover:bg-brand-wash hover:text-brand-ink disabled:opacity-40 disabled:hover:bg-transparent`,
  icon: `inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent`,
};

export const inputCls =
  "min-h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-[#6b7884] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof btn;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${btn[variant]} ${className}`}>
      {children}
    </Link>
  );
}

// White band under the nav that holds the page title and its main actions.
export function PageHeader({
  title,
  meta,
  back,
  actions,
  narrow,
}: {
  title: string;
  meta?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <div className={`mx-auto flex flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6 ${narrow ? "max-w-3xl" : "max-w-7xl"}`}>
        <div className="flex min-w-0 flex-col gap-1">
          {back && (
            <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted no-underline hover:text-ink">
              <Icon name="chevronLeft" size={16} />
              {back.label}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {meta && <div className="text-sm text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ children, narrow, className = "" }: { children: React.ReactNode; narrow?: boolean; className?: string }) {
  return (
    <main className={`mx-auto flex flex-col gap-5 px-4 py-6 sm:px-6 ${narrow ? "max-w-3xl" : "max-w-7xl"} ${className}`}>
      {children}
    </main>
  );
}

// A raised white surface on the gray canvas. Optional header row with a
// title and actions, separated from the body by a rule.
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`relative min-w-0 rounded-md border border-line bg-surface shadow-[0_1px_2px_rgba(16,38,47,0.06)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
            {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, detail, icon }: { label: string; value: React.ReactNode; detail?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 py-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
        {icon && <Icon name={icon} size={16} />}
        {label}
      </div>
      <div className="text-[28px] font-semibold leading-tight tracking-tight">{value}</div>
      {detail && <div className="text-[13px] text-muted">{detail}</div>}
    </div>
  );
}

const tones = {
  neutral: "bg-subtle text-ink border-line",
  brand: "bg-brand-soft text-brand-ink border-transparent",
  good: "bg-good-soft text-good border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  info: "bg-info-soft text-info border-transparent",
};
export function Tag({ tone = "neutral", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className={`m-auto mb-0 w-full rounded-t-md border-0 bg-surface p-0 text-ink shadow-2xl backdrop:bg-[#10262f]/60 sm:mb-auto sm:rounded-md ${wide ? "max-w-3xl" : "max-w-lg"}`}
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 id="modal-title" className="text-base font-semibold">
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className={btn.icon}>
          <Icon name="close" />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </dialog>
  );
}

// A minutes field that can be cleared while typing (so typing "2" over "1"
// gives 2, not 12). It only clamps to the allowed range when you leave it.
export function MinutesInput({
  value,
  onChange,
  min = 1,
  max = 60,
  className = "",
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max">) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={focused ? text : String(value)}
      onFocus={(e) => {
        setText(String(value));
        setFocused(true);
        e.currentTarget.select();
      }}
      onChange={(e) => {
        const t = e.target.value.replace(/\D/g, "").slice(0, 3);
        setText(t);
        const n = Number(t);
        if (t !== "" && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        setFocused(false);
        const n = Number(text);
        onChange(text === "" || Number.isNaN(n) ? value : Math.min(max, Math.max(min, n)));
      }}
      className={className}
    />
  );
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
      {children}
    </label>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="inline-flex flex-none items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-ink"
    >
      {initials}
    </span>
  );
}
