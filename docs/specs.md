# SamePage: Prototype 1 Spec

**Status:** Draft v0.3 (18 Nov 2026). Items marked **[OPEN Qn]** need a decision; the full list is in §10. Decisions made so far are in §0.

## 0. Decisions log

| Topic | Decision |
|---|---|
| Raw survey text | **Never stored.** Only the AI summary of each response is saved. |
| Survey cadence | Daily. The first survey of each week also asks the weekly questions: self-improvement and goal ratings. (18 Nov) |
| Team size / threshold | Teams are typically 5 to 10 people. Managers see summaries only after **3 responses**. |
| "Need to talk with a manager?" | Opens an email by default; the manager can change it to a phone number, Slack, or another channel. |
| Harassment / self-harm handling | Out of scope for Prototype 1; moved to Future Features. |
| Platform | **One responsive web app** built with **Next.js**, used in desktop and mobile browsers. No separate mobile app, so React Native isn't needed. (18 Nov) |
| Database | **None for Prototype 1.** Data stays in each browser (localStorage). Supabase is used only to host the AI Edge Function. (18 Nov) |
| AI hosting | One **Supabase Edge Function** holds the Claude API key and checks a shared **app passcode**; the site stays on GitHub Pages. (18 Nov) |
| Testers | The team and their peers. |
| Training format (Prototype 1) | One format: an AI-generated **PowerPoint (.pptx) for a team discussion**. (18 Nov) |
| Videos | Links to existing YouTube videos. (18 Nov) |
| Managers | **One manager per team.** (18 Nov) |
| Multiple teams | A person can be on several teams. They take the daily survey **once**, and the same response goes to each of their teams. (18 Nov) |
| Team growth | Tracked against the **goals or core values** the manager sets, using members' weekly ratings of how well the team is achieving each one. (18 Nov) |

## 1. Summary

A web app that helps teams resolve conflict and make progress on team goals. Team members fill out a short recurring survey. AI analyzes the responses anonymously, shows the manager what the team needs most, and drafts short, personalized trainings that the manager reviews, edits and approves before the team takes them.

**Design rule:** AI powers the app, but the core experience is *not* a chatbot. AI works behind structured screens (survey analysis, dashboards, topic suggestions, generated training content). The only chat is an optional side panel for revising a training draft.

## 2. Users and roles

| Role | Can do |
|---|---|
| **Manager** (one per team) | Create a team, invite members, set team goals and core values, view anonymous survey summaries, create/edit/approve/assign trainings, view past trainings and team growth |
| **Team member** (can belong to several teams) | Take one daily survey that covers all their teams, see their own post-survey summary, take assigned trainings, contact a manager |
| **Admin** (later) | Manage organizations, billing |

## 3. Core loop

1. Manager creates team, adds members, sets goals and core values.
2. Members complete the daily survey (goal ratings are added on the first survey of each week).
3. AI analyzes each response as it is submitted (themes, sentiment, goal ratings, issues). Only that summary is saved; the raw text is discarded. Summaries roll up into a team summary. The manager sees it only after a minimum number of responses (§7).
4. AI suggests training topics ranked by need; the manager accepts or overrides.
5. Manager picks length, format and content types; AI drafts the training.
6. Manager edits directly or through the side chat, then approves and publishes.
7. The manager leads the discussion with the team using the downloaded PowerPoint. Weekly ratings of goals and core values over time show "team growth".

## 4. Features: Manager

### 4.1 Dashboard
- **Completion count**: "6 of 9 members completed this week's survey". Never shows who.
- **Anonymous summary**: AI-written roll-up of themes, wins, friction points, flagged issues and goal-rating averages. Updates as responses come in, but only once the minimum response threshold is met (§7).
- **Goals and core values**: create, edit and archive the team's goals and core values (e.g. "Ship the Q1 launch", "Communicate openly"). Members rate how well the team is achieving each one in the weekly survey.
- **Team management**: invite members by email or link, remove members.
- **Create training** entry point (§4.2).
- **Past trainings**: list with status (draft, published, completed), completion rates, re-open or duplicate.
- **Team growth**: a chart per goal or core value showing the team's average weekly rating over time (shown only when at least 3 members rated that week), plus a short AI-written note on what changed and which trainings happened around then.

