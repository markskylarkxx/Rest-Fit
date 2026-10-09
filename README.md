
RestFit — Complete Product Documentation

Version: 3.0
Status: Platform + Admin Dashboard shipped. Member App shipped (web + Android APK). AI plan generation live. Brand renamed and relaunched.
Last updated: October 2026

⚡ What Changed Since v2.1

Four structural shifts since the last version:

Brand renamed. Gym OS → RestFit. New identity, new logo, new domain (restfit.com), new Android package (ng.restfit.app). The app now reads "Rest. Train. Repeat." as its tagline.
AI plan generation shipped. Users answer 4 questions, Groq generates a custom 4-week training program in ~5 seconds. This is live on both the API and the member app.
Training plans became first-class. 5 preset programs + AI generation. Users enroll, the plan drives "Today's Workout" on Home, and finishing a workout advances the plan.
Landing page shipped. restfit.com presents the product to gym owners. Sign-up form captures leads.
The core two-product thesis is unchanged. What's new is that the universal fitness layer is now genuinely a coach, not just a notebook.

1. Overview

RestFit is a fitness platform for Nigeria with two connected products:

A universal fitness app — anyone can download it, track workouts, build streaks, follow a training plan, and find gyms
A gym operating system — gym owners get a dashboard to run payments, members, check-ins, and retention; their members get membership features unlocked in the app
One backend. One identity system. Two audiences. Real value for both.

In one sentence:

RestFit is the Nigerian fitness app that anyone can use for workouts, streaks, and progress — and that unlocks membership management, QR check-in, and multi-gym support when your gym joins the platform.
2. The Problem

(unchanged — the problem statement from v2.0 still holds exactly)

For gym-goers, gym owners, and front desk staff: fragmented gym life, no portable identity, invisible memberships, manual renewal chasing, no churn visibility, no audit trail.

3. The Solution

(unchanged from v2.0)

4. Who Uses It

RestFit has two client applications on one shared platform.

4.1 Member App (mobile, shipped as Android APK)

Users: Anyone with a phone — gym member or not.

Purpose: Track workouts, follow a training plan, build habits, log progress, manage memberships across gyms.

Access: Phone number + one-time code (OTP). JWT session valid for 30 days.

Core features:

Universal (works for anyone): workout logging with progressive overload, rest timer, exercise library, streaks, weight tracking, AI-generated training plans, preset 5-program plan library, gym finder, invite your gym
Gym-connected (unlocks with a RestFit gym): membership status, QR check-in, in-app renewal, payment history, multi-gym
First Rep mode: beginners see a movement-focused app (Walk, Run, Dance) with a green hero and gentle copy. Intermediate and experienced users see the full strength logger. Changeable in Profile.
Routes: /home, /workout, /workout/log, /workouts/:id, /progress, /find-gyms, /qr, /memberships/:id, /join, /plans, /plans/generate, /plans/:slug, /onboarding, /profile

Data: all fitness data (workouts, templates, PRs, weights, training plans) is server-backed. Writes go through an IndexedDB queue so a workout can be logged with zero signal and synced later.

4.2 Admin Dashboard (web)

(unchanged from v2.0)

4.3 The Platform (invisible)

(unchanged from v2.0)

5. Core Concepts

5.1 Universal + Gym-Connected layers

(unchanged from v2.0)

5.2 Multi-tenancy

(unchanged from v2.0)

5.3 Two identities, one person

(unchanged from v2.0)

5.4 Money in kobo

(unchanged from v2.0)

5.5 Payments: redirect vs webhook

(unchanged from v2.0)

5.6 Idempotency

(unchanged from v2.0)

5.7 Server-backed fitness data

(unchanged from v2.1)

5.8 Training plan vs. workout log

This is a new distinction that matters.

A training plan is a suggestion. A coach's voice. "Today: Full Body A. Bench, Row, OHP, Pulldown. 3×8 each." It lives in the TrainingPlan, TrainingPlanWeek, TrainingPlanDay, TrainingPlanExercise tables. It doesn't know what you actually did. It advances by sequence, not by date.

