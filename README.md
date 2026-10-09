Gym OS — Complete Product Documentation

Version: 2.1
Status: Platform + Admin Dashboard shipped. Member App shipped (web + Android APK). Workouts now server-backed with offline write queue.
Last updated: October 2026

⚡ What Changed Since v2.0

Three structural shifts:

Workouts moved from local-only to server-backed. Every workout now lives in Postgres. The app still works offline — writes queue in IndexedDB and sync when the network returns. This is the big architectural change from v2.0.
Cloud backup added as a safety net. The old localStorage snapshot pipeline remains for backward compatibility with pre-migration installs.
Fitness layer got real. Progressive overload hints, rest timer, "last time" hints, repeat last workout, and PR detection. The app stopped being a notebook.
Nothing about the core two-product pitch changed. The universal + gym-connected thesis holds.

1. Overview

Gym OS is a fitness platform for Nigeria with two connected products:

A universal fitness app — anyone can download it, track workouts, build streaks, log progress, and find gyms
A gym operating system — gym owners get a dashboard to run payments, members, check-ins, and retention; their members get membership features unlocked in the app
One backend. One identity system. Two audiences. Real value for both.

In one sentence:

Gym OS is the Nigerian fitness app that anyone can use for workouts, streaks, and progress — and that unlocks membership management, QR check-in, and multi-gym support when your gym joins the platform.
2. The Problem

(unchanged — the problem statement from v2.0 still holds exactly)

For gym-goers, gym owners, and front desk staff, the pain points are the same: fragmented gym life, no portable identity, invisible memberships, manual renewal chasing, no churn visibility, no audit trail.

3. The Solution

(unchanged from v2.0)

4. Who Uses It

Gym OS has two client applications on one shared platform.

4.1 Member App (mobile, shipped as Android APK)

Users: Anyone with a phone — gym member or not.

Purpose: Track workouts, build habits, log progress, manage memberships across gyms.

Access: Phone number + one-time code (OTP). JWT session valid for 30 days.

Core features:

Universal (works for anyone): workout logging with progressive overload, rest timer, exercise library, streaks, weight tracking, gym finder, invite your gym
Gym-connected (unlocks with a Gym OS gym): membership status, QR check-in, in-app renewal, payment history, multi-gym
Routes: /home, /workout, /workout/log, /workouts/:id, /progress, /find-gyms, /qr, /memberships/:id, /join, /profile

Data: all fitness data (workouts, templates, PRs, weights) is server-backed. Writes go through an IndexedDB queue so a workout can be logged with zero signal and synced later.

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

5.7 Server-backed fitness data (rewritten)

In v2.0, workouts, weights, and streaks lived on the device using localStorage. That was a deliberate MVP choice to ship fast and validate the feature.

As of v2.1, all fitness data lives on the server. The member app talks to the API for every read and write. This gives us:

Multi-device support — sign in on a new phone and your history is there
Data safety — no more losing everything if the browser clears storage
Server-side computation — streaks, volume, and PRs computed from one source of truth
A foundation for AI — plan generation, nutrition logging, and weekly recaps need real data to work with
But offline-first behavior is preserved via a write queue:

Every write (create workout, delete workout) goes to the API immediately
If the API call fails for a network reason, the operation is queued in IndexedDB
The queue is retried on app start, on app resume, and when the network restores
Reads from the API when possible; failures surface a "no connection" state rather than silently showing stale data
Why IndexedDB for the queue: persistence across app kills. localStorage can be cleared by the browser; IndexedDB survives. This is the only place IndexedDB is used — it's a retry inbox, not a data store.

5.8 Cloud backup (safety net)

A legacy fallback remains for pre-migration installs and for users on old APKs. POST /app/workouts/backup accepts a JSON snapshot of local data and stores it in WorkoutSnapshot. It's a one-way write; the app never reads from it except during an explicit restore flow. Once all installs are migrated, this can be removed.

6. Features

6.1 Member App — Universal Layer

Home screen

