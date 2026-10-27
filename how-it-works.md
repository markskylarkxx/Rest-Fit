Gym OS — Product Document v3.0

Last updated: October 2026
Status: Core product shipped. Two apps live. AI plan generation working.
Purpose: A single source of truth so we don't get lost.

Part 1 — What Gym OS Is

In one sentence:

Gym OS is the Nigerian fitness app that anyone can use for workouts, streaks, and progress — and that unlocks membership management, QR check-in, and multi-gym support when your gym joins the platform.
Two products, one backend:

Member App (React + Capacitor, ships as Android APK) — for gym members and universal fitness users
Admin Dashboard (React + Vite) — for gym owners, staff, and trainers
Backend (Express + Prisma + Postgres) — the invisible platform connecting them
Who uses it:

User	App	Sign-in	Why
Gym owner / staff	Admin web	Email + password	Run the gym: members, payments, check-ins
Gym member	Mobile app	Phone + OTP	Track workouts, check in, manage membership
Universal user (no gym)	Mobile app	Phone + OTP	Track workouts, streaks, progress
The insight: A universal fitness app that becomes more valuable when your gym joins. Everyone can download and use it. When their gym signs up, membership features unlock.

Part 2 — The Core Concepts

You must never lose track of these three distinctions.

Concept 1 — Training Plan vs. Workout Log

Training Plan = what the coach says to do.

"Today: Push. Bench Press, OHP, Dips, Triceps. 3×10 each."
Lives in tables: TrainingPlan, TrainingPlanWeek, TrainingPlanDay, TrainingPlanExercise
Doesn't know or care what you actually did
Assigned via UserTrainingPlan enrollment — tracks "Week 2, Day 3"
Workout Log = what you actually did.

"Bench Press: 3 sets of 8 at 62.5kg"
Lives in tables: Workout, WorkoutExercise, WorkoutSet
Doesn't know or care what the plan said
Every workout is a real record, timestamped
They connect when you tap "Start today's workout" from the plan. The logger opens pre-filled from the plan. You fill in what you actually lifted. Finish. Two things happen: the workout is saved AND the plan advances.

They never merge. The plan is a suggestion. The log is a fact.

Concept 2 — Member vs. MemberUser

Member = a membership at one gym. Carries gymId. Has a check-in code, a subscription history, payments.
MemberUser = a login. Identified by phone. One login can have many Member rows (one per gym).

This is why the app supports multi-gym. One phone number, many memberships. Each gym sees its own members.

Concept 3 — Universal vs. Gym-Connected Layers

Universal: workouts, streaks, progress, weight, PRs, templates, training plans (preset + AI). Works for anyone.
Gym-connected: membership status, QR check-in, in-app renewal, payment history, multi-gym. Works only if your gym is on Gym OS.

The universal layer must always work. If it doesn't, nobody downloads the app. If nobody downloads the app, no gym wants to join.

Part 3 — What's Actually Built

Backend (apps/api)

Stack: Express + TypeScript (ESM) + Prisma + PostgreSQL + Zod + JWT

Auth: Two token types.

Staff: typ: "staff", 12h session, email + password
Member: typ: "member", 30d session, phone + OTP
Core routes:

