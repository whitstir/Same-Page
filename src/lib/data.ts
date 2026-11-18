// Sample data for the prototype. There is no database, so the team, its
// goals, the team summary and past trainings are fixed sample data. The AI
// steps call Claude through src/lib/ai.tsx; the templates below are only
// used as a fallback when the AI can't be reached.

export type Goal = {
  id: string;
  kind: "goal" | "core value";
  title: string;
  description: string;
  archived?: boolean;
  history: number[]; // weekly team average, oldest first
};

export type Member = { id: string; name: string; status: "joined" | "invite pending" };

export type ContactChannel = "email" | "phone" | "slack" | "link";

export type Slide = {
  kind: "intro" | "idea" | "discussion" | "scenario" | "activity" | "video" | "wrap-up";
  title: string;
  bullets: string[];
  prompt?: string;
  videoTitle?: string;
  videoUrl?: string;
  notes: string;
  minutes: number;
};

export type TrainingStatus = "draft" | "published" | "completed";

export type Training = {
  id: string;
  topic: string;
  minutes: number;
  status: TrainingStatus;
  discussionDate?: string; // yyyy-mm-dd
  sharedWithTeam: boolean; // manager approved sharing the slides after the discussion
  slides: Slide[];
};

export const team = { name: "Product Design", manager: "Jordan Lee", size: 9 };

export const weekLabels = ["Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2", "Nov 9", "Nov 16"];

export const initialGoals: Goal[] = [
  { id: "g1", kind: "goal", title: "Ship the Q1 launch", description: "Design handed off for every launch screen by Feb 1", history: [3.0, 3.1, 3.3, 3.2, 3.4, 3.5, 3.5, 3.6] },
  { id: "g2", kind: "core value", title: "Communicate openly", description: "Say what you think, early and kindly", history: [3.4, 3.3, 3.1, 3.0, 2.9, 3.0, 3.1, 3.1] },
  { id: "g3", kind: "core value", title: "Give useful feedback", description: "About the work, specific, and actionable", history: [3.2, 3.0, 2.6, 2.4, 2.5, 2.7, 2.8, 2.8] },
  { id: "g4", kind: "core value", title: "Own our work", description: "Follow through on what we commit to", history: [4.0, 4.1, 4.0, 4.2, 4.1, 4.2, 4.3, 4.2] },
];

export const initialMembers: Member[] = [
  { id: "m1", name: "Alex Kim", status: "joined" },
  { id: "m2", name: "Priya Shah", status: "joined" },
  { id: "m3", name: "Sam Ortiz", status: "joined" },
  { id: "m4", name: "Dana Wright", status: "joined" },
  { id: "m5", name: "Chris Park", status: "joined" },
  { id: "m6", name: "Morgan Lee", status: "joined" },
  { id: "m7", name: "Taylor Reed", status: "joined" },
  { id: "m8", name: "Jamie Fox", status: "joined" },
  { id: "m9", name: "riley@example.com", status: "invite pending" },
];

export const teamSummary = {
  wins: ["Design reviews felt faster and more focused", "People felt supported during the launch push"],
  friction: ["Handoffs to engineering are unclear", "Feedback in meetings sometimes feels personal"],
  issues: ["Several people mentioned workload in the last two weeks of the quarter"],
  topNeed: "giving and receiving feedback",
};

export const topicSuggestions = [
  { title: "Giving feedback that lands", why: "feedback in meetings came up as feeling personal several times this week" },
  { title: "Clean handoffs to engineering", why: "unclear handoffs are the most repeated friction point" },
  { title: "Protecting focus time at quarter end", why: "workload was raised as an issue in the last two weeks" },
  { title: "Living our value: Communicate openly", why: "this value has the lowest weekly rating trend" },
];

export const contentOptions = [
  { id: "intro", label: "Intro / pre-reading slide" },
  { id: "idea", label: "Key-idea slides" },
  { id: "discussion", label: "Discussion questions" },
  { id: "activity", label: "Group activity" },
  { id: "scenario", label: "Short scenario to discuss" },
  { id: "video", label: "YouTube video links" },
  { id: "wrap-up", label: "Wrap-up with takeaways" },
] as const;