Greeting with the user's first name
Streak hero banner — gradient card with big streak number, contextual copy ("3 day streak"), white "Start workout" CTA
Today's workout — card showing your most recent session, tap to repeat
4 quick actions: QR / Log / Progress / Gyms
7-day week strip — checkmarks for days you trained
Gym card (if a membership exists)
All gyms list (if multiple memberships)
"Invite my gym" CTA if no gym
Workout log

Exercise library (27+ exercises across 7 muscle groups)
Filter by muscle or search by name
"Last time" hints — when you add an exercise, shows what you did last session
Progressive overload suggestion — pre-fills sets with a sensible next weight (2.5kg upper / 5kg lower / 1.25kg isolation when you hit all reps)
Rest timer — auto-starts on set edit, 90s for isolation, 180s for compound lifts
Log sets, reps, and weight per exercise; add/remove sets; add/remove exercises
Finish workout → saved to server (or queued offline) → streak updates
Repeat last workout — one tap from Workouts list
View past workouts with full details
PR detection — celebrate new personal records on workout finish
Exercise library

Categories: Chest, Back, Legs, Shoulders, Arms, Core, Cardio
Equipment tags: Barbell, Dumbbell, Machine, Bodyweight, Cable
Searchable
Progress

Log weight with date
Current weight card with trend indicator
Weight line chart over time
Weekly volume chart — kg lifted per week, last 8 weeks
Strength progression — pick a lift, see best set over time
History list
Streaks

Consecutive days with at least one workout
Today counts if a workout exists; otherwise counted from yesterday
Displayed prominently on Home
Find gyms

Look up a gym by join code
Gym directory (nearby gyms via Overpass/OSM)
"Invite my gym" flow — sends WhatsApp message to the gym owner
Profile

Phone number, account ID
Sign out
6.2 Member App — Gym-Connected Layer

(unchanged from v2.0)

6.3 Admin Dashboard

(unchanged from v2.0)

6.4 Retention Engine (automated)

(unchanged from v2.0)

7. Architecture

7.1 High-level

(unchanged from v2.0 — same diagram)

7.2 Data model (key entities) — updated

Entity	Purpose	Key fields
Gym	A gym business	joinCode (unique)
Staff	Gym employees	gymId, role, email, passwordHash
Plan	What members can buy	priceKobo, durationDays, active
Member	A membership at one gym	gymId, phone, checkInCode, userId
MemberUser	A person's login	phone (globally unique)
OtpCode	Login codes	phone, codeHash, expiresAt
Subscription	A member's purchase	status, startDate, endDate
Payment	A transaction	status, method, orchPayTxnId, paymentLink
CheckIn	Every QR scan	allowed, reason
Reminder	Sent reminder records	@@unique([subscriptionId, kind])
Workout	A logged workout	userId, date, durationMin
WorkoutExercise	One exercise in a workout	workoutId, exerciseId, name, order
WorkoutSet	One set	exerciseId, order, reps, weightKg
WorkoutSnapshot	Legacy local-data backup	userId (unique), data, sizeBytes
7.3 Subscription lifecycle

(unchanged from v2.0)

7.4 Payment flows

(unchanged from v2.0)

7.5 Workout log — server-backed with offline queue (rewritten)

Workouts live in Postgres, owned by MemberUser (not Member) so universal users with no gym can still track.

Schema:

prisma
model Workout {
  id          String            @id @default(cuid())
  userId      String
  user        MemberUser        @relation(...)
  date        DateTime
  durationMin Int
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  exercises   WorkoutExercise[]
  @@index([userId, date(sort: Desc)])
}

model WorkoutExercise {
  id         String       @id @default(cuid())
  workoutId  String
  workout    Workout      @relation(..., onDelete: Cascade)
  exerciseId String
  name       String
  order      Int
  sets       WorkoutSet[]
  @@index([workoutId])
  @@index([exerciseId])
}

model WorkoutSet {
  id         String          @id @default(cuid())
  exerciseId String
  exercise   WorkoutExercise @relation(..., onDelete: Cascade)
  order      Int
  reps       Int
  weightKg   Float
  @@index([exerciseId])
}
Write path (with offline queue):