### 4.2 Training creation (wizard, not chat)
1. **Topic**: AI suggests 3 to 5 topics ranked by what the survey data says the team needs most, each with a one-line "why" drawn from the anonymous summary. The manager can pick one, edit one, or write their own.
2. **Length**: manager sets duration; default 5 to 10 minutes.
3. **Format**: Prototype 1 has one format, a **discussion-based PowerPoint**: the manager presents the slides to the team, and the slides carry the discussion. More formats (micro-lesson, scenario practice, self-paced module) can come later.
4. **Slide contents**: the manager chooses what to include (checkboxes): intro/pre-reading slide, key-idea slides, discussion questions, a group activity, a short scenario to discuss, YouTube video links, and a wrap-up with takeaways. Each slide has **speaker notes** with talking points and timing so the manager can lead it.
5. **Subtopics**: AI suggests subtopics that fit the time budget, with estimated minutes each; the manager can reorder, remove, add or edit them.
6. **Generate**: AI produces the training as a structured slide deck (JSON: a list of slides, each with a title, bullet points, discussion prompts, an optional video link and speaker notes). The app turns that into a .pptx file.
   - **Videos**: the AI uses the API's web search tool to find relevant existing YouTube videos. The server checks each link still exists (YouTube oEmbed) before it goes on a slide.
7. **Review**: the deck opens in an in-app slide editor (slide thumbnails plus an editable view of the selected slide).
   - Edit any slide's text, notes or video link directly; add, remove or reorder slides.
   - **Side chat** ("make the scenario about remote work", "shorten section 2"): the AI proposes a change to specific slides; the manager accepts or rejects it, like tracked changes.
   - Regenerate a single slide.
8. **Approve and publish**: the manager downloads the final .pptx to present, and the deck is saved to Past trainings. The manager can schedule the discussion date.

## 5. Features: Team member

### 5.1 Survey
| # | Question | Input |
|---|---|---|
| 1 | What went well today? | Free text |
| 2 | What could've gone better? | Free text |
| 3 | Are there any issues that need to be addressed? | Free text |
| 4 | How do you feel you've improved since last week? *(weekly)* | 1 to 5 scale + optional text |
| 5 | How is the team achieving each goal and core value? *(weekly)* | 1 to 5 per goal or value, grouped by team |
| 6 | Anything else you want to say? (feel free to rant) | Free text |

The survey is **daily**. Questions 4 and 5 are **weekly**: they appear only on each member's first survey of the week.

**Members on several teams** take the survey once a day. Questions 1 to 3 and 6 are asked once, and that one response goes to each of their teams. Question 5 is shown separately for each team, since each team has its own goals and values. Each team's completion count and 3-response threshold are counted separately.

Raw answers are sent to the AI on submit, then discarded. The app saves only the structured AI analysis and the numeric ratings.

### 5.2 After submitting
- A short AI-written summary of *their own* response ("Here's what we heard from you"), shown only to them.
- A clear privacy note: what the manager sees (aggregated, anonymized summaries) and what they don't (names, raw responses). Wording must match what the system actually does (§7).
- A **"Need to talk with a manager?"** button. It opens an email to the manager by default. In team settings, the manager can switch it to another channel: phone number (call or text), a Slack link, or another link or contact. This intentionally steps outside anonymity and must say so clearly.

### 5.3 Trainings
- Members see upcoming and past team discussions and can view the slides in the app (or download the .pptx). **[OPEN Q2]**

## 6. Where AI is used