export type ContentId = (typeof contentOptions)[number]["id"];

export function suggestSubtopics(topic: string, minutes: number) {
  const parts = [
    `Why "${topic.toLowerCase()}" matters for us`,
    "What good looks like",
    "Scenario from a week like ours",
    "Takeaways and one thing to try this week",
  ];
  const each = Math.max(1, Math.round(minutes / parts.length));
  return parts.map((title, i) => ({
    title,
    minutes: i === parts.length - 1 ? Math.max(1, minutes - each * (parts.length - 1)) : each,
  }));
}

// Stand-in for the training-generation call.
export function generateDeck(
  topic: string,
  minutes: number,
  contents: ContentId[],
  subtopics: { title: string; minutes: number }[],
): Slide[] {
  const has = (c: ContentId) => contents.includes(c);
  const slides: Slide[] = [];
  if (has("intro"))
    slides.push({
      kind: "intro",
      title: topic,
      bullets: ["Why we're talking about this", `About ${minutes} minutes`, "No wrong answers"],
      notes: "Welcome everyone. Explain that the topic came from the team's anonymous check-ins, not from any one person.",
      minutes: 1,
    });
  for (const s of subtopics) {
    const isScenario = /scenario/i.test(s.title);
    if (isScenario && !has("scenario")) continue;
    if (!isScenario && !has("idea") && !/takeaway/i.test(s.title)) continue;
    if (/takeaway/i.test(s.title)) continue; // added as wrap-up below
    slides.push({
      kind: isScenario ? "scenario" : "idea",
      title: s.title,
      bullets: isScenario
        ? ["A teammate shares a draft the day before a deadline", 'Someone replies, "This just doesn\'t work"', "The room goes quiet"]
        : ["One idea per slide, in plain words", "An example from work like ours", "What to try instead"],
      prompt: has("discussion") ? (isScenario ? "How could that same point be made about the work?" : "Where have you seen this go well?") : undefined,
      notes: `Spend about ${s.minutes} min here. Ask for one or two examples before moving on.`,
      minutes: s.minutes,
    });
  }
  if (has("activity"))
    slides.push({
      kind: "activity",
      title: "Try it in pairs",
      bullets: ["Pick a real piece of recent work", "Give one piece of feedback about the work", "Swap roles"],
      notes: "Two minutes per person. Walk around and listen; don't correct.",
      minutes: 3,
    });
  if (has("video"))
    slides.push({
      kind: "video",
      title: "Watch: a short talk on this topic",
      bullets: ["About 4 minutes"],
      videoTitle: "[A checked YouTube video picked by AI]",
      notes: "Play the video, then ask what stood out.",
      minutes: 4,
    });
  if (has("wrap-up"))
    slides.push({
      kind: "wrap-up",
      title: "Takeaways",
      bullets: ["Describe the work, not the person", "Be specific", "Pick one thing to try this week"],
      prompt: "What's one thing you'll try before our next check-in?",
      notes: "Go around the room for one-line answers. Thank everyone.",
      minutes: 2,
    });
  return slides;
}

const sampleDeck = (topic: string) =>
  generateDeck(topic, 10, ["intro", "idea", "discussion", "scenario", "wrap-up"], suggestSubtopics(topic, 10));

export const initialTrainings: Training[] = [
  { id: "t1", topic: "Clean handoffs to engineering", minutes: 10, status: "completed", discussionDate: "2026-11-05", sharedWithTeam: true, slides: sampleDeck("Clean handoffs to engineering") },
  { id: "t2", topic: "Running better design reviews", minutes: 10, status: "completed", discussionDate: "2026-11-12", sharedWithTeam: false, slides: sampleDeck("Running better design reviews") },
  { id: "t3", topic: "Planning the launch week", minutes: 15, status: "published", discussionDate: "2026-11-26", sharedWithTeam: false, slides: sampleDeck("Planning the launch week") },
];

export function formatDate(iso?: string) {
  if (!iso) return "Not set";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