A workout log is a fact. Your diary. "I did Bench Press: 3 sets of 8 at 62.5kg." It lives in the Workout, WorkoutExercise, WorkoutSet tables. It doesn't know what the plan said. Every entry is timestamped and immutable.

They connect when the user taps "Start today's workout" from Home. The logger opens pre-filled from the plan. When they tap Finish, two things happen: the workout is saved AND the plan advances to the next day.

They never merge. The plan is what to do. The log is what you did.

5.9 Rest days are part of the plan

Every training plan includes rest days. Rest is not a gap — it's a scheduled part of the program. On a rest day, Home says: "Rest day. You've earned today off. Yesterday: Full Body A — done 2 days ago. Next workout: Full Body B."

Rest days exist because training every day doesn't work. Recovery is when the body adapts.

5.10 Cloud backup (safety net)

(unchanged from v2.1 — legacy pre-migration installs only)

6. Features

6.1 Member App — Universal Layer

Home screen

Greeting with the user's first name (from any membership that has one)
Streak hero banner — gradient card. Lime for beginners, orange for others. Big streak number, contextual copy, white "Start workout" CTA.
Training plan card — "Strength 5×5 · Week 1 of 12 · Today: Workout A — Barbell Squat · Bench Press · Row." Tapping opens the logger pre-filled. If on a rest day, shows the rest-day card with "last session" and "next workout."
Quick actions: QR / Log / Progress / Gyms
7-day week strip — checkmarks for days you trained
Gym card (if a membership exists)
All gyms list (if multiple memberships)
"Invite my gym" CTA if no gym
Change / Quit plan controls
Training plan picker (/plans)

"Build a plan for me" card at the top — purple, AI-powered
5 preset plans below — First Steps, Gym Basics, Upper/Lower, Push/Pull/Legs, Strength 5×5
Each plan shows difficulty, weeks, days/week, description
Tap to enroll — only one active plan at a time; enrolling in a new one deactivates the old
AI plan generation (/plans/generate)

4-question form: goal, days/week, equipment, session length
Experience level (from onboarding) is the 5th input
Tapping "Build my plan" calls Groq with a strict tool-calling schema
Loading screen for ~5 seconds
A custom 4-week plan appears in the database, the user is auto-enrolled, Home immediately shows "Today: [AI's Day 1]"
Free-tier limit: 3 AI plans per user
Workout log

Exercise library (27+ exercises across 7 muscle groups)
Filter by muscle or search by name
"Last time" hints — when you add an exercise, shows what you did last session
Progressive overload suggestion — pre-fills sets with a sensible next weight (2.5kg upper / 5kg lower / 1.25kg isolation when you hit all reps)
Rest timer — auto-starts on set edit, 90s for isolation, 180s for compound lifts
Log sets, reps, and weight; add/remove sets; add/remove exercises
Finish workout → saved to server (or queued offline) → streak updates → plan advances
Repeat last workout — one tap from Workouts list
"From your plan · Gym Basics · Week 1 · Full Body A" source label at the top when opened from a plan
PR detection — celebrate new personal records on finish
Beginner mode (First Rep)

Log Workout becomes "Move" — pick Walk, Run, Cycle, Swim, Home workout, Dance, Yoga, or Something else
Set duration (10/15/20/30/45/60 min + custom) and when (just now, 1h ago, 3h ago, this morning, yesterday)
Saved as a movement session
Home shows "Movement streak" with lime hero
Copy is gentler: "Anything counts. Even 10 minutes."
Progress

Log weight with date
Current weight card with trend indicator
Weight line chart over time
Weekly volume chart — kg lifted per week, last 8 weeks
Strength progression — pick a lift, see best set over time
History list with delete
Streaks

Consecutive days with at least one workout or movement session
Today counts if a workout exists; otherwise counted from yesterday
Displayed prominently on Home
Find gyms

Look up a gym by join code
Gym directory (nearby gyms via Overpass/OSM)
"Invite my gym" flow — opens WhatsApp with a pre-written message
Profile

Phone number, account ID
Training experience (changeable: Just starting / Sometimes / Regular)
Training plan summary
Sign out
QR check-in

Full-screen QR code for the door scanner
Human-readable code below
Cached locally so it works offline (last-known code)
6.2 Member App — Gym-Connected Layer