| Job | Trigger | Output | Suggested model |
|---|---|---|---|
| Per-response analysis | Survey submit | Structured JSON: themes, sentiment, issues, PII-free paraphrase. **This is the only copy of the response that is saved.** | Claude Haiku 5.5 or Sonnet 5.5 |
| Member's own summary | Survey submit | 2 to 3 sentences | Same call as above |
| Team roll-up summary | When threshold met, then on new responses (debounced) | Themes, trends, top needs, built from the saved per-response summaries | Claude Sonnet 5.5 |
| Topic suggestions | Manager opens wizard | 3 to 5 ranked topics with rationale | Claude Sonnet 5.5 |
| Subtopic plan | After topic, length, format chosen | Outline with minute estimates | Claude Sonnet 5.5 |
| Training generation | "Generate" | Structured slide deck JSON, converted to .pptx | Claude Opus 5.5 |
| Side-chat edits | Manager message | Proposed slide-level changes | Claude Sonnet 5.5 or Opus 5.5 |
| YouTube video finding | If selected | Existing YouTube links with titles (via the API's web search tool), checked before use | Same as generation |
| Growth commentary | Weekly | Short note on rating trends per goal or core value | Claude Sonnet 5.5 |

Implementation notes:
- Use **structured outputs** (JSON schemas) so the app renders AI results as UI, not chat text.
- Use **prompt caching** for the large, stable parts of prompts (system instructions, format templates).
- Because raw text is never stored, the per-response analysis must capture everything later steps need (themes, goal-related comments, suggested training needs). Its schema should be designed with the topic suggestion step in mind.
- If the analysis call fails, the app should retry while the member waits, or keep the text in memory until it succeeds. It should not save the raw text as a fallback.

## 7. Privacy and anonymity (answers "How do we ensure privacy?")

Small teams make anonymity hard: with 4 people, a manager can often guess who wrote what from wording, timing or topic. The design has to defend against *re-identification*, not just hide names.

### 7.1 Anonymity in the product
- **Minimum response threshold:** no summary is shown until at least **3** members have responded in that period (decided). For daily surveys, "period" is one day; if fewer than 3 respond on a day, that day's responses are combined with the next day's until the threshold is met.
- **No raw responses at all.** Raw text is never stored, so neither managers nor operators can read it. Managers see AI-written aggregate themes built from the per-response summaries.
- **No per-person breakdowns** of scores; only averages and distributions above the threshold.
- **Blur timing:** show the completion count, but don't update the summary on every single submission in real time (a summary that changes right after one person submits reveals what they wrote). Update in batches, e.g. once at least 2 new responses arrive, or hourly.
- **Instruct the AI** to never attribute statements to individuals, never include names or identifying details, and to generalize rare details ("someone mentioned the Denver client" becomes "client communication").

### 7.2 Separate identity from content in the database
- Store "who completed survey X" (for the count and reminders) in a different table from response content, with no foreign key linking them. Response rows carry only team ID and survey period.
- Restrict access to per-response summaries in the database itself (row-level security), so managers can read only the team roll-up, even if there's a bug in the UI.
- Raw text is never written to the database, logs, or error trackers. Make sure request logging (e.g. in serverless function logs) doesn't capture the request body.

### 7.3 Before data reaches the AI provider
- **PII stripping:** before sending text to the LLM, run a redaction pass for names (team roster names are known, so match them directly), emails, phone numbers, and other identifiers. Replace with placeholders like `[TEAMMATE]`. Open-source tools such as Microsoft Presidio help with general PII.
- Send only the minimum needed: the response text and team goals, never user IDs or emails.
- Raw text still passes through the AI provider even though the app doesn't store it, so the provider's retention policy (§7.4) is the remaining place it exists.

### 7.4 AI provider data handling
- **Anthropic API (commercial terms):** API data is not used to train models by default. Inputs and outputs are kept for a limited period for safety and abuse monitoring (check the current retention period in Anthropic's privacy center and commercial terms before launch).
- **Zero Data Retention (ZDR):** Anthropic offers ZDR to eligible API customers by arrangement with their sales team; it is not self-serve. Claude Opus 5.5, Sonnet 5.5 and Haiku 5.5 can be used under ZDR. The Claude Fable models require 30-day retention and are not available under ZDR, which is another reason not to use them here.
- **Amazon Bedrock / Google Vertex AI:** data stays within your cloud provider account under its data-handling terms, which some customers' IT departments prefer.
- For the prototype, standard API terms are probably fine; ZDR or a cloud provider becomes important when selling to companies with security reviews.

### 7.5 Retention and policy
- Raw text: never stored (decided). Per-response summaries and team summaries: how long to keep them is still open **[OPEN Q4]**.
- Privacy notice that members see before their first survey, in plain language.
- Safety escalation (harassment, self-harm): out of scope for Prototype 1; see Future Features.
- If used in the EU or with health-adjacent content, GDPR applies (consent, right to deletion, data processing agreement with the AI provider).

## 8. AI provider (answers "How do we use our Claude accounts for API calls?")

### 8.1 Short answer: you can't use Claude.ai accounts for this
Claude Pro, Max, Team and Enterprise subscriptions are for people using Claude directly in the apps. They don't include API access, and using a subscription login to power your own app isn't allowed under the terms. A web app needs the **Claude API**, which is a separate product with its own billing.

### 8.2 Claude API (recommended)
- Sign up at **platform.claude.com** (Anthropic Console), add a payment method or prepaid credits, and create an API key. The key lives on your server only, never in the browser.
- Pay per token (roughly, per word processed). No monthly fee. Usage limits rise automatically as you spend more.
- Official SDKs for TypeScript, Python and others.

**Current prices** (checked 16 Nov 2026 against Anthropic's pricing page; USD per million tokens; 1M tokens is roughly 750,000 words):

| Model | Input | Output | Cached input | Good for |
|---|---|---|---|---|
| Claude Opus 5.5 | $4 | $20 | $0.20 | Training generation (best quality) |
| Claude Sonnet 5.5 | $2 | $10 | $0.10 | Summaries, suggestions, side chat |
| Claude Haiku 5.5 | $0.10 | $0.50 | $0.01 | Per-response analysis, high volume |

The Batch API halves these prices for jobs that can wait (up to 24 hours), such as weekly growth reports.

**Rough cost for one team of 10** (estimate, not measured): 10 survey responses a day through Haiku is a fraction of a cent; daily roll-up summaries on Sonnet are about $0.01 to $0.03 each; one 10-minute training generated on Opus with a few rounds of edits is roughly $0.20 to $0.50. A team would likely cost **under $5 a month**, and the prototype phase likely under $20 total. Real numbers come once we measure actual prompts.

### 8.3 Alternatives
| Option | What it is | When to pick it |
|---|---|---|
| **Amazon Bedrock** | Claude models through your AWS account, billed by AWS | You're already on AWS or customers require it |
| **Google Vertex AI** | Claude models through Google Cloud, billed by Google | You're already on Google Cloud |
| **Microsoft Foundry** | Claude through Azure, billed through Microsoft at Anthropic's API rates | You're on Azure |
| **Other providers** (OpenAI, Google Gemini) | Different models with their own APIs and pricing | Comparing quality or price; check their current pricing pages |

Bedrock and Vertex set their own Claude prices; check their pricing pages. Recommendation: start with the Anthropic API directly (simplest setup, newest features first), and keep AI calls behind one server module so switching later is easy.

## 9. Proposed tech stack

Decided (18 Nov): one web app that works in desktop and mobile browsers, built with Next.js (static export on GitHub Pages) plus one Supabase Edge Function for AI calls. No database for Prototype 1. React Native is for installable phone apps, so it's left out; the same React skills apply in Next.js.

Layouts are responsive: a sidebar on desktop and a bottom tab bar on phones. The daily survey and member screens are designed mobile-first, since members will mostly use phones. Slide editing is designed for desktop but still usable on a phone. The app can be made installable to the home screen (a PWA) at little extra cost.

| Layer | Proposal | Why |
|---|---|---|
| App | **Next.js (App Router), TypeScript**, Tailwind + shadcn/ui | One responsive app for desktop and mobile browsers |
| Data | **Browser localStorage** (Prototype 1). Later: Supabase Postgres + auth with row-level security | No database to run for the prototype; row-level security will enforce §7.2 later |
| AI calls | **One Supabase Edge Function** (`supabase/functions/ai`) using the Anthropic TypeScript SDK, gated by a shared app passcode | GitHub Pages is static, so the API key lives in a Supabase secret and never reaches the browser |
| Slide editor | Slide list plus an editable panel over the deck JSON | Each slide is a structured card, which makes AI edits to single slides simple |
| PowerPoint export | **PptxGenJS** in the browser, turning the deck JSON into a .pptx | Free, open-source library |
| Hosting | **GitHub Pages** (static export) | Free; already deploys on every push to `main` |
| Email | Supabase Auth emails for login; `mailto:` links for "Need to talk with a manager?" | No email service needed for Prototype 1 |

### 9.1 Data model (first pass)
- `organizations` (id, name)
- `users` (id, email, name)
- `teams` (id, org_id, name, manager_id (one per team), manager_contact_type: email | phone | slack | link, manager_contact_value)
- `team_memberships` (team_id, user_id): a user can be in many teams
- `goals` (id, team_id, kind: goal | core_value, title, description, status)
- `survey_completions` (user_id, date): identity, one row per person per day, used only for counts and reminders
- `survey_responses` (id, date, is_weekly, analysis_json, improvement_rating): **no user_id and no raw text**
- `response_teams` (response_id, team_id): sends one response to each of the member's teams
- `goal_ratings` (response_id, goal_id, rating): weekly ratings; the goal identifies the team
- `team_summaries` (id, team_id, date_range, summary_json, response_count, generated_at)
- `trainings` (id, team_id, topic, length_minutes, deck_json, pptx_file_path, status: draft | published, discussion_date, created_at)
- `training_revisions` (id, training_id, deck_json, source: manual | ai_chat | regenerate, created_at)

Note: storing exact times on both responses and completions would let someone with database access match them. Responses store only the date, with no timestamp. Also, `response_teams` shows which set of teams a response went to; a member with an unusual combination of teams could be identified that way, so it should be readable only by server functions, never by managers.

## 10. Open questions

Answered on 16 and 18 Nov: see §0.

1. **Multi-team responses:** if someone on Team A and Team B writes about Team A, should that also appear in Team B's summary? I recommend that the AI sends each team only the parts of the response that relate to it, so managers don't see other teams' issues. Sending the whole response to every team is simpler.
2. **Member side of trainings:** is the discussion always run live by the manager in a meeting, or should members also be able to view the slides on their own before or after it?
3. **Week start:** does the week start on Monday for the weekly questions? If someone misses Monday, should the weekly questions appear on their next survey that week?
4. **Summary retention:** how long should per-response and team summaries be kept?
5. **Auth:** email magic links, Google sign-in, or both?
6. **Repo:** should I set up a GitHub repo for this? (You'd create it on GitHub and tell me the name.)

## 11. Out of scope for Prototype 1
- AI-generated follow-up questions on the survey (Future Features)
- More training formats: micro-lesson, scenario practice, self-paced module with quiz (Future Features)
- Safety escalation for serious issues such as harassment or self-harm: detect them in the analysis step, show the member support resources or an HR contact, and possibly alert someone. Any alerting breaks anonymity and must be disclosed up front (Future Features)
- Native iOS/Android apps and app store releases
- Billing and multiple organizations
- Slack/Teams integrations