text
User taps Finish
  ↓
POST /api/app/workouts  (immediate attempt)
  ↓ success → workout appears in list
  ↓ failure (network) → queued in IndexedDB
                        retried on next app open / resume / network restore
  ↓ failure (4xx) → surfaced to user, not queued
Read path:

text
Screen mounts
  ↓
GET /api/app/workouts
  ↓ success → render
  ↓ failure → show "no connection" state
No local cache for reads. The server is the source of truth; a partial cache would create reconciliation problems. The queue exists only for writes.

"Last time" hints: computed server-side via GET /api/app/workouts/last/:exerciseId. Returns the most recent session containing that exercise, so the app can show "Last time: 60kg × 10" and suggest a next weight.

8. User Journeys

(unchanged from v2.0, with one note: the "Daily workout" journey now saves to the server, or queues offline, instead of writing to localStorage)

9. Technology Stack — updated

Layer	Choice	Reason
Backend	Express + TypeScript (ESM)	Mature, flexible
ORM	Prisma	Type-safe, great migrations
Database	PostgreSQL	Relational integrity for money + subscriptions + workouts
Auth	JWT (two token types)	Stateless, separates staff and member
Validation	Zod	Shared schemas between API and clients
Payments	Orch-Pay	Own orchestrator
Messaging	Termii	SMS + WhatsApp for Nigeria
Scheduled jobs	node-cron	Simple, in-process
Admin frontend	React + Vite + Tailwind	Fast, modern
Member app	React + Vite + Tailwind + Capacitor	Web tech wrapped as native Android APK
Fitness data	Postgres (server-backed)	Multi-device, safe, AI-ready
Offline writes	IndexedDB via idb	Persists across app kills; small
Charts	Recharts	Lightweight, React-native-friendly
Exercise data	In-repo TS file	Simple, no API needed
10. Project Structure

(unchanged from v2.0, with these additions)

text
apps/member/src/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── backup.ts            # legacy cloud backup (safety net)
│   ├── cache.ts             # local cache for membership data
│   ├── exercises.ts
│   ├── format.ts
│   ├── pay.ts               # in-app browser for payments
│   ├── workoutQueue.ts      # IndexedDB write queue
│   └── workouts.ts          # server-backed workout API client
├── components/
│   ├── RestTimerPill.tsx
│   └── ...
└── pages/...

apps/api/src/
├── services/
│   ├── workouts.ts          # workout CRUD + last-performance
│   └── workoutSnapshots.ts  # legacy snapshot endpoints
└── routes/
    └── app.ts               # includes /workouts/* endpoints
11. Current Status — rewritten

Shipped

Platform:

✅ Multi-tenant backend (Express + Prisma + Postgres)
✅ Two-token auth (staff / member)
✅ Role-based access control
✅ Zod validation on all inputs
✅ Central error handler
✅ CORS configured for local dev + ngrok
✅ Webhook signature verification (HMAC-SHA256)
Admin Dashboard:

✅ Register + login
✅ Dashboard with revenue, members, expiring, check-ins
✅ Members CRUD + search + filters + detail page
✅ Plans CRUD
✅ Payments (cash/transfer/POS/online link)
✅ QR check-in with allowed/refused logging
Member App — Universal:

✅ Phone + OTP authentication
✅ Home with streak hero, today's workout, week strip, quick actions
✅ Server-backed workout logging
✅ Progressive overload hints ("Last time: 60kg × 10" + next-weight suggestion)
✅ Rest timer (90s / 180s by compound)
✅ Repeat last workout
✅ Personal record detection with celebration
✅ Weight tracking + charts (weight, weekly volume, per-lift progression)
✅ Exercise library (27+ exercises, filterable)
✅ Streaks
✅ Find gyms (join code + nearby directory)
✅ Invite my gym via WhatsApp
Member App — Gym-Connected:

