// SamePage AI function (Supabase Edge Function, Deno).
//
// The website is static (GitHub Pages), so it can't hold the Claude API key.
// This function holds it as a Supabase secret, checks the app passcode, calls
// Claude, and returns JSON. There is no database: nothing here is stored.
//
// Secrets (set with `npx supabase secrets set ...`):
//   ANTHROPIC_API_KEY  Claude API key
//   APP_PASSCODE       shared passcode testers type into the app
//
// Privacy: never log request bodies. Check-in text is sent to Claude and then
// dropped; only the AI summary goes back to the browser.

import Anthropic from "npm:@anthropic-ai/sdk@1.10.0";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const ALLOWED_ORIGINS = ["https://whitstir.github.io", "http://localhost:3000", "http://127.0.0.1:3000"];

const HAIKU = "claude-haiku-5-5";
const SONNET = "claude-sonnet-5-5";
const OPUS = "claude-opus-5-5";

// On a policy decline, re-run the request on a fallback model the API picks
// (Opus and Sonnet only; Haiku has no server-side fallback).
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as const;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------- shared helpers ----------

type Json = Record<string, unknown>;

// deno-lint-ignore no-explicit-any
type AnyMessage = { content: any[]; stop_reason: string | null };

function textOf(msg: AnyMessage): string {
  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text as string)
    .join("");
}

function checkStop(msg: AnyMessage) {
  if (msg.stop_reason === "refusal") throw new HttpError(422, "The AI declined this request. Try rewording it.");
  if (msg.stop_reason === "max_tokens") throw new HttpError(502, "The AI response was cut off. Try again.");
}

