"use client";

// Prototype state. There is no backend yet: everything lives in the browser
// (React state, mirrored to localStorage so a page refresh keeps your place).
// There is no database; the AI calls go through src/lib/ai.tsx.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  initialGoals,
  initialMembers,
  initialTrainings,
  type ContactChannel,
  type Goal,
  type Member,
  type Slide,
  type Training,
} from "./data";
import type { CheckInAnalysis } from "./ai";

export type CheckIn = {
  wentWell: string;
  couldBeBetter: string;
  issues: string;
  improvement: number;
  improvementNote: string;
  ratings: Record<string, number>; // goal id -> 1..5
  anythingElse: string;
};

export const emptyCheckIn: CheckIn = {
  wentWell: "",
  couldBeBetter: "",
  issues: "",
  improvement: 0,
  improvementNote: "",
  ratings: {},
  anythingElse: "",
};

type State = {
  goals: Goal[];
  members: Member[];
  trainings: Training[];
  contact: { channel: ContactChannel; value: string };
  checkIn: CheckIn;
  weekly: boolean; // first check-in of the week shows the weekly questions
  submittedToday: boolean;
  checkInsToday: number; // team count shown to the manager
  // AI summaries of this browser's own check-ins. The raw answers are never
  // kept after submitting.
  myCheckIns: { date: string; analysis: CheckInAnalysis }[];
};

const initialState: State = {
  goals: initialGoals,
  members: initialMembers,
  trainings: initialTrainings,
  contact: { channel: "email", value: "jordan@example.com" },
  checkIn: emptyCheckIn,
  weekly: true,
  submittedToday: false,
  checkInsToday: 5,
  myCheckIns: [],
};

const KEY = "samepage-prototype-v1";

type Store = State & {
  update: (fn: (s: State) => State) => void;
  updateTraining: (id: string, fn: (t: Training) => Training) => void;
  updateSlide: (trainingId: string, index: number, patch: Partial<Slide>) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      // storage unavailable: start fresh
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, loaded]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);
  const updateTraining = useCallback(
    (id: string, fn: (t: Training) => Training) =>
      setState((s) => ({ ...s, trainings: s.trainings.map((t) => (t.id === id ? fn(t) : t)) })),
    [],
  );
  const updateSlide = useCallback(
    (trainingId: string, index: number, patch: Partial<Slide>) =>
      updateTraining(trainingId, (t) => ({
        ...t,
        slides: t.slides.map((sl, i) => (i === index ? { ...sl, ...patch } : sl)),
      })),
    [updateTraining],
  );
  const reset = useCallback(() => setState(initialState), []);

  return (
    <Ctx.Provider value={{ ...state, update, updateTraining, updateSlide, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