(unchanged from v2.0)

6.3 Admin Dashboard

(unchanged from v2.0, plus the At-Risk page added in v2.1)

At-Risk Members

Members who haven't checked in for 10+ days
Categorized as:

Training elsewhere — still logging workouts on the RestFit app, just not at the gym
Lapsed — no check-ins, no app activity
Never started — joined but never checked in
Each row shows: last check-in, last workout, workouts this week, plan, expiry
Suggested WhatsApp message tailored to the category
One-tap WhatsApp button
6.4 Retention Engine (automated)

(unchanged from v2.0)

7. Architecture

7.1 High-level

(unchanged — same diagram)

7.2 Data model — updated

Entity	Purpose	Key fields
Gym	A gym business	joinCode (unique)
Staff	Gym employees	gymId, role, email, passwordHash
Plan	What gym members can buy	priceKobo, durationDays, active
Member	A membership at one gym	gymId, phone, checkInCode, userId
MemberUser	A person's login	phone (globally unique), experienceLevel
OtpCode	Login codes	phone, codeHash, expiresAt
Subscription	A member's purchase	status, startDate, endDate
Payment	A transaction	status, method, orchPayTxnId, paymentLink
CheckIn	Every QR scan	allowed, reason
Reminder	Sent reminder records	@@unique([subscriptionId, kind])
Workout	A logged workout	userId, date, durationMin
WorkoutExercise	One exercise in a workout	workoutId, exerciseId, name, order
WorkoutSet	One set	exerciseId, order, reps, weightKg
TrainingPlan	A structured program	slug, name, difficulty, weeks, daysPerWeek
TrainingPlanWeek	One week in a program	planId, weekNumber, days
TrainingPlanDay	One day in a week	weekId, dayNumber, label, kind (STRENGTH/MOVEMENT/REST)
TrainingPlanExercise	One exercise in a day	dayId, exerciseId, name, targetSets, targetReps, targetWeight
UserTrainingPlan	Enrollment: user on a plan	userId, planId, currentWeek, currentDay, completedDays, active
WeightEntry	Body weight log	userId, kg, date
PersonalRecord	Best set per exercise	userId, exerciseName, weightKg, reps
WorkoutTemplate	Reusable routine	userId, name, exerciseIds
WorkoutSnapshot	Legacy local-data backup	userId (unique), data, sizeBytes
7.3 Subscription lifecycle

(unchanged)

7.4 Payment flows

(unchanged)

7.5 Workout log — server-backed with offline queue

(unchanged from v2.1)

7.6 Training plan lifecycle

Preset plans are seeded from apps/api/src/seed/trainingPlans.ts. Running npm run seed:plans wipes and recreates all 5 preset plans from this file.

AI-generated plans are created by generateTrainingPlan in apps/api/src/services/aiPlanGeneration.ts. The function:

Calls Groq with openai/gpt-oss-120b
Forces a single tool call (provide_training_plan)
Parses the tool-call arguments as JSON
Writes the plan tree to the database
Auto-enrolls the user
The tool schema uses JSON Schema semantics: nullable fields use type: ["X", "null"], not nullable: true. Groq rejects the OpenAI shorthand.

Enrollment rules:

Only one active plan at a time
Enrolling in a new plan deactivates the old one (active: false, completedAt: now)
Quitting a plan deactivates it without deleting anything
Finishing the last day of the last week auto-finishes the plan
Plan advance:

Every time a user finishes a workout opened from ?planDay=<id>, the app calls POST /training-plans/current/complete-day
That endpoint advances currentWeek and currentDay and increments completedDays
8. User Journeys

(unchanged from v2.0, with the addition of:)

8.7 AI plan generation

User has no active plan (or wants a new one)
Taps "Choose a training plan" or "Change" on Home
Taps "Build a plan for me"
Answers 4 questions
Waits ~5 seconds
Lands on Home with a fresh custom plan enrolled
Taps "Start today's workout" → logger opens pre-filled
8.8 Rest day

User finishes a workout
Plan advances to the next day, which is a rest day
Home shows: "Rest day. You've earned today off. Full Body A — done yesterday. Next workout: Full Body B."
No action needed. The card just tells them where they are.
9. Technology Stack — updated

