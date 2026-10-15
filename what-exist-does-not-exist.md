What exists in Nigeria right now

1. Gym management software (the B2B dashboard + member app)

FirstRep: This is the closest competitor. They are based in Lagos and focus on "AI-powered customer retention & gym management software." They help gyms manage members, reduce churn, and have member messaging and leaderboards. They pivoted from B2C to B2B. 
GymLinx: Another modern gym management system starting in Nigeria. It gives gyms a management dashboard and a member mobile app for memberships, bookings, and payments. They are actively building with gym owners. 
Ahead Fitness: A single gym in Abuja with its own member app. It handles class bookings, progress stats, and loyalty points. It's an "isolated to one gym" app. 
PayGYM: This is a Gym Pass model. They partnered with 100 gyms across Nigeria (Lagos, Abuja, Rivers, Delta) to offer a single membership that works at multiple partner gyms. This is the closest thing to the "Gym Pass" endgame you described. 
2. General fitness apps (the universal workout tracker)

The top health and fitness apps in Nigeria are mostly global apps or niche trackers. The top free charts include apps for blood pressure, step counting, period tracking, and home workouts (many by Chinese and global publishers). 
Strava, Google Health (Fitbit), Yazio, Foodvisor, and Fitbod are all in the top-grossing charts in Nigeria. 
There are local fitness apps like Tam (territory-based walking/running) and VerveLife (fitness + payments), but they are not focused on gym memberships or strength training. 
What does NOT exist (your space)

The combination you are building does not exist in Nigeria:

❌ A universal fitness app that connects to gyms. The global apps (Strava, Fitbod) don't have gym membership features. The local gym apps (FirstRep, GymLinx) are B2B tools with member apps that only work for that specific gym.
❌ A multi-gym member app with one login. You can have memberships at 2-3 different gyms and manage them all in one app. Nobody has built this. PayGYM is a pass, not a multi-gym membership manager. 
❌ A B2B dashboard that unlocks features in a universal B2C app. GymLinx and FirstRep are B2B. Their member apps are a feature of their gym software, not a standalone consumer product that works for anyone. 
❌ Automated retention at scale. FirstRep talks about reducing churn, but your WhatsApp reminder engine (7/3/1 days + expired) is a specific, automated workflow that is not standard in the market. 
The bottom line

You are building in a real market, and there is competition for specific pieces.

FirstRep and GymLinx are your direct competitors for the B2B gym software play. They are focused on the same pain points (churn, manual tracking, payments) that you described.

PayGYM has validated the Gym Pass model by signing up 100 gyms in four months. 

But nobody is building the specific thing you are building: a universal fitness app that anyone can use, which becomes more powerful when you connect your gym, and which gives gym owners a dashboard to reduce churn through automated reminders.

You have the space. Now you have to prove the product. The core features you have built (server-backed workouts, progressive overload, offline queue, retention engine) are exactly what separates a real product from a thin layer over a spreadsheet.




**************
next
PART B — First Rep mode

The emotional differentiator. New users pick their experience level, and the app changes shape based on the answer.

BEGINNER → Home becomes gentler, Workouts becomes "Move," the exercise library is filtered to beginner-friendly movements, and copy is encouraging.

INTERMEDIATE / EXPERIENCED → what you already have.



*********************
PART C — At-Risk Members dashboard

The B2B killer feature. A gym owner sees members who haven't checked in recently, but have logged workouts on Gym OS. They're not gone. They're training elsewhere. The owner can reach out with the right message.

This is the feature no other gym software in Nigeria can build, because they don't have a universal fitness app feeding them data.

****************************************
Part 1: The differentiation — honest answer

Yes, FirstRep exists. Yes, they're in Nigeria. Yes, they've pivoted to B2B. But what you're building is fundamentally different. Let me show you exactly where.

What FirstRep actually is

FirstRep started as a fitness app and pivoted to B2B gym management with AI. Today they offer:

Gym management (members, churn insights, leaderboards)
AI coach called "Jemila" that reaches out to inactive members
A marketplace where personal trainers get discovered and booked
AI agent "Rep" with 109 tools that builds programs, manages clients, handles billing
Progress tracking with body measurements, photos, PRs
They are trainer/coach-first, not gym-first
Their core pitch: "Stop doing it all yourself." They sell to personal trainers and coaches who manage clients. The gym tools came later as an extension.

What Gymly is

Gymly is a Chilean startup (not Nigerian) that raised no funding, operates in Chile and Peru, and has 200 users in pilot. Their model is standard gym SaaS: member management, class scheduling, payments, check-in. Nothing AI-native. Nothing Nigerian. They're 3–5 years behind where you are in terms of product depth.

Where you are genuinely different

1. You're gym-first, not trainer-first.

FirstRep sells to trainers. Their whole language is about coaching clients. Gym OS sells to gym owners — the person who owns the building, hires staff, and needs to know who's about to churn. That's a different buyer, different pain, different sale.

2. You have the "Training Elsewhere" insight.

This is your killer feature. When a member stops checking in, FirstRep tells the gym they're inactive. You tell the gym whether they're still training on the app somewhere else. A member who logs 3 workouts on RestFit this week but hasn't scanned in at Iron Gym is not a churn risk — they're training elsewhere. That's a completely different retention conversation.

No other Nigerian gym software can build this because none of them have a universal consumer app feeding them data.

3. AI plan generation that members actually use.

FirstRep's AI builds programs for trainers to assign to clients. Your AI builds programs directly for members who have no trainer. A gym-goer with no coach answers 4 questions and gets a 4-week plan. That's the universal layer no competitor has.

4. The "I'm interested" WhatsApp button.

You built this today. Nigerian gym owners live on WhatsApp. FirstRep's funnel is a form and a marketplace. Yours is a one-tap conversation that starts on the platform they already trust.

5. You have the split admin architecture.

FirstRep has one dashboard. You have three: public landing, gym dashboard, platform admin. That separation isn't just cleaner — it's product maturity. Gym owners see only their data. You see the whole forest. Nobody does that at your stage.

The honest risks

FirstRep is funded and moving fast. They're hiring, shipping every week, and building AI agents with 109 tools. You're solo.
They have testimonials and users. You have zero. This is the only gap that matters.
They're already telling gyms to "talk to us". Their sales motion is the same as yours.
The bottom line

You are not building something that doesn't exist. FirstRep exists. But you are building something different enough to win a specific segment:

Gyms that want a member-facing fitness app, not just a management tool. A gym where members use RestFit to track workouts independently — even on days they don't come to the gym — has data no competitor can match.
Gym owners who want to have a WhatsApp conversation, not fill a form. Your "I'm interested" button is a wedge.
The At-Risk insight. "Training elsewhere" is genuinely novel. Nobody else can build it.
Your differentiation isn't the feature list. It's the architecture: universal consumer app feeding a B2B retention engine. That's what FirstRep doesn't have because they started as a trainer tool.

App	Local port	Production domain	Job
apps/api	4000	api.myrestfit.com	The backend. Every app talks to it.
apps/member	5173	(Android APK)	The fitness app for gym-goers
apps/admin	5173	app.myrestfit.com	The dashboard for gym owners
apps/platform	5174	admin.myrestfit.com	NEW — the internal tool for you
apps/landing	5175	myrestfit.com	The marketing site





THE PLAN*******

Phase 1 — Gym detail page (this message)
Phase 2 — Subscriptions & billing (next message)
Phase 3 — Platform At-Risk gyms
Phase 4 — Leads CRM
Phase 5 — Waitlist management
Phase 6 — Analytics dashboard
Phase 7 — Communication log
Phase 8 — Platform team + impersonate + audit log