"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btn = {
  primary: `${base} bg-brand text-white hover:bg-brand-ink`,
  secondary: `${base} border border-line bg-white text-ink hover:border-brand`,
  outline: `${base} border border-brand bg-white text-brand-ink hover:bg-brand-soft`,
  ghost: `inline-flex min-h-11 items-center px-2 text-sm text-brand hover:text-brand-ink`,
};

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

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-xl border border-line bg-white p-5 ${className}`}>{children}</section>;
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink">
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
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
      className="m-auto mb-0 w-full max-w-lg rounded-t-2xl border-0 bg-white p-0 text-ink backdrop:bg-black/50 sm:mb-auto sm:rounded-2xl"
    >
      <div className="flex flex-col gap-3 p-5 pb-7">
        <h2 id="modal-title" className="text-lg font-bold">
          {title}
        </h2>
        {children}
      </div>
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

export function PrototypeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-subtle px-3 py-2 text-xs text-muted">
      {children}
    </div>
  );
}