✅ Multi-gym membership list
✅ Membership detail + QR code
✅ In-app renewal (Orch-Pay via in-app browser)
✅ Join a gym flow
✅ QR check-in with offline cache
✅ Bottom nav (Home, Workout, Progress, Profile)
Member App — Infrastructure:

✅ Offline write queue (IndexedDB; retries on network restore)
✅ Cloud backup endpoint (legacy safety net)
✅ Android APK built and running
Retention:

✅ Hourly expiry job
✅ Daily WhatsApp reminders (7/3/1/expired)
✅ Idempotent reminder sending
In progress

Member App:

🟡 Workout templates — UI exists, storage still local; moving to server next slice
🟡 Progress page — weight charts work; needs to be reconciled with the new API-backed data flow
🟡 Migration of pre-existing localStorage workouts to the server (one-time task)
Pending

Member App:

❌ Onboarding questionnaire
❌ Workout plan templates ("Week 2 of 12" programs)
❌ "Today's Workout" driven by a plan
❌ Nutrition / food logging
❌ Goals tracker ("Lose 5kg in 8 weeks")
❌ Body measurements
❌ Progress photos
❌ AI workout plan generation
❌ AI weekly recap
❌ AI coach chat
❌ Push notifications (FCM)
❌ Community / friends feed
❌ Trainer chat
Admin Dashboard:

❌ Churn risk list ("members who haven't checked in for X days")
❌ Attendance analytics (trends, peak hours)
❌ Trainer management
❌ Class scheduling
Platform:

❌ Referral system
❌ Multi-branch support
❌ Equipment tracking
❌ Advanced analytics
❌ Multi-device sync (partially solved by server-backed data; full merge/conflict logic pending)
12. Roadmap — rewritten

Phase 1 — Ship the Member App ✅ (Done)

✅ Mobile UI (React + Capacitor → Android)
✅ Screens: Login, Verify, Home, Workout, LogWorkout, Progress, FindGyms, Membership, QR, Renew, Profile
✅ Bottom nav
✅ Invite my gym via WhatsApp
✅ Android APK build
Phase 2 — Fitness Foundations ✅ (Done)

✅ Progressive overload hints
✅ Rest timer
✅ Repeat last workout
✅ PR detection
✅ Charts (weight, volume, strength)
Phase 3 — Server-Backed Fitness 🟡 (In progress)

✅ Workout models (Workout, WorkoutExercise, WorkoutSet)
✅ Workout API endpoints
✅ IndexedDB write queue
✅ Home + Workout + LogWorkout + WorkoutDetail on server
🟡 Templates + PRs on server
🟡 Weight entries + stat endpoints on server
⏳ Migration of pre-existing localStorage data
Phase 4 — Plans + Onboarding (Next)

Onboarding questionnaire (goal, experience, equipment, days/week)
5 workout plan templates
"Today's Workout" card driven by a plan
Week tracker ("Week 2 of 8 · 3/4 done")
Plan progression
Phase 5 — Nutrition

Daily calorie + protein targets
Meal logging
AI photo logging (Nigerian food bias)
Water tracker
Weekly nutrition summary
Phase 6 — AI + Community

AI workout plan generation
Weekly AI recap
AI coach chat
Friends feed (gym-scoped)
Challenges and leaderboards
Referral system
Churn risk dashboard (admin)
Phase 7 — Network Effects

Real gym directory improvements
Class scheduling
Trainer chat
Equipment tracking
Phase 8 — Bigger Vision

Gym Pass (pay once, use any gym)
Portable fitness identity
Trust layer (reviews, escrow, disputes)
Expand to adjacent verticals
13. Success Metrics

(unchanged from v2.0)

14. Business Model

(unchanged from v2.0)

15. Guiding Principles — updated