/api/auth/* — staff register + login
/api/staff/* — staff management
/api/plans/* — gym membership plans (distinct from training plans)
/api/members/* — member CRUD + search
/api/payments/* — record cash/transfer/POS, generate online links
/api/checkins/* — QR scan + allowed/refused logging
/api/dashboard/* — revenue, expiring, activity, at-risk
/api/webhooks/* — Orch-Pay settlement (signature-verified)
Member app routes (/api/app/*):

Auth: OTP send, verify
Gyms: lookup, nearby, join
Memberships: list, detail, renew
Workouts: list, create, delete, last-performance
Templates: CRUD
PRs: list (auto-computed on workout create)
Weight: list, add, delete
Stats: volume by week, exercises logged, best set per lift
Training plans: list, detail, enroll, current, complete-day, quit, generate (AI)
Backup: snapshot save/restore
Jobs (node-cron):

Hourly: expire lapsed subscriptions
Daily 9 AM Lagos: WhatsApp reminders (7/3/1 days + expired)
Admin Dashboard (apps/admin)

Register + login (email/password)
Dashboard: revenue, active members, expiring this week, check-ins today, recent activity
Check-in: QR scanner with big green/red result
Members: CRUD, filters, detail pages with full history
Plans: gym membership plan CRUD
Payments: record + online link + filters
Staff: role-based management
At-Risk: members who haven't checked in but have been training on the app
Member App (apps/member)

Screens:

Login (phone) → Verify (OTP) → Onboarding (experience level)
Home: streak hero, plan card, quick actions, week strip, gym card
Plans: picker (5 presets + AI) → detail → generate (4-question AI flow)
Workouts: list, log, detail
Progress: weight chart, volume chart, strength per lift
Find gyms, join gym, membership detail, QR, renew
Profile: phone, experience level, training plan, sign out
Local data: offline write queue (IndexedDB) for workout logs. Everything else server-backed.

Experience levels:

BEGINNER → Move screen (walk, run, dance), green hero, gentle copy
INTERMEDIATE / EXPERIENCED → Strength logger, orange hero, standard copy
Changeable in Profile. App reshapes instantly.
AI Plan Generation

Backend: Groq SDK, tool-calling pattern.

Model: openai/gpt-oss-120b
Tool schema uses JSON Schema semantics: type: ["X", "null"] for nullable fields (Groq rejects OpenAI's nullable: true)
max_tokens: 32000
Plans capped at 4 weeks to stay within token budget
Bodyweight plans allow targetReps up to 100 (progressive overload without weight)
Flow: 4 questions → 5 seconds → plan written to DB → user auto-enrolled → Home shows "Today: [Day 1]"

Cost: ~$0.005 per plan.

Part 4 — The Flows

Flow A — New user, no gym

Download APK → enter phone → OTP
Onboarding → pick experience level
Home shows "Choose a training plan"
Pick a preset OR build one with AI
Home shows "Today: [Day 1]"
Tap → logger opens pre-filled → fill in what you did → Finish
Plan advances. Workout saved. Streak +1.
Log weights in Progress. See charts.
No gym required. Ever. The app works from day one.

Flow B — Walk-in member (staff adds first, member claims)

Walks into Iron Gym, pays cash
Staff adds them in admin dashboard (name, phone)
Member row created with userId: null
Member downloads app → enters same phone → OTP
System claims the existing Member row (links userId)
Home shows the membership + all gym features
Flow C — Member joins a gym

User has the app already
Gets a join code from the gym
Taps Gyms → enters code → sees plans → pays online
Membership activates on webhook
QR check-in unlocks
Flow D — Daily workout

Open app. Home shows "Today: Push"
Tap. Logger opens with plan's exercises
Fill in reps/weight. Tap Finish.
Workout saved. Plan advances. Streak updates.
Flow E — Rest day

Open app. Home shows "Rest day. You've earned today off."
Shows: "Yesterday: Full Body A — done yesterday. Next workout: Full Body B."
No action. Close app.
Flow F — Gym check-in

Walk into gym. Open app.
Tap QR. Full-screen QR appears.
Front desk scans.
Green (allowed) or red (refused with reason).
Check-in logged.
Flow G — Renewal

3 days before expiry, WhatsApp reminder arrives.
Open app → Home shows "3 days left."
Tap Renew → pick plan → pay via Orch-Pay.
Webhook activates. New subscription stacks.
Flow H — Gym owner checks at-risk members

Owner logs into admin dashboard.
Clicks "At-risk" in sidebar.
Sees: 3 members "training elsewhere," 5 members "lapsed," 2 "never started."
Each row: last check-in, last workout, suggested WhatsApp message.
Taps "WhatsApp" → sends the message.
Part 5 — What's Next

Three big slices. Do them in this order.

Next Up — Slice 8: Landing Page

What: Public marketing site that explains Gym OS and captures gym owner sign-ups.
Why: You have a working product nobody can see. It's the bridge to real users.
Effort: 3–5 days.
Deliverables:

Hero explaining Gym OS in one sentence
Screenshots of member app + admin dashboard
Features section
"Sign up your gym" form
"Download the app" button
Pricing table
Footer with contact
Then — Slice 6: Nutrition

What: Calorie and protein tracking with AI photo logging.
Why: It's 60% of body composition and no Nigerian app does it well.
Effort: 2–3 weeks.
Deliverables:

Daily calorie + protein goal
Manual meal logging
AI photo logging — snap plate → get macros → confirm → logged
Nigerian food bias in the AI
Daily totals: "1,850 / 2,400 kcal · 90 / 130g protein"
Weekly nutrition summary
Then — Slice 9: Real-World Testing

What: Put the APK in real users' hands.
Why: Every feature is based on our assumptions. Real usage reveals which are wrong.
Effort: Ongoing.
Deliverables:

5 gym owners using the admin dashboard
50+ gym-goers using the member app
Weekly feedback loop
Fix what breaks
Later — Slice 7: Community

What: Social features scoped to the gym.
Why: Retention multiplier.
Effort: 3 weeks.
Deliverables:

Gym-scoped activity feed
Friends by phone number
Challenges ("Iron Gym vs Titan Gym, November")
Leaderboards
Eventually

Push notifications (Firebase)
Referral system
Trainer chat
Class scheduling
Gym Pass (pay once, use many gyms)
Portable fitness identity across gyms
Trust layer (verified gyms, reviews)
Part 6 — Guiding Principles

Never violate these. They're load-bearing.

Universal first, gym-connected second. The app must be useful without a gym.
Server is the source of truth. All data lives in Postgres.
Offline writes via queue, not cache. Reads require a connection; writes queue locally.
Plan is a suggestion. Log is a fact. Never confuse them.
Money in kobo. Integers only. No floating point.
Idempotency everywhere. Every state-changing operation retries safely.
Webhooks over redirects. Never trust the browser for payments.
Two identities per person. Login (MemberUser) and membership (Member) are separate.
Multi-tenant from day one. Every gym-owned row carries gymId.
Never claim a date you can't back up. If the app doesn't know when something happened, don't say "Yesterday."
Ship slices, not big bangs. One capability end-to-end, then next.
No gimmicks. If a feature doesn't solve a real problem, don't build it.
Part 7 — What Exists in Nigeria

You've asked this. Here's the answer to keep in mind.

Exists:

FirstRep — B2B gym software, retention focus
GymLinx — B2B gym management, member app for one gym
Ahead Fitness — single-gym app in Abuja
PayGYM — gym pass model (100 gyms across 4 states)
Global apps — Strava, MyFitnessPal, Fitbod (no Nigerian gym integration)
Does NOT exist:

Universal app + gym OS in one. Nobody has both sides.
AI plan generation for Nigerian users. Nobody.
Multi-gym member identity. One login, many gyms. Nobody.
At-Risk with workout context. Requires a universal app feeding the gym dashboard. Nobody can build it without your architecture.
First Rep mode. Nobody differentiates app behavior by experience level.
Your space is real.

Part 8 — The Pitch (for whenever you need it)

To gym owners:

Your members stop showing up. You find out too late. Gym OS tells you who's drifting — and why. Automated WhatsApp reminders. Churn alerts. A dashboard that shows you what's actually happening. Plus, your members get a fitness app they'll actually use. They win. You win. ₦20k–₦50k per month.
To members:

Free workout tracking, streaks, progress, and a fitness coach in your pocket. AI builds you a plan that fits your life. Track what you lift, see yourself get stronger. All free. If your gym is on Gym OS, manage your membership too — check in, renew, see your history. One app. Every gym.
To investors (if you ever pitch):

Gym OS is Nigeria's fitness identity layer. A universal app that becomes more powerful when a gym joins. We're building infrastructure — not just another fitness tracker. The unit economics work: a gym owner saves ₦80k/month from reduced churn and pays ₦30k. Our AI plan generation costs $0.005 per user. We're the only platform in Nigeria that connects the member's fitness life to their gym memberships.
Part 9 — Where We Are Right Now

Shipped and working:

Multi-tenant backend with dual-token auth
Full member app: onboarding, workouts, plans, PRs, weights, gym features
Full admin dashboard: members, payments, check-ins, retention, at-risk
AI plan generation via Groq
Server-backed workout log with offline queue
Automated retention engine (hourly expiry, daily WhatsApp)
5 preset training plans with ~44 weeks of structured programming
Charts and stats for progress tracking
The product works end-to-end. You can:

Sign up as a member, pick or generate a plan, log workouts, see progress
Sign up as a gym owner, add members, record payments, check people in, see at-risk members
Generate an AI training plan in 5 seconds
Nothing critical is broken. Every known bug is either fixed or documented.

Part 10 — How to Not Derail

Three rules.

Rule 1 — Don't build features for problems you haven't seen.

Before adding a new feature, answer: "Which real user asked for this, and what did they actually say?" If you don't have an answer, put it in Part 5 and move on.

Rule 2 — Ship the next slice before starting another.

Right now: the next slice is the landing page. Don't start nutrition before the landing page is live. Don't start community before nutrition is shipped. One at a time.

Rule 3 — Real users trump every roadmap.

Part 5 is your plan. But if a real gym owner tells you something breaks, that becomes the priority. The roadmap serves the users, not the other way around











*************************
Step 5 — Rebuild the APK.


cd /Users/kenechukwumark/My\ Apps/gym-os/apps/member
npm run build
npx cap sync android
cd android && ./gradlew clean assembleDebug

Step 6 — Install on your phone.


cp app/build/outputs/apk/debug/app-debug.apk ~/Downloads/restfit-debug.apk



Buy the Domain (myrestfit.com). Do this today.
Point the Domain to your Vercel Landing Page and your Render API.
Create the LinkedIn Page on your computer (not the Android app) and add your logo.
Upgrade Render to $7/mo before you show the product to a real gym owner.