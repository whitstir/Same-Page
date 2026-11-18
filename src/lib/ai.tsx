"use client";

// Calls the SamePage AI function (a Supabase Edge Function that holds the
// Claude API key). Every request carries the app passcode; the first time an
// AI step runs, a dialog asks for it and the browser remembers it.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { btn, inputCls, Modal } from "@/components/ui";
import type { Slide } from "./data";

export const AI_URL =
  process.env.NEXT_PUBLIC_AI_URL ?? "https://rpiwqnrqywqoiluimtwk.supabase.co/functions/v1/ai";

const PASSCODE_KEY = "samepage-ai-passcode";

// ---------- job types (match supabase/functions/ai/index.ts) ----------

export type CheckInAnalysis = {
  memberSummary: string;
  themes: string[];
  sentiment: "positive" | "mixed" | "negative" | "neutral";
  wins: string[];
  friction: string[];
  issues: string[];
  trainingNeeds: string[];
};

type AiSlide = Omit<Slide, "prompt"> & { prompt: string };

type Jobs = {
  analyze: {
    input: {
      answers: { wentWell: string; couldBeBetter: string; issues: string; improvementNote: string; anythingElse: string };
      improvement: number;
      goals: string[];
      names: string[];
    };
    output: CheckInAnalysis;
  };
  topics: { input: { summary: unknown; goals: unknown }; output: { topics: { title: string; why: string }[] } };
  subtopics: {
    input: { topic: string; minutes: number; contents: string[]; summary: unknown };
    output: { subtopics: { title: string; minutes: number }[] };
  };
  deck: {
    input: { topic: string; minutes: number; contents: string[]; subtopics: { title: string; minutes: number }[]; summary: unknown };
    output: { slides: AiSlide[]; videoNote: string };
  };
  revise: {
    input: { topic: string; outline: string[]; index: number; slide: Slide; request: string };
    output: { summary: string; slide: AiSlide };
  };
};

export type Job = keyof Jobs;

/** Turns the AI's "" for "no prompt" back into the app's undefined. */
export function toSlide(s: AiSlide): Slide {
  return {
    ...s,
    prompt: s.prompt?.trim() ? s.prompt : undefined,
    videoTitle: s.videoTitle || undefined,
    videoUrl: s.videoUrl || undefined,
    minutes: Math.max(1, Math.round(s.minutes || 1)),
  };
}

export class AiCancelled extends Error {
  constructor() {
    super("The AI needs the app passcode.");
  }
}

// ---------- passcode storage ----------

function readPasscode(): string {
  try {
    return window.localStorage.getItem(PASSCODE_KEY) ?? "";
  } catch {
    return "";
  }
}
function writePasscode(v: string) {
  try {
    if (v) window.localStorage.setItem(PASSCODE_KEY, v);
    else window.localStorage.removeItem(PASSCODE_KEY);
  } catch {
    // storage unavailable: the passcode lasts for this page only
  }
}

// ---------- provider ----------

type Ai = {
  run: <J extends Job>(job: J, input: Jobs[J]["input"]) => Promise<Jobs[J]["output"]>;
  hasPasscode: () => boolean;
  askPasscode: () => Promise<string>;
  forgetPasscode: () => void;
};

const Ctx = createContext<Ai | null>(null);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const memory = useRef<string>("");
  const pending = useRef<{ resolve: (v: string) => void; reject: (e: Error) => void } | null>(null);
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [value, setValue] = useState("");

  const current = () => memory.current || readPasscode();

  const askPasscode = useCallback((wasWrong = false) => {
    pending.current?.reject(new AiCancelled());
    setWrong(wasWrong);
    setValue("");
    shouldBeOpen.current = true;
    setOpen(true);
    return new Promise<string>((resolve, reject) => {
      pending.current = { resolve, reject };
    });
  }, []);

  // The dialog's "close" event can arrive late, after the dialog has been
  // reopened for a wrong passcode. Only treat it as the user cancelling
  // (Escape) when the prompt should be open but the dialog is really closed.
  const shouldBeOpen = useRef(false);
  const onDialogClose = (e?: React.SyntheticEvent<HTMLDialogElement>) => {
    if (shouldBeOpen.current && e && !e.currentTarget.open) finish(null);
  };

  const finish = (code: string | null) => {
    const p = pending.current;
    pending.current = null;
    shouldBeOpen.current = false;
    setOpen(false);
    if (code) {
      memory.current = code;
      writePasscode(code);
      p?.resolve(code);
    } else {
      p?.reject(new AiCancelled());
    }
  };

  const forgetPasscode = useCallback(() => {
    memory.current = "";
    writePasscode("");
  }, []);

  const run = useCallback(
    async <J extends Job>(job: J, input: Jobs[J]["input"]): Promise<Jobs[J]["output"]> => {
      let passcode = current() || (await askPasscode());
      for (let attempt = 0; attempt < 3; attempt++) {
        let res: Response;
        try {
          res = await fetch(AI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-passcode": passcode },
            body: JSON.stringify({ job, input }),
          });
        } catch {
          throw new Error("Couldn't reach the AI. Check your connection and try again.");
        }
        if (res.status === 401) {
          forgetPasscode();
          passcode = await askPasscode(true);
          continue;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `The AI request failed (${res.status}).`);
        return data as Jobs[J]["output"];
      }
      throw new AiCancelled();
    },
    [askPasscode, forgetPasscode],
  );

  const ai: Ai = useMemo(
    () => ({
      run,
      hasPasscode: () => !!(memory.current || readPasscode()),
      askPasscode: () => askPasscode(false),
      forgetPasscode,
    }),
    [run, askPasscode, forgetPasscode],
  );

  return (
    <Ctx.Provider value={ai}>
      {children}
      <Modal open={open} onClose={onDialogClose} title="Enter the app passcode">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) finish(value.trim());
          }}
        >
          <p className="text-sm leading-relaxed text-muted">
            The AI steps in this prototype need a passcode so strangers can&apos;t use up our AI credits. Ask your team
            for it. This browser will remember it.
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Passcode
            <input
              type="password"
              autoFocus
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={wrong}
              aria-describedby={wrong ? "passcode-error" : undefined}
              className={inputCls + " font-normal"}
            />
          </label>
          {wrong && (
            <p id="passcode-error" role="alert" className="text-sm font-semibold text-[#b42318]">
              That passcode didn&apos;t work. Try again.
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className={`${btn.secondary} flex-1`} onClick={() => finish(null)}>
              Cancel
            </button>
            <button type="submit" className={`${btn.primary} flex-1`} disabled={!value.trim()}>
              Continue
            </button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  );
}

export function useAI() {
  const ai = useContext(Ctx);
  if (!ai) throw new Error("useAI must be used inside AiProvider");
  return ai;
}

/** A readable message for an error from `run`. */
export function aiErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}