Multi-tenant from day one. Every gym-owned table carries gymId.
Money in kobo. Integers only. No floating point.
Idempotency everywhere. Assume every operation will be retried.
Webhooks over redirects. Never trust the browser.
Two identities per person. Login (MemberUser) and membership (Member) are separate.
Soft deletes for anything that's been sold. Plans, staff.
Claim first, send second. Prevent duplicate reminders and payments.
Constant-time comparisons. For OTP hashes and webhook signatures.
Fire-and-forget notifications. A failed SMS never breaks a payment.
Isolate data by default. Staff of one gym can never see another gym's data.
Universal first, gym-connected second. The app must be useful to anyone.
Server is the source of truth. All data lives in Postgres. The client is a view.
Offline writes via queue, not cache. Reads require a connection; writes queue in IndexedDB until the network returns.
Slices, not big bangs. Ship one capability end-to-end before starting the next.
16. What Makes This Different

(unchanged from v2.0)

17. Do We Have Products Like This in Nigeria?

(unchanged from v2.0)

18. Getting Started (for developers) — updated

Prerequisites

(unchanged)

Setup

bash
git clone <repo>
cd gym-os
npm install

cp apps/api/.env.example apps/api/.env
# Set DATABASE_URL, JWT_SECRET, ORCHPAY_*, TERMII_*

cd apps/api
npx prisma migrate dev
npx prisma generate
npm run dev
Member app dependencies (added in v2.1):

bash
cd apps/member
npm install idb                       # IndexedDB wrapper for the write queue
npm install @capacitor/app@^7         # background flush + app state events
npm install @capacitor/browser@^7     # in-app browser for Orch-Pay
npm install recharts                  # charts
npx cap sync android
Important: Capacitor plugins must match your core version. If you're on @capacitor/core@7.x, install plugins as @capacitor/<plugin>@^7. Installing without the version pin grabs the latest major and breaks the peer resolution.

Building the Android APK

bash
cd apps/member
npm run build && \
  npx cap sync android && \
  cd android && \
  ./gradlew clean assembleDebug && \
  cp app/build/outputs/apk/debug/app-debug.apk ~/Downloads/gymos-debug.apk && \
  cd ..
Environment variables

(unchanged from v2.0)

19. Open Questions — updated

Brand name — "Gym OS" is descriptive but generic. Candidates: Rep, Lift, Loop, Kora, Kele, Iko.
AI provider — OpenAI, Anthropic, or a mix?
Push notifications — Firebase Cloud Messaging vs. Termii-only?
Gym directory — build vs. buy (Google Places API)?
Gym Pass — when to launch? Which city first?
Multi-branch — one gym account with branches, or separate accounts?
~~Workout sync~~ — answered: server-backed as of v2.1, with IndexedDB write queue for offline
Data migration — when to force existing users to migrate their old localStorage workouts? Wipe or migrate?
20. Glossary

(unchanged from v2.0, with these additions)

Term	Definition
Write queue	IndexedDB-backed retry inbox for writes that fail due to network
WorkoutSnapshot	Legacy JSON backup of pre-migration local data
Server-backed	Data lives in Postgres; the client fetches it
Slice	One capability shipped end-to-end before starting the next
21. Summary — updated

Gym OS is a fitness platform for Nigeria with two connected products:

A universal fitness app — anyone can use it for workouts, streaks, progress, and finding gyms
A gym operating system — gym owners get a dashboard; their members get membership features unlocked in the app
One backend. One identity. Two audiences. Real value on both sides.

Shipped:

Multi-tenant platform
Admin dashboard (payments, members, check-ins, retention)
Member app (Android APK) with universal + gym-connected features
Server-backed workouts with offline write queue
Progressive overload, rest timer, PR detection, charts
Automated retention engine
Next:

Templates + PRs on the server
Weight entries + stat endpoints on the server
Onboarding + workout plans ("Today: Push Day")
Nutrition (calories, protein, meals)
AI (plan generation, photo logging, weekly recap, coach chat)
The endgame:

Every gym in Nigeria uses Gym OS
Every gym-goer has one login
The app becomes the fitness identity layer for Nigeria
Gym Pass (pay once, use any gym) becomes the consumer product
Portable identity + trust layer — the fitness infrastructure for Nigeria
Nobody has built this. You're building it now.