// Structured output call: Claude's reply is guaranteed to match `schema`.
async function structured<T>(opts: {
  model: string;
  system: string;
  user: string;
  schema: Json;
  effort: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<T> {
  const params = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 8000,
    system: [{ type: "text" as const, text: opts.system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user" as const, content: opts.user }],
    output_config: { effort: opts.effort, format: { type: "json_schema", schema: opts.schema } },
  };
  let msg: AnyMessage;
  if (opts.model === HAIKU) {
    // deno-lint-ignore no-explicit-any
    msg = (await client.messages.create(params as any)) as AnyMessage;
  } else {
    // Stream so long generations don't hit the SDK's HTTP timeout.
    // deno-lint-ignore no-explicit-any
    msg = (await client.beta.messages.stream({ ...params, ...FALLBACK } as any).finalMessage()) as AnyMessage;
  }
  checkStop(msg);
  try {
    return JSON.parse(textOf(msg)) as T;
  } catch {
    throw new HttpError(502, "The AI returned something unreadable. Try again.");
  }
}

const str = { type: "string" };
const strList = { type: "array", items: str };
const obj = (properties: Json) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

// Remove names, emails and phone numbers before text reaches the AI.
function redact(text: string, names: string[]): string {
  let out = text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[EMAIL]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[PHONE]");
  const parts = new Set<string>();
  for (const n of names) {
    if (n.includes("@")) continue;
    for (const p of n.split(/\s+/)) if (p.length >= 2) parts.add(p);
  }
  for (const p of parts) {
    const safe = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${safe}\\b`, "gi"), "[TEAMMATE]");
  }
  return out;
}

const asString = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");
const asStrings = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 50) : []);

// ---------- jobs ----------

const SLIDE_KINDS = ["intro", "idea", "discussion", "scenario", "activity", "video", "wrap-up"];

const slideSchema = obj({
  kind: { type: "string", enum: SLIDE_KINDS },
  title: str,
  bullets: strList,
  prompt: { type: "string", description: "Discussion question shown on the slide, or empty string for none" },
  notes: { type: "string", description: "Speaker notes: talking points and timing for the manager" },
  minutes: { type: "integer" },
});

type Slide = {
  kind: string;
  title: string;
  bullets: string[];
  prompt: string;
  notes: string;
  minutes: number;
  videoTitle?: string;
  videoUrl?: string;
};

// 1. Per-response analysis of one member's check-in.
async function analyze(input: Json) {
  const a = (input.answers ?? {}) as Json;
  const names = asStrings(input.names);
  const fields: [string, unknown][] = [
    ["What went well today?", a.wentWell],
    ["What could've gone better?", a.couldBeBetter],
    ["Issues that need to be addressed", a.issues],
    ["How they improved since last week (note)", a.improvementNote],
    ["Anything else", a.anythingElse],
  ];
  const written = fields
    .map(([q, v]) => [q, redact(asString(v), names).trim()] as const)
    .filter(([, v]) => v);
  const improvement = typeof input.improvement === "number" && input.improvement > 0 ? input.improvement : null;
  if (!written.length && !improvement) {
    return {
      memberSummary: "You didn't write anything today, so there's nothing to summarize yet.",
      themes: [], sentiment: "neutral", wins: [], friction: [], issues: [], trainingNeeds: [],
    };
  }

  const user = [
    `Team goals and core values: ${asStrings(input.goals).join("; ") || "none set"}`,
    improvement ? `Self-rated improvement since last week: ${improvement} of 5` : "",
    "",
    ...written.map(([q, v]) => `## ${q}\n${v}`),
  ].join("\n");

  return await structured({
    model: HAIKU,
    effort: "low",
    maxTokens: 4000,
    system: `You analyze one anonymous daily check-in from a member of a small workplace team for SamePage, an app that turns check-ins into short team trainings.

Your output is the ONLY copy of this response that will be kept; the raw text is deleted. Capture everything later steps need (themes, goal-related comments, training needs) but nothing that identifies the writer.

Rules:
- Never include names, quotes, or identifying details. Generalize rare specifics ("the Denver client" -> "a client").
- [TEAMMATE], [EMAIL] and [PHONE] are redactions; never try to reconstruct them.
- memberSummary is shown only to the writer: 2 to 3 warm, plain sentences in second person ("You felt..."), reflecting what they said without judging it.
- wins, friction, issues and trainingNeeds are short neutral phrases (under 12 words each). Empty lists are fine.`,
    user,
    schema: obj({
      memberSummary: str,
      themes: strList,
      sentiment: { type: "string", enum: ["positive", "mixed", "negative", "neutral"] },
      wins: strList,
      friction: strList,
      issues: strList,
      trainingNeeds: strList,
    }),
  });
}

// 2. Training topic suggestions from the team summary and goal ratings.
async function topics(input: Json) {
  return await structured({
    model: SONNET,
    effort: "low",
    system: `You suggest training topics for a manager of a small workplace team. Each training is a short discussion the manager leads with slides.

Rank 3 to 5 topics by what the anonymous team data says the team needs most. Titles are short and concrete (under 8 words). "why" is one line, starting lowercase, that points to the evidence (e.g. "feedback in meetings came up as feeling personal several times this week"). Never attribute anything to an individual.`,
    user: `Anonymous team summary:\n${JSON.stringify(input.summary ?? {}, null, 2)}\n\nGoals and core values with recent average ratings (1 to 5, oldest first):\n${JSON.stringify(input.goals ?? [], null, 2)}`,
    schema: obj({ topics: { type: "array", items: obj({ title: str, why: str }) } }),
  });
}

// 3. Subtopic outline that fits the time budget.
async function subtopics(input: Json) {
  const minutes = Number(input.minutes) || 10;
  return await structured({
    model: SONNET,
    effort: "low",
    system: `You outline a short team discussion training. Return 3 to 6 subtopics in teaching order with whole-minute estimates that add up to the total time. Titles are short (under 8 words) and specific to the topic, not generic.`,
    user: `Topic: ${asString(input.topic, 200)}\nTotal time: ${minutes} minutes\nSlide contents the manager chose: ${asStrings(input.contents).join(", ")}\nTeam context: ${JSON.stringify(input.summary ?? {})}`,
    schema: obj({ subtopics: { type: "array", items: obj({ title: str, minutes: { type: "integer" } }) } }),
  });
}

// 4. Full slide deck, plus checked YouTube videos when asked for.
async function deck(input: Json) {
  const topic = asString(input.topic, 200);
  const minutes = Number(input.minutes) || 10;
  const contents = asStrings(input.contents);
  const wantsVideo = contents.includes("video");

  const deckPromise = structured<{ slides: Slide[] }>({
    model: OPUS,
    effort: "medium",
    maxTokens: 16000,
    system: `You write slide decks for short team discussions that a manager presents and leads. The slides carry the discussion; the speaker notes tell the manager what to say, what to ask, and how long to spend.

Rules:
- Only include the slide types the manager chose. Every slide gets speaker notes with talking points and timing.
- Bullets are short (under 12 words), plain, and specific to the topic and team context. 2 to 4 bullets per slide.
- Discussion prompts are open questions. Use an empty string when a slide has none.
- Scenarios are realistic for the team's kind of work and never point at a real person.
- If the manager chose "video", include exactly one slide with kind "video" (title like "Watch: ..."); the app attaches a real, checked YouTube link to it, so don't invent one.
- Slide minutes add up to the total time.`,
    user: `Topic: ${topic}
Total time: ${minutes} minutes
Slide contents to include: ${contents.join(", ")}
Subtopics in order (with minutes): ${JSON.stringify(input.subtopics ?? [])}
Anonymous team context: ${JSON.stringify(input.summary ?? {})}`,
    schema: obj({ slides: { type: "array", items: slideSchema } }),
  });

  const [result, videos] = await Promise.all([deckPromise, wantsVideo ? findVideos(topic) : Promise.resolve([])]);

  // Attach checked videos; drop video slides we couldn't find a real video for.
  let v = 0;
  const slides: Slide[] = [];
  for (const s of result.slides) {
    if (s.kind === "video") {
      const video = videos[v++];
      if (!video) continue;
      slides.push({ ...s, videoTitle: video.title, videoUrl: video.url });
    } else {
      slides.push(s);
    }
  }
  return { slides, videoNote: wantsVideo && !videos.length ? "No suitable video could be checked, so the video slide was left out." : "" };
}

// Search YouTube with Claude's web search tool, then confirm each video still
// exists with YouTube's oEmbed endpoint before it goes on a slide.
async function findVideos(topic: string): Promise<{ url: string; title: string }[]> {
  try {
    // deno-lint-ignore no-explicit-any
    const msg = (await client.beta.messages.stream({
      model: SONNET,
      max_tokens: 4000,
      ...FALLBACK,
      output_config: { effort: "low" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3, allowed_domains: ["youtube.com"] }],
      messages: [{
        role: "user",
        content: `Find 2 or 3 YouTube videos, ideally under 10 minutes, that a manager could play in a workplace team discussion about "${topic}". Prefer well-known speakers or educational channels. Reply with only the video URLs, best first, one per line.`,
      }],
    } as any).finalMessage()) as AnyMessage;

    const ids: string[] = [];
    const add = (url: string) => {
      const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
      if (m && !ids.includes(m[1])) ids.push(m[1]);
    };
    // Claude's picks first, then anything else the search returned.
    for (const u of textOf(msg).match(/https?:\/\/\S+/g) ?? []) add(u);
    for (const b of msg.content) {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) if (r.url) add(r.url);
    }

    const checked: { url: string; title: string }[] = [];
    for (const id of ids.slice(0, 6)) {
      const url = `https://www.youtube.com/watch?v=${id}`;
      const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      if (data?.title) checked.push({ url, title: data.title });
      if (checked.length >= 2) break;
    }
    return checked;
  } catch (e) {
    console.error("findVideos failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

// 5. Side-chat edit or "regenerate" for one slide. Returns a proposal the
// manager accepts or rejects.
async function revise(input: Json) {
  const slide = (input.slide ?? {}) as Slide;
  const { videoTitle, videoUrl, ...editable } = slide;
  const out = await structured<{ summary: string; slide: Slide }>({
    model: SONNET,
    effort: "medium",
    system: `You help a manager edit one slide of a team discussion deck. Apply the manager's request to the slide and return the full revised slide plus a one-line summary of what you changed (under 15 words, starting with a verb). Keep everything the request doesn't ask to change. Keep bullets short and plain. Use an empty string for a missing prompt.`,
    user: `Training topic: ${asString(input.topic, 200)}
Deck outline: ${asStrings(input.outline).map((t, i) => `${i + 1}. ${t}`).join(" | ")}
Slide ${Number(input.index) + 1}:
${JSON.stringify(editable, null, 2)}

Manager's request: ${asString(input.request, 1000)}`,
    schema: obj({ summary: str, slide: slideSchema }),
  });
  return { summary: out.summary, slide: { ...out.slide, videoTitle, videoUrl } };
}

const JOBS: Record<string, (input: Json) => Promise<unknown>> = { analyze, topics, subtopics, deck, revise };

// ---------- HTTP ----------

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "content-type, x-passcode",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Use POST" });

  const passcode = Deno.env.get("APP_PASSCODE");
  if (!passcode || req.headers.get("x-passcode") !== passcode) {
    return reply(401, { error: "bad_passcode" });
  }

  let job = "";
  try {
    const body = await req.json();
    job = String(body?.job ?? "");
    const run = JOBS[job];
    if (!run) return reply(400, { error: `Unknown job "${job}"` });
    return reply(200, await run((body.input ?? {}) as Json));
  } catch (e) {
    if (e instanceof HttpError) return reply(e.status, { error: e.message });
    if (e instanceof Anthropic.APIError) {
      console.error(`job=${job} Claude API error ${e.status}: ${e.message}`);
      const busy = e.status === 429 || e.status === 529;
      return reply(502, { error: busy ? "The AI is busy right now. Try again in a minute." : `AI error (${e.status}). Try again.` });
    }
    console.error(`job=${job} failed:`, e instanceof Error ? e.message : e);
    return reply(500, { error: "Something went wrong. Try again." });
  }
});