Layer	Choice	Reason
Backend	Express + TypeScript (ESM)	Mature, flexible
ORM	Prisma	Type-safe, great migrations
Database	PostgreSQL	Relational integrity for money + subscriptions + workouts + plans
Auth	JWT (two token types)	Stateless, separates staff and member
Validation	Zod	Shared schemas between API and clients
Payments	Orch-Pay	Own orchestrator
Messaging	Termii	SMS + WhatsApp for Nigeria
AI	Groq (openai/gpt-oss-120b)	Fast, cheap, structured output via tool calling
Scheduled jobs	node-cron	Simple, in-process
Admin frontend	React + Vite + Tailwind	Fast, modern
Member app	React + Vite + Tailwind + Capacitor	Web tech wrapped as native Android APK
Landing page	React + Vite + Tailwind	Same stack as the apps
Fitness data	Postgres (server-backed)	Multi-device, safe, AI-ready
Offline writes	IndexedDB via idb	Persists across app kills; small
Charts	Recharts	Lightweight, React-native-friendly
Exercise data	In-repo TS file	Simple, no API needed
Brand palette	Charcoal (#0A0A0A) + Lime (#C8FF00) + Warm ink (#F5F0EB)	Consistent across all three apps
Font	Inter	Same across all three apps
10. Project Structure — updated

text
restfit/
├── apps/
│   ├── api/                       # Backend (Express + Prisma)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── scripts/
│   │   │   └── seed-demo.ts       # Demo data seeder (dev only)
│   │   └── src/
│   │       ├── middleware/
│   │       ├── routes/            # auth, members, plans, app, dashboard, public, webhooks
│   │       ├── services/          # memberships, subscriptions, otp, orchpay, notify,
│   │       │                      # workouts, trainingPlans, aiPlanGeneration, weights, atRisk
│   │       ├── seed/              # trainingPlans.ts (5 preset programs)
│   │       ├── jobs/
│   │       ├── lib/
│   │       └── env.ts
│   │
│   ├── admin/                     # Admin Dashboard
│   │   └── src/
│   │       ├── components/
│   │       ├── lib/
│   │       └── pages/
│   │
│   ├── member/                    # Member App (React + Capacitor)
│   │   ├── android/               # Native Android (ng.restfit.app)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── pages/             # Login, Verify, Onboarding, Home, Workout, LogWorkout,
│   │   │                          # Progress, FindGyms, PlanPicker, PlanDetail, GeneratePlan,
│   │   │                          # Membership, QrCode, Renew, Profile
│   │   ├── capacitor.config.ts
│   │   └── package.json
│   │
│   └── landing/                   # Marketing site
│       ├── public/screens/        # Phone screenshots
│       ├── src/
│       │   └── components/        # Nav, Hero, Problem, Solution, AtRisk, AIPlans,
│       │                          # MultiGym, AppScreenshots, HowItWorks, Pricing, FAQ,
│       │                          # SignupForm, Footer
│       └── package.json
│
├── packages/
│   └── shared/                    # Shared Zod schemas + TypeScript types
│
├── postman/
└── README.md
11. Current Status — rewritten

Shipped

Platform:

✅ Multi-tenant backend (Express + Prisma + Postgres)
✅ Two-token auth (staff / member)
✅ Role-based access control
✅ Zod validation on all inputs
✅ Central error handler
✅ CORS configured for local dev, ngrok, and production
✅ Webhook signature verification (HMAC-SHA256)
✅ Groq integration with tool-calling for structured AI output
Admin Dashboard:

✅ Register + login
✅ Dashboard with revenue, members, expiring, check-ins
✅ Members CRUD + search + filters + detail page
✅ Plans CRUD (gym membership plans)
✅ Payments (cash/transfer/POS/online link)
✅ QR check-in with allowed/refused logging
✅ At-Risk Members page with training-elsewhere categorization
Member App — Universal:

✅ Phone + OTP authentication
✅ Onboarding with experience level (First Rep mode)
✅ Home with streak hero, plan card, week strip, quick actions
✅ Server-backed workout logging with offline write queue
✅ Progressive overload hints
✅ Rest timer
✅ Repeat last workout
✅ PR detection with celebration
✅ Workout templates (server-backed)
✅ 5 preset training plans with full 8–12 week structures
✅ AI plan generation via Groq
✅ Plan enrollment, "Today's Workout," rest days
✅ Weight tracking + charts (weight, weekly volume, per-lift strength progression)
✅ Exercise library (27+ exercises, filterable)
✅ Streaks (workout + movement)
✅ Find gyms (join code + nearby directory)
✅ Invite my gym via WhatsApp
✅ Lime/charcoal brand palette matching the landing page
Member App — Gym-Connected:

✅ Multi-gym membership list
✅ Membership detail + QR code
✅ In-app renewal (Orch-Pay via in-app browser)
✅ Join a gym flow
✅ QR check-in with offline cache
✅ Bottom nav (Home, Workout, Progress, Profile)
✅ Change plan / Quit plan from Home
Member App — Infrastructure:

✅ Offline write queue (IndexedDB)
✅ Cloud backup endpoint (legacy safety net)
✅ Android APK built and running with RestFit logo and package ID
Landing Page:

✅ Hero with value prop and dashboard mockup
✅ Problem section with ₦320k stat
✅ Solution section (gym + member columns)
✅ At-Risk feature deep-dive
✅ AI plan generation section
✅ Multi-gym section
✅ App screenshots section with real device captures
✅ How It Works (3 steps)
✅ Pricing (₦25,000/mo, 30-day free trial)
✅ FAQ (accordion)
✅ Gym signup form (captures leads to API)
✅ Footer with WhatsApp and email
Brand:

✅ RestFit name, tagline ("Rest. Train. Repeat."), and RF lettermark logo
✅ Logo exported at all Android icon sizes
✅ Logo replaced in the APK's mipmap folders
✅ Charcoal + lime palette applied across member app and landing page
Retention:

✅ Hourly expiry job
✅ Daily WhatsApp reminders (7/3/1/expired)
✅ Idempotent reminder sending
In progress

Infrastructure:

🟡 Cloud deployment (API on Railway, landing on Vercel, restfit.com pointed at both)
🟡 Social handles (@restfit.ng on Instagram, TikTok, X)
🟡 WhatsApp Business setup
🟡 Play Store account + signed release AAB
Pending

Member App:

❌ Nutrition / food logging (calories, protein, AI photo logging)
❌ Goals tracker ("Lose 5kg in 8 weeks")
❌ Body measurements
❌ Progress photos
❌ AI weekly recap
❌ AI coach chat
❌ Push notifications (FCM)
❌ Community / friends feed
❌ Trainer chat
Admin Dashboard:

❌ Attendance analytics (trends, peak hours)
❌ Trainer management
❌ Class scheduling
Platform:

❌ Referral system
❌ Multi-branch support
❌ Equipment tracking
❌ Advanced analytics
❌ Multi-device sync (partially solved by server-backed data; full conflict resolution pending)
12. Roadmap — rewritten

Phase 1 — Ship the Member App ✅ (Done)

✅ Mobile UI (React + Capacitor → Android)
✅ All screens
✅ Bottom nav
✅ Android APK built and running
Phase 2 — Fitness Foundations ✅ (Done)

✅ Progressive overload hints
✅ Rest timer
✅ Repeat last workout
✅ PR detection
✅ Charts (weight, volume, strength)
Phase 3 — Server-Backed Fitness ✅ (Done)

✅ Workout models and API endpoints
✅ IndexedDB write queue
✅ All fitness screens on server
✅ Templates + PRs on server
✅ Weight entries + stat endpoints on server
Phase 4 — Training Plans + AI ✅ (Done)

✅ 5 preset training plans (First Steps, Gym Basics, Upper/Lower, PPL, 5×5)
✅ Plan enrollment + UserTrainingPlan
✅ "Today's Workout" on Home driven by plan
✅ Rest-day card with "last session" and "next workout"
✅ Plan advancement on workout finish
✅ AI plan generation via Groq (4 questions → 4-week custom program in ~5s)
✅ Change plan / Quit plan UI
Phase 5 — Brand + Landing ✅ (Done)

✅ Renamed Gym OS → RestFit
✅ RF lettermark logo designed and exported
✅ Charcoal + lime palette applied across apps
✅ Landing page built (restfit.com)
✅ App screenshots captured and wired into the landing page
✅ Signup form capturing gym owner leads
Phase 6 — Cloud + Store 🟡 (In progress)

🟡 Buy domain + point at Vercel/Railway
🟡 Deploy API to cloud
🟡 Deploy landing page to Vercel
🟡 Update APK to point at production API
🟡 Play Store account + signed release AAB
🟡 Play Store listing (screenshots, description, privacy policy)
Phase 7 — Social + Marketing 🟡 (In progress)

🟡 Claim handles on Instagram, TikTok, X
🟡 WhatsApp Business setup with quick replies
🟡 First 5 posts on each platform
🟡 Content calendar (4 posts/week)
⏳ Paid ads experiment (₦20k targeting Lagos gym owners)
⏳ Nigerian fitness influencer partnerships
⏳ Press pitches (TechCabal, Techpoint, Nairametrics)
Phase 8 — Pilot 🟡 (Next)

🟡 Recruit 3–5 pilot gyms in Lagos
🟡 Onboard each gym
🟡 Recruit 20–50 pilot members
🟡 Instrument with PostHog or similar
🟡 Weekly iteration based on feedback
Phase 9 — Nutrition

❌ Daily calorie + protein targets
❌ Meal logging
❌ AI photo logging (Nigerian food bias)
❌ Water tracker
❌ Weekly nutrition summary
Phase 10 — AI Expansion

❌ Weekly AI recap
❌ AI coach chat
❌ Adaptive plans based on logged progress
Phase 11 — Community

❌ Friends feed (gym-scoped)
❌ Challenges and leaderboards
❌ Referral system
Phase 12 — Bigger Vision

❌ Gym Pass (pay once, use any gym)
❌ Portable fitness identity
❌ Trust layer (reviews, escrow, disputes)
❌ Expand to adjacent verticals
13. Success Metrics

(unchanged from v2.0)

14. Business Model

(unchanged from v2.0)

Updated pricing (from the landing page):

₦25,000/month flat
30-day free trial
No setup fee
15. Guiding Principles — updated

Multi-tenant from day one. Every gym-owned table carries gymId.
Money in kobo. Integers only. No floating point.
Idempotency everywhere. Assume every operation will be retried.
Webhooks over redirects. Never trust the browser.
Two identities per person. Login (MemberUser) and membership (Member) are separate.
Soft deletes for anything that's been sold.
Claim first, send second. Prevent duplicate reminders and payments.
Constant-time comparisons. For OTP hashes and webhook signatures.
Fire-and-forget notifications. A failed SMS never breaks a payment.
Isolate data by default. Staff of one gym can never see another gym's data.
Universal first, gym-connected second. The app must be useful to anyone.
Server is the source of truth. All data lives in Postgres. The client is a view.
Offline writes via queue, not cache. Reads require a connection; writes queue in IndexedDB.
Slices, not big bangs. Ship one capability end-to-end before starting the next.
Plan is a suggestion. Log is a fact. Never confuse them.
Never claim a date you can't back up. If the app doesn't know when something happened, don't say "yesterday."
One brand, one palette, everywhere. Charcoal, lime, ink. Same colors in the app, the dashboard, and the landing page.
16. What Makes This Different

(unchanged from v2.0, plus:)

vs. FirstRep and GymLinx

Both are B2B-first gym software. Their member apps are a feature of their gym product.

RestFit is different:

The member app is a standalone product — it works without a gym, and it works across gyms
AI plan generation — nobody else in Nigeria does this
At-Risk with training-elsewhere context — only possible because the universal app sees where members train when they're not at their gym
Universal + gym-connected layers, one login — same architecture, different access
17. Do We Have Products Like This in Nigeria?

(unchanged from v2.0)

The space is still clear. Nobody has built the combination of universal fitness app + gym operating system + multi-gym identity + AI plan generation.

18. Getting Started (for developers) — updated

Prerequisites

(unchanged)

Setup


git clone <repo>
cd restfit
npm install

cp apps/api/.env.example apps/api/.env
# Set DATABASE_URL, JWT_SECRET, GROQ_API_KEY, ORCHPAY_*, TERMII_*

cd apps/api
npx prisma migrate dev
npx prisma generate
npm run seed:plans    # seeds 5 preset training plans
npm run dev           # API on :4000
Member app:


cd apps/member
npm run dev           # web on :5173

# Or build the APK
npm run build
npx cap sync android
cd android && ./gradlew clean assembleDebug
Admin dashboard:


cd apps/admin
npm run dev           # web on :5173 (or 5174 if member is running)
Landing page:


cd apps/landing
npm run dev           # web on :5174 (or 5175)
Environment variables

env
# apps/api/.env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=4000
ADMIN_URL="http://localhost:5173"
GROQ_API_KEY="gsk_..."
ORCHPAY_API_KEY=""
ORCHPAY_BASE_URL=""
ORCHPAY_WEBHOOK_SECRET=""
TERMII_API_KEY=""
TERMII_BASE_URL="https://api.ng.termii.com"
TERMII_SENDER_ID="RestFit"
TERMII_CHANNEL="generic"
NODE_ENV="development"
env
# apps/member/.env
VITE_API_URL=http://localhost:4000/api
# For physical device testing:
# VITE_API_URL=http://<LAN-IP>:4000/api
# For production:
# VITE_API_URL=https://api.restfit.com/api
19. Open Questions

AI provider — Groq is working well. Keep as primary. Consider OpenAI fallback.
Push notifications — Firebase Cloud Messaging vs. Termii-only?
Gym directory — the current OSM integration works. Consider Google Places for better Nigerian coverage.
Gym Pass — when to launch? Which city first?
Multi-branch — one gym account with branches, or separate accounts?
Data migration — when to force existing users to migrate old localStorage workouts? Wipe or migrate?
Adaptive icons — the foreground layer is currently the full logo. Consider a transparent version for proper adaptive icons.
Play Store rollout — closed test first, or straight to production?
20. Glossary

(unchanged from v2.0, with these additions:)

Term	Definition
Write queue	IndexedDB-backed retry inbox for writes that fail due to network
WorkoutSnapshot	Legacy JSON backup of pre-migration local data
Server-backed	Data lives in Postgres; the client fetches it
Slice	One capability shipped end-to-end before starting the next
Training plan	A structured workout program. A suggestion, not a record.
Workout log	What the user actually did. A fact, not a suggestion.
Plan day	One day in a training plan. Can be STRENGTH, MOVEMENT, or REST.
First Rep mode	The beginner-friendly version of the app (movement-focused, gentler copy)
RF	RestFit's lettermark. The logo.
21. Summary — updated

RestFit is a fitness platform for Nigeria with two connected products:

A universal fitness app — anyone can use it for workouts, training plans, streaks, progress, and finding gyms
A gym operating system — gym owners get a dashboard; their members get membership features unlocked in the app
One backend. One identity. Two audiences. Real value on both sides.

Shipped:

Multi-tenant platform (Express + Prisma + Postgres)
Admin dashboard with At-Risk Members
Member app (Android APK) with universal + gym-connected features
Server-backed workouts with offline write queue
Progressive overload, rest timer, PR detection, charts
5 preset training plans + AI plan generation via Groq
Full onboarding with First Rep mode
Landing page at restfit.com with gym signup form
RestFit brand: RF lettermark, charcoal + lime palette, "Rest. Train. Repeat." tagline
Automated retention engine (hourly expiry, daily WhatsApp reminders)
In progress:

Cloud deployment (API + landing)
Social handles
Play Store listing
Next:

Pilot with 3–5 Lagos gyms
Nutrition (calories, protein, AI photo logging)
Weekly AI recap + coach chat
Community and challenges
The endgame:

Every gym in Nigeria uses RestFit
Every gym-goer has one login
The app becomes the fitness identity layer for Nigeria
Gym Pass (pay once, use any gym) becomes the consumer product
Portable identity + trust layer — the fitness infrastructure for Nigeria