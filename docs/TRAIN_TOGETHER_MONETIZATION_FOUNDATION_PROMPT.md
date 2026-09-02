# TRAIN TOGETHER — MONETIZATION FOUNDATION & SaaS BUSINESS MODEL
## Master implementation brief for coding agents

> **Baseline date:** 2026-09-02  
> **Baseline source:** `DOCUMENTACION_TECNICA(1).md`  
> **Purpose:** transform the existing private fitness/nutrition application into the architectural foundation of a scalable SaaS, without breaking current functionality.

---

# 0. AGENT MISSION

You are a senior product engineering team working directly on the existing **Train Together** repository.

The application already contains:

- React 19 + Vite 6
- TypeScript
- React Router
- Supabase Auth
- PostgreSQL
- RLS
- Supabase Realtime
- Training Strategy
- Manual Training
- Live Training
- Progress
- Couple/household-oriented functionality
- Food Library
- Recipes
- Food Log
- Meal Planner
- Grocery List
- Nutrition Insights
- ES/EN internationalization
- dark/glassmorphism/neon visual system
- Yarn
- seed/import scripts
- tests and build validation

The current technical baseline explicitly includes Nutrition, Food Log, Meal Planner and Grocery List, plus Realtime for fitness and nutrition entities. The updated documentation also identifies several existing technical improvements that should be addressed while introducing the monetization architecture.

**Do not create a parallel project.**

**Do not rewrite the application from scratch.**

**Do not replace working functionality unnecessarily.**

Your mission is to evolve the existing codebase into a SaaS-ready architecture.

---

# 1. PRODUCT VISION

Train Together is not merely:

- a workout tracker
- a calorie tracker
- a meal planner
- a grocery list
- a progress dashboard

The product should become:

> **A shared fitness and nutrition operating system for couples and households.**

The user should eventually be able to open the application and immediately understand:

- what they should train
- what they should eat
- what they already ate
- what they still need
- how they are progressing
- what their partner is doing
- what needs to be purchased
- what is planned for the rest of the week

The core product loop is:

```text
Strategy
  ↓
Plan
  ↓
Execute
  ↓
Log
  ↓
Analyze
  ↓
Coordinate
  ↓
Repeat
```

Across two domains:

```text
TRAINING
+
NUTRITION
```

and inside a shared household context:

```text
COUPLE / HOUSEHOLD
```

---

# 2. BUSINESS MODEL

The initial commercial model should be a **freemium SaaS**.

Use three visible tiers:

```text
FREE
PLUS
DUO
```

Do not create many confusing tiers in the first commercial iteration.

The strategic priority is:

> **DUO should be the flagship plan.**

The primary commercial unit should gradually shift from:

```text
individual user
```

to:

```text
active household
```

because the product's strongest differentiator is shared planning.

---

# 3. BUSINESS POSITIONING

Do not market the product as:

> "Another workout tracker."

Do not market it primarily as:

> "Another calorie counter."

Position it as:

> **The shared fitness and nutrition system for couples.**

Possible positioning statement:

> Plan your workouts, organize your meals, stay on track and shop together — all in one place.

Core promise:

> **Open the app and know what you need to do today.**

Secondary promise:

> **Make consistency easier by removing daily decision-making.**

---

# 4. COMMERCIAL PRINCIPLES

Follow these principles:

1. Free must be genuinely useful.
2. Premium should unlock depth and automation, not basic usability.
3. Do not artificially limit fundamental actions to force payment.
4. Do not charge per workout.
5. Do not charge per meal.
6. Do not charge per food.
7. Do not charge per recipe.
8. Do not introduce ad-based monetization in the initial product.
9. Avoid paid external APIs unless there is no reasonable alternative.
10. Never delete a user's historical data after downgrade.
11. Entitlements must be enforced server-side as well as in UI.
12. Billing providers must not become part of business-domain logic.
13. Pricing must be changeable without rewriting the product.
14. Mobile subscriptions must be compatible with App Store / Google Play rules.
15. Do not make the architecture dependent on a single billing provider.

---

# 5. INITIAL PRICING HYPOTHESIS

Treat these numbers as **initial pricing hypotheses**, not immutable business facts.

Recommended starting hypothesis:

## FREE

```text
$0
```

## PLUS

```text
US$7.99/month
US$59.99/year
```

## DUO

```text
US$11.99/month
US$89.99/year
```

These values must be stored in configuration rather than scattered through the frontend.

The implementation must make it trivial to test future prices.

Do not hardcode prices directly inside components.

---

# 6. FREE PLAN

The free tier must let users understand the product before paying.

Include:

### Account

- Google login
- profile
- one household
- partner invitation

### Training

- basic workouts
- Live Training
- manual logging
- limited historical analytics

### Nutrition

- food catalog
- food logging
- basic nutrition targets
- limited meal planning
- limited recipes

### Household

- partner connection
- basic shared progress
- basic grocery functionality

### Limits

Use limits primarily on:

- history depth
- advanced analytics
- number of saved plans
- automation
- advanced household planning
- advanced exports

Do NOT limit basic workout logging to a tiny number that makes the application useless.

---

# 7. PLUS PLAN

PLUS is intended for users who want the full experience individually.

Include:

### Training

- unlimited workouts
- unlimited history
- advanced analytics
- full PR history
- advanced progress comparisons
- exports

### Nutrition

- complete nutrition strategy
- complete meal planner
- unlimited recipes
- unlimited food logs
- advanced macro analytics
- planned vs actual analysis
- weekly planning

### Grocery

- multiple saved grocery lists
- longer planning horizons
- advanced aggregation

### Future integrations

Potential future premium features:

- Apple Health
- Health Connect
- wearable integrations
- advanced automation
- widgets
- smart planning

---

# 8. DUO PLAN

DUO is the flagship commercial product.

Its key phrase should be:

> **Built for two.**

The plan gives two users full premium access inside the same household.

Include:

- all PLUS functionality for both users
- shared household
- shared meals
- shared recipes
- shared grocery lists
- household planning
- couple progress
- shared activity
- coordinated weekly planning
- future couple-specific functionality

Do not make DUO simply "PLUS × 2".

The household features themselves are part of the value proposition.

---

# 9. FREE VS PLUS VS DUO — REFERENCE MATRIX

Use this as an implementation/business baseline and keep the actual configuration centralized:

| Feature | FREE | PLUS | DUO |
|---|---:|---:|---:|
| Google login | Yes | Yes | Yes |
| Profile | Yes | Yes | Yes |
| Household | 1 | 1 | 1 shared |
| Basic workout tracking | Yes | Unlimited | Unlimited |
| Live Training | Yes | Yes | Yes |
| Workout history | Limited | Full | Full |
| Advanced analytics | No | Yes | Yes |
| Food Library | Yes | Yes | Yes |
| Food Log | Yes | Unlimited | Unlimited |
| Recipes | Limited | Unlimited | Unlimited |
| Meal Planner | Limited | Full | Full |
| Grocery List | Basic | Full | Shared/Full |
| Couple Progress | Basic | Basic | Full |
| Shared Meals | Limited/No | No | Yes |
| Shared Recipes | Limited/No | No | Yes |
| Household Grocery | Basic | No | Yes |
| Advanced exports | No | Yes | Yes |
| Health integrations (future) | No | Yes | Yes |
| Mobile widgets (future) | Limited | Yes | Yes |

The exact limits must be controlled by entitlements.

---

# 10. FEATURE GATING ARCHITECTURE

DO NOT implement feature checks like:

```ts
if (plan === "duo") {
  ...
}
```

throughout the project.

Create a central entitlement system.

The application should conceptually expose:

```ts
can("advanced_analytics")
can("meal_planner")
can("household_grocery")
can("shared_meals")
can("export_progress")
```

or an equivalent strongly typed API.

UI components should query capabilities, not raw plan names.

---

# 11. ENTITLEMENTS

Create a domain such as:

```text
entitlements
```

Possible capabilities:

```text
training.basic
training.unlimited
training.live
training.history.full

nutrition.foodLog
nutrition.recipes
nutrition.mealPlanner
nutrition.advancedAnalytics

grocery.basic
grocery.advanced
grocery.household

couple.basic
couple.sharedPlanning
couple.sharedMeals

analytics.basic
analytics.advanced

export.basic
export.advanced

integrations.health
integrations.wearables

mobile.widgets
```

Do not implement every future entitlement immediately if unnecessary.

The system must be extensible.

---

# 12. PLAN CONFIGURATION

Create a central configuration object/service.

Example conceptual structure:

```ts
type PlanCode = "free" | "plus" | "duo"

type PlanConfig = {
  code: PlanCode
  monthlyPrice: number
  annualPrice: number
  features: string[]
  limits: Record<string, number | null>
}
```

The actual implementation may use database-backed configuration or typed application configuration.

The key requirement:

> Pricing and entitlements must not be hardcoded in page components.

---

# 13. USAGE LIMITS

Usage counters should exist only for meaningful limits.

Potential counters:

```text
recipes_created
saved_meal_plans
grocery_lists
history_window
exports
```

Avoid tracking every button click.

Prefer server-derived limits whenever feasible.

Do not let users bypass limits by modifying local state.

---

# 14. DOWNGRADE POLICY

This is mandatory.

When a user downgrades from PLUS/DUO to FREE:

- never delete historical data
- never delete recipes
- never delete workouts
- never delete food logs
- never delete grocery history
- never delete progress
- never destroy shared household data immediately

Instead:

```text
Premium creation capability
        ↓
restricted
```

while:

```text
Historical data
        ↓
retained
```

If the user upgrades again:

their previous data becomes available again.

---

# 15. SUBSCRIPTION STATES

Support at minimum:

```text
trialing
active
past_due
paused
canceled
expired
```

The exact mapping depends on billing provider.

Do not couple UI logic directly to provider-specific status strings.

Map provider status → internal subscription status.

---

# 16. SUBSCRIPTION DOMAIN

Create something similar to:

```text
subscriptions
```

Fields:

```text
id
household_id
provider
provider_customer_id
provider_subscription_id
plan_code
status
current_period_start
current_period_end
cancel_at_period_end
created_at
updated_at
metadata
```

The household is the preferred commercial entity for DUO.

---

# 17. BILLING CUSTOMER

Create an abstraction for billing customer identity.

Concept:

```text
billing_customers

id
household_id
provider
provider_customer_id
created_at
updated_at
```

Do not place provider customer IDs directly into profiles.

---

# 18. SUBSCRIPTION EVENTS

Create:

```text
subscription_events
```

for webhook auditing.

Fields:

```text
id
household_id
provider
provider_event_id
event_type
payload
created_at
```

Store only what is appropriate and safe.

Do not expose raw payment provider payloads to frontend.

---

# 19. BILLING PROVIDERS

## Web

Preferred provider:

```text
Stripe
```

But create a provider abstraction.

Concept:

```text
BillingProvider
```

with operations such as:

```text
createCheckoutSession()
createCustomerPortalSession()
cancelSubscription()
changePlan()
getSubscriptionStatus()
```

Do not make React components aware of Stripe internals.

---

# 20. WEBHOOKS

The source of truth for a paid subscription must be the verified backend/webhook flow.

Concept:

```text
Stripe
  ↓
Webhook endpoint
  ↓
Verify signature
  ↓
Normalize event
  ↓
Update subscriptions
  ↓
Recalculate entitlements
  ↓
Notify frontend through Realtime if useful
```

Never trust:

```text
"payment_success = true"
```

sent only from frontend.

---

# 21. MOBILE BILLING

The future mobile application should support:

- App Store subscriptions
- Google Play subscriptions

Do not assume Stripe alone is sufficient for native app subscription purchases.

Create a subscription abstraction that can eventually consume:

```text
web provider
mobile provider
```

A service such as RevenueCat may be evaluated later for mobile subscription orchestration.

Do not make RevenueCat mandatory in the current web implementation.

---

# 22. FUTURE MOBILE ARCHITECTURE

The current React web architecture must not make future mobile development unnecessarily difficult.

Future target:

```text
Shared Domain
      ↓
 ┌────┴─────┐
 │          │
 Web      React Native / Expo
```

Business logic should increasingly live outside page components.

Potential shared logic:

- nutrition calculations
- meal planning
- grocery aggregation
- analytics
- entitlement logic
- subscription abstraction
- types
- validation
- date utilities

---

# 23. GOOGLE AUTH

The public SaaS should use:

# Continue with Google

Use Supabase Auth's Google OAuth.

The old username/password/demo login should no longer be considered the commercial identity model.

For local/demo mode, maintain compatibility if useful for development, but make the production architecture Google-first.

---

# 24. GOOGLE AUTH FLOW

Expected flow:

```text
Landing
  ↓
Continue with Google
  ↓
Supabase OAuth
  ↓
auth.users
  ↓
profile
  ↓
household membership
  ↓
onboarding
  ↓
dashboard
```

Do not create a second custom authentication system.

---

# 25. HOUSEHOLD MODEL

The current database already has `couples` and `couple_members`.

The commercial architecture should evolve toward an explicit household abstraction.

Preferred conceptual model:

```text
households
household_members
```

The exact migration strategy must preserve existing data.

Do not break current couple records.

Possible compatibility approach:

```text
couples
    ↓
household-compatible representation
```

or:

```text
households
household_type = couple
legacy_couple_id
```

Choose the least destructive solution.

---

# 26. HOUSEHOLD MEMBERS

Use:

```text
household_members
```

with:

```text
household_id
user_id
role
joined_at
```

Roles can begin simply:

```text
owner
member
```

No need for a complex RBAC system.

---

# 27. HOUSEHOLD OWNERSHIP

The household should be the owner of shared resources:

- shared recipes
- grocery lists
- shared meals
- household events

An individual user owns:

- personal strategy
- personal training
- personal food logs
- personal body metrics
- personal private notes

---

# 28. PRIVATE VS SHARED DATA

This distinction is mandatory.

## PRIVATE

- private nutrition logs
- body weight
- private comments
- personal strategy
- private progress details

## HOUSEHOLD

- household recipes
- shared meals
- grocery lists
- household shopping
- shared activity
- couple summaries

Use explicit visibility fields where appropriate.

Do not infer visibility from "the other user".

---

# 29. RLS

Update RLS policies to use household membership.

Example conceptual rule:

```text
user can read own private data
OR
user can read resource explicitly shared with same household
```

For grocery:

```text
household member
→ read/write household grocery data
```

For private Food Log:

```text
owner only
```

unless explicitly marked household-visible.

---

# 30. EXISTING DOCUMENTATION ISSUES TO ADDRESS

The updated technical documentation identifies current limitations including:

- localStorage persistence of domain data
- fire-and-forget remote persistence
- simplified Realtime connectivity state
- full refresh after Realtime events
- partial strategy Realtime coverage
- possible duplicate events
- duplicated PR responsibility
- unused strategy versioning
- simplified couple inference
- lack of exactly-two enforcement
- limited drag/drop support
- manual Supabase types
- partial seed architecture
- no CI/CD/deployment declaration

These should not all become blockers.

However, the following MUST be corrected as part of this SaaS foundation if they affect account, subscription, household, or data integrity:

1. explicit household membership
2. generated Supabase types or a stronger typed contract
3. proper subscription authorization
4. reliable server-side entitlement checks
5. real Realtime connection state
6. no duplicate billing/domain events
7. robust persistence error state

The current technical documentation explicitly recommends moving from inferred couple identity toward explicit membership and improving Realtime/type safety.

---

# 31. ONBOARDING

Create a first-class onboarding system.

Flow:

```text
Google Login
  ↓
Welcome
  ↓
Choose primary goal
  ↓
Basic profile
  ↓
Create / Join Household
  ↓
Invite Partner
  ↓
Set Training Strategy
  ↓
Set Nutrition Strategy
  ↓
Plan First Week
  ↓
Generate First Grocery List
```

Do not force every step if the user wants to skip.

Use progressive onboarding.

---

# 32. ONBOARDING GOAL

The first session should lead the user toward the product's "aha moment":

> **"My week is already organized."**

At the end of onboarding, ideally show:

```text
YOUR WEEK IS READY

4 workouts
28 planned meals
15,400 planned kcal
1 grocery list
```

This should be one of the strongest product moments.

---

# 33. PARTNER INVITATION

Partner invitation is a core activation mechanism.

The first user should see:

```text
Train together
Invite your partner
```

Provide:

- shareable invite link
- invite code if useful
- copy button
- native share where supported

Do not require the first user to know the partner's email.

---

# 34. INVITATION FLOW

Concept:

```text
User A
  ↓
Create household
  ↓
Generate invitation
  ↓
Share
  ↓
User B opens link
  ↓
Google Login
  ↓
Accept household
  ↓
Both users connected
```

Handle expired/used invitations.

---

# 35. FREE HOUSEHOLD

Two free users should still be able to experience the household concept.

Do not make the entire couple feature invisible before payment.

Free should prove the value.

Premium should increase:

- depth
- automation
- history
- coordination
- analytics

---

# 36. MONETIZATION ACTIVATION

Track product activation.

Important events:

```text
signed_up
profile_completed
household_created
partner_invited
partner_joined
strategy_completed
first_workout_completed
first_meal_logged
first_recipe_created
first_meal_plan_created
first_grocery_list_generated
```

These events should be stored in an analytics/event system that does not expose personal/private data unnecessarily.

---

# 37. NORTH STAR METRIC

Primary candidate:

> **Weekly Active Households completing at least one meaningful planned action.**

Examples:

- workout completed
- meal completed/logged
- grocery action completed
- strategy updated

Track this at household level.

---

# 38. KEY BUSINESS METRICS

Track:

## Activation

```text
signup → profile complete
signup → household created
signup → partner joined
```

## Engagement

```text
WAU
MAU
WAH = Weekly Active Households
```

## Retention

```text
D7
D30
W8
```

## Monetization

```text
Free → Plus
Free → Duo
Trial → Paid
```

## Household

```text
invite sent
invite accepted
two-member household created
```

## Revenue

```text
ARPU
ARPH
MRR
ARR
churn
trial conversion
```

---

# 39. MOST IMPORTANT COMMERCIAL METRIC

Track:

# ARPH — Average Revenue Per Household

because DUO is expected to be the flagship product.

Do not optimize exclusively for individual ARPU.

---

# 40. LANDING PAGE — STRATEGIC CHANGE

The existing landing must evolve from a fitness-first presentation into the full Train Together value proposition.

It should communicate:

```text
TRAINING
+
NUTRITION
+
PLANNING
+
SHOPPING
+
TOGETHER
```

The landing should sell the **system**, not isolated features.

---

# 41. LANDING HERO

Recommended hero:

# TRAIN TOGETHER.
# GROW TOGETHER.

Supporting copy:

> Plan your workouts, organize your meals, stay on track and shop together — all in one place.

Alternative:

> Your training. Your nutrition. Your week. Together.

Primary CTA:

# Start for free

Secondary CTA:

# See how it works

Do not use aggressive "Buy now" messaging.

---

# 42. LANDING HERO VISUAL

Show the real product rather than generic fitness imagery.

Recommended composition:

```text
LEFT
Headline
Subheadline
CTA

RIGHT
Premium animated product preview
```

Preview can show:

```text
TODAY

Workout
Leg Day

Nutrition
1,820 / 2,200 kcal

Steps
8,432 / 10,000

Partner
María completed today's workout
```

Use the existing dark glass/neon purple aesthetic.

---

# 43. LANDING VALUE PROPOSITION

Create:

# Everything you need to stay consistent.

Four pillars:

### TRAIN

Plan and execute your workouts.

### EAT

Plan meals and track nutrition.

### PLAN

Turn goals into a real week.

### TOGETHER

Coordinate everything with your partner.

---

# 44. LANDING — THE BIG DIFFERENTIATOR

Create a dedicated section:

# Stop planning your life one day at a time.

Suggested copy:

> Train Together turns your goals into a weekly system. Know what to train, what to eat and what to buy before the week begins.

Visual:

```text
YOUR WEEK

Mon
Workout ✓
Breakfast ✓
Lunch ✓

Tue
Workout ✓
...

Grocery
12 items remaining
```

This is more differentiated than isolated feature cards.

---

# 45. LANDING — COUPLE STORY

Create:

# Better together.

Show two profiles and a shared household:

```text
FACUNDO
2,240 kcal
Workout complete

MARÍA
1,920 kcal
Meal plan complete
```

Shared:

```text
HOUSEHOLD

3 shared recipes
1 grocery list
4 shared meals
```

Do not present this as competition.

Use language around coordination and motivation.

---

# 46. LANDING — NUTRITION STORY

Create:

# Plan once. Follow the week.

Visual flow:

```text
WEEKLY MEAL PLAN
↓
RECIPES
↓
AUTOMATIC GROCERY LIST
```

Explain that the product is designed to reduce everyday decision fatigue.

---

# 47. LANDING — GROCERY STORY

Create:

# Know what to buy.

Visual:

```text
Chicken       1.8 kg
Rice          2 kg
Eggs          30
Milk          4 L

✓ Shared
✓ Organized
✓ Ready
```

Give this feature strong emphasis because it differentiates Train Together from ordinary fitness trackers.

---

# 48. LANDING — LIVE TRAINING

Keep the existing Live Training proposition.

Position it as:

> Your workout, one step at a time.

Show:

```text
SET 2 / 4

SQUAT
60 kg × 10

REST
01:23
```

---

# 49. LANDING — PROGRESS

Show:

- strength progression
- nutrition adherence
- step goals
- weekly consistency
- couple progress

Use animated but lightweight charts.

---

# 50. LANDING — PRICING

Add a pricing section.

Structure:

```text
FREE
For getting started

PLUS
For going all in

DUO
For doing it together
★ MOST POPULAR
```

Do not show a huge matrix on the landing.

Keep it simple and outcome-oriented.

---

# 51. LANDING — DUO EMPHASIS

The DUO plan should have stronger visual treatment.

Possible copy:

> **Everything you need. For both of you.**

Secondary:

> One plan. Two people. One shared week.

---

# 52. LANDING — FINAL CTA

End the landing with:

# Make consistency easier.

Copy:

> Start for free. Build your first week. Invite your partner. See what changes when everything is planned together.

CTA:

# Start for free

---

# 53. LANDING — AUTH CTA

The primary CTA should eventually lead to:

# Continue with Google

Avoid showing username/password in the public SaaS landing flow.

---

# 54. LANDING — SOCIAL PROOF FOUNDATION

Do not fabricate testimonials.

Prepare a structure for future:

- user quotes
- couple stories
- retention stats
- case studies

but do not insert invented social proof now.

---

# 55. LANDING — INTERNATIONALIZATION

All landing copy must support:

- Español
- English

No hardcoded marketing copy.

---

# 56. LANDING — PERFORMANCE

The landing should remain lightweight.

Use:

- CSS effects
- Framer Motion
- existing visual system
- optimized product previews

Avoid unnecessary external libraries.

---

# 57. PRICING PAGE

Create either:

```text
/pricing
```

or a pricing section within the landing.

Show:

- Free
- Plus
- Duo
- monthly/yearly toggle
- recommended plan
- core differences
- FAQ

---

# 58. PRICING COPY PRINCIPLES

Avoid:

> "Unlock everything!"

Prefer outcome-oriented messaging:

> "Build your week."

> "Plan together."

> "Know what's next."

The final copy must match actual entitlements.

---

# 59. FAQ

Add questions around:

- What is Train Together?
- Can two people use it?
- What's included in Free?
- What's Duo?
- Can I cancel?
- What happens to my data if I downgrade?
- Can I use it on mobile?
- Where does nutrition data come from?

Answers must describe actual functionality.

---

# 60. TRIAL

Initial hypothesis:

# 7-day full premium trial

The first implementation does not need to require a credit card before starting.

Flow:

```text
Google
↓
Free account
↓
7-day trial
↓
experience premium
↓
choose Free / Plus / Duo
```

Make trial implementation provider-independent.

---

# 61. PAYWALL UX

Do not show paywalls randomly.

Trigger paywalls contextually.

Examples:

### Advanced analytics

> See your full progression over time.

### Full meal planning

> Plan your entire week in one view.

### Grocery automation

> Turn your meal plan into a shopping list.

### Duo

> Coordinate your week together.

---

# 62. PAYWALL COMPONENTS

Create reusable:

```text
PremiumGate
UpgradeModal
PlanComparison
```

A page must not implement its own billing logic.

---

# 63. SUBSCRIPTION UI

Profile/Settings should show:

```text
Current plan
Trial status
Renewal date
Manage subscription
```

For Duo:

```text
Household plan
Members
```

---

# 64. BILLING PORTAL

For web subscribers provide:

```text
Manage subscription
```

which goes to the provider's secure portal/session.

Do not build payment-card management inside Train Together.

---

# 65. MOBILE SUBSCRIPTION MANAGEMENT

On native mobile:

- use platform-native subscription management
- map store subscription status into the internal entitlement system
- do not duplicate the same purchase flow in custom web UI inside the mobile app

---

# 66. MOBILE ROADMAP

When the app becomes multiplatform:

## Mobile Phase 1

- Google login
- dashboard
- Live Training
- quick logging

## Mobile Phase 2

- nutrition
- quick food logging
- grocery
- shared household

## Mobile Phase 3

- widgets
- Health integrations
- push notifications
- advanced automation

---

# 67. MOBILE WIDGETS

Prepare entitlement capabilities for:

## Training

```text
Today's workout
Next exercise
Workout progress
```

## Nutrition

```text
Calories remaining
Next meal
Macro progress
```

## Couple

```text
Partner activity
Shared goal
```

## Grocery

```text
Items remaining
```

Do not implement native widgets now.

---

# 68. WEB VS MOBILE RESPONSIBILITIES

Web should excel at:

- strategy editing
- meal planning
- recipe creation
- advanced analytics
- grocery planning

Mobile should excel at:

- Live Training
- quick food logging
- steps
- next meal
- grocery list
- quick progress
- widgets

This should inform current component and domain boundaries.

---

# 69. ARCHITECTURE FOR SHARED CODE

Business logic should eventually be reusable by:

```text
React Web
React Native / Expo
```

Avoid placing business rules directly in:

```text
Page.tsx
```

Prefer domain services and hooks.

---

# 70. SUBSCRIPTION ABSTRACTION

The rest of the product should only need to know:

```text
currentPlan
subscriptionStatus
entitlements
```

It should NOT need to know whether the customer paid through:

```text
Stripe
Apple
Google
RevenueCat
```

---

# 71. FEATURE FLAGS

Create a feature flag layer for rollout.

Potential:

```text
commercialBilling
googleAuth
households
premiumEntitlements
mealPlannerPremium
duoSharedPlanning
mobileWidgets
healthSync
aiPlanner
```

Use flags for controlled releases.

---

# 72. INTERNAL PRODUCT EVENTS

Create a stable event taxonomy.

Example:

```text
auth.signup_completed
household.created
household.invite_sent
household.invite_accepted

training.workout_completed
nutrition.food_logged
nutrition.meal_planned
nutrition.grocery_generated

subscription.trial_started
subscription.checkout_started
subscription.subscription_started
subscription.cancelled
```

Do not track sensitive content.

---

# 73. ANALYTICS PRIVACY

Product analytics must not expose:

- private nutrition notes
- private health information
- body measurements unnecessarily
- payment details
- private partner information

Track usage, not intimate content.

---

# 74. HOUSEHOLD INVITATION SECURITY

Invitation tokens should:

- be cryptographically random
- expire
- be single-use where appropriate
- not expose internal IDs unnecessarily

Do not use predictable invitation codes.

---

# 75. DELETE / LEAVE HOUSEHOLD

Prepare explicit behavior for:

- account deletion
- leaving household
- household ownership
- shared resource ownership
- subscription ownership

Do not silently delete shared data.

---

# 76. DOWNGRADE DATA RETENTION

When subscription expires:

- retain data
- remove premium write capabilities
- keep historical read access according to Free limits
- retain household identity
- retain billing history required for account state

Never destroy user data to enforce a paywall.

---

# 77. FREE LIMITS SHOULD BE TRANSPARENT

Show limits before the user hits them when possible.

Example:

> Your Free plan includes one active grocery plan.

Avoid surprise paywalls.

---

# 78. PLAN UPGRADE

Flow:

```text
Premium feature
↓
contextual upgrade
↓
select plan
↓
checkout
↓
verified webhook
↓
subscription updated
↓
entitlements recalculated
↓
UI updated
```

---

# 79. DUO UPGRADE

This is critical.

When User A upgrades a household to Duo:

```text
household.subscription = duo
```

Both members receive Duo entitlements.

User B must NOT purchase a second subscription.

---

# 80. DUO DOWNGRADE

When Duo expires:

both members fall back to Free entitlements according to policy.

Data remains.

Shared premium-only functionality may become:

- read-only
- limited
- unavailable for new writes

but historical information remains intact.

---

# 81. BILLING EDGE CASES

Handle:

- checkout canceled
- payment failed
- webhook delayed
- webhook duplicated
- subscription renewed
- subscription canceled
- subscription resumed
- upgrade
- downgrade
- trial expires
- partner joins during Duo
- partner leaves
- account logs in on another device

---

# 82. WEBHOOK IDEMPOTENCY

Store provider event IDs.

Processing the same webhook twice must not duplicate:

- subscriptions
- subscription events
- entitlements

---

# 83. SUBSCRIPTION SOURCE OF TRUTH

The provider/backend determines payment state.

Frontend determines only presentation.

Never let:

```text localStorage
```

or:

```text React state
```

be the authoritative subscription record.

---

# 84. PRODUCT ANALYTICS

Track cohort-level metrics:

```text
signup
household creation
partner acceptance
strategy completion
first workout
first meal
first grocery list
trial start
trial conversion
cancellation
```

Use them to measure activation and retention.

---

# 85. LANDING CONVERSION FUNNEL

The public funnel should become:

```text
Instagram / TikTok / YouTube / SEO
             ↓
          Landing
             ↓
      Start for free
             ↓
      Continue with Google
             ↓
       Create account
             ↓
      Create household
             ↓
       Invite partner
             ↓
      Build first strategy
             ↓
        Plan first week
             ↓
     Generate groceries
             ↓
        AHA MOMENT
             ↓
          Trial
             ↓
       Free / Plus / Duo
```

---

# 86. "AHA MOMENT"

The most important activation state to measure:

```text
partner joined
+
strategy configured
+
first week planned
+
first grocery list generated
```

Create a product event for this milestone.

---

# 87. CORE RETENTION LOOP

Design around:

```text
Sunday
↓
Plan week
↓
Generate groceries
↓
Monday
↓
Train
↓
Eat
↓
Log
↓
Partner sees progress
↓
Week review
↓
Plan next week
```

---

# 88. NORTH STAR

Treat:

# WEEKLY ACTIVE HOUSEHOLDS

as the key product-growth metric.

A household is meaningfully active when at least one member completes a meaningful planned action during the week.

---

# 89. ARPH

Track:

# AVERAGE REVENUE PER HOUSEHOLD

This should become one of the main business metrics for Duo.

Example:

```text
100 Duo households
×
US$90/year
=
US$9,000 gross annual revenue
```

These are illustrative calculations, not forecasts.

---

# 90. EARLY-ACCESS STRATEGY

Suggested rollout:

## Stage 0

Private use by founders.

Goal:

Validate product.

## Stage 1

Closed beta:

50–100 couples.

Goal:

Find friction.

## Stage 2

Early access:

500–1,000 users/couples.

Goal:

Validate willingness to pay.

## Stage 3

Public SaaS.

Goal:

Growth + retention + monetization.

## Stage 4

Mobile.

Goal:

Engagement + convenience.

---

# 91. FOUNDER OFFER

Prepare for:

# FOUNDING MEMBER

Preferred structure:

> Founding price locked while subscription remains active.

Avoid promising permanent lifetime access unless the business explicitly approves it.

Do not implement this until pricing strategy is confirmed.

---

# 92. LATAM PRICING

The architecture should eventually support:

```text
currency
country
locale
provider_price_id
```

Do not hardcode USD forever.

Initial pricing can use USD-equivalent values for testing.

---

# 93. MOBILE STORE ECONOMICS

The pricing architecture must anticipate:

```text
gross revenue
-
store/payment fee
-
taxes
=
net revenue
```

Do not assume web and mobile have identical unit economics.

Keep pricing configurable by platform.

---

# 94. BILLING CONFIGURATION

Use stable internal plan codes:

```text
free
plus
duo
```

Map each platform/provider to its own price identifier.

Conceptually:

```text
duo
 ↓
stripe_price_id
apple_product_id
google_product_id
```

---

# 95. NO PRICE STRINGS AS IDS

Never make:

```text
"US$11.99"
```

a database identity.

Use:

```text
plan_code = "duo"
```

and separate pricing configuration.

---

# 96. ACCOUNT ARCHITECTURE

Target:

```text
auth.users
   ↓
profiles
   ↓
households
   ↓
household_members
   ↓
subscriptions
   ↓
entitlements
```

This hierarchy should be used consistently.

---

# 97. PRIVATE DOMAIN

Under each profile:

```text
Training
Nutrition
Progress
Profile
```

---

# 98. SHARED DOMAIN

Under each household:

```text
Recipes
Shared Meals
Groceries
Couple Progress
Household Activity
```

---

# 99. SUBSCRIPTION DOMAIN

Separate:

```text
billing
subscriptions
entitlements
usage
```

from:

```text
training
nutrition
household
```

---

# 100. MOBILE COMPATIBILITY

The API/repository contracts should be platform-neutral.

Do not create React-specific data structures that cannot be consumed by React Native later.

---

# 101. AUTH MIGRATION

The existing application currently supports Supabase username/password plus a local demo fallback.

Production SaaS should transition to Google OAuth.

Preserve demo functionality only for local development if necessary.

Document the transition.

---

# 102. ONBOARDING ROUTING

Use explicit user state:

```text
new_user
onboarding
active
```

or an equivalent mechanism.

Example:

```text
Google login
↓
if profile incomplete
→ onboarding
else
→ dashboard
```

---

# 103. HOUSEHOLD INVITATION STATE

Track:

```text
pending
accepted
expired
revoked
```

Do not infer invitation status from frontend local state.

---

# 104. HOUSEHOLD OWNER

The household owner is normally the billing initiator.

However, the system must handle ownership changes without corrupting subscription state.

---

# 105. SUBSCRIPTION ACCESS

The system should expose a unified result:

```ts
type AccessContext = {
  userId: string
  householdId: string | null
  plan: "free" | "plus" | "duo"
  status: SubscriptionStatus
  entitlements: Entitlements
}
```

Adapt to the project's existing types.

---

# 106. PREMIUMGATE BEHAVIOR

If an entitlement is unavailable:

Show:

1. feature name
2. value proposition
3. current plan
4. recommended upgrade
5. CTA

Do not show raw permission errors.

---

# 107. BACKEND PREMIUM ENFORCEMENT

Do not rely solely on frontend `PremiumGate`.

Premium operations must be protected through:

- RLS
- database functions
- secure server functions
- entitlement validation

Use the strongest appropriate mechanism for each action.

---

# 108. PAYMENT DATA

Never store:

- card number
- CVV
- full payment details

The billing provider should own payment information.

---

# 109. GDPR/PRIVACY FOUNDATION

Prepare for future privacy requirements.

At minimum provide:

- account deletion pathway
- data export foundation
- private/shared data distinction
- clear household visibility

Do not build a full legal/compliance suite now.

---

# 110. EXPORT

Prepare a premium/future capability:

```text
Export my data
```

Potential formats:

- JSON
- CSV

Data categories:

- workouts
- nutrition logs
- recipes
- progress

---

# 111. INTERNAL ADMIN

Do not build an admin panel yet.

But architecture should make it possible to inspect:

- subscriptions
- households
- plan state
- entitlement state
- key product events

later.

---

# 112. OBSERVABILITY

Log operational problems:

- OAuth errors
- household invitation errors
- webhook errors
- subscription update failures
- Realtime connection errors
- entitlement resolution errors

Never log:

- passwords
- tokens
- card details
- private nutrition notes unnecessarily

---

# 113. REALTIME

Subscription changes may optionally use Realtime so another open browser receives updated entitlements.

Household shared data must continue to use domain-specific Realtime channels.

---

# 114. REALTIME CHANNELS

Prefer domain channels:

```text
fitness
nutrition
household
subscription
```

Centralize lifecycle when practical.

---

# 115. REALTIME CONNECTION STATE

Expose actual states:

```text
connecting
connected
reconnecting
error
offline
```

The UI should not claim "connected" merely because Supabase is configured.

---

# 116. SELECTIVE REFRESH

Do not reload the entire application state after every event.

Prefer:

```text
event
↓
identify entity
↓
update affected state/cache
```

Use selective refetch when necessary.

---

# 117. OFFLINE FOUNDATION

No full offline-first system is required now.

However:

- preserve local drafts
- avoid losing form input
- expose failed persistence
- provide retry when appropriate

Do not silently discard unsaved information.

---

# 118. FEATURE FLAGGING

Feature flags should be environment/configuration driven.

Do not make a database migration necessary just to toggle a UI feature.

---

# 119. PRODUCT COPY

The copy should emphasize:

- less decision fatigue
- weekly organization
- coordination
- consistency
- motivation
- simplicity

Avoid promising:

- guaranteed results
- medical outcomes
- guaranteed weight loss
- medical advice

---

# 120. HEALTH BOUNDARY

Train Together is a planning/tracking application.

It must not present:

- diagnoses
- medical treatment
- clinical prescriptions
- guaranteed health outcomes

Nutrition targets are user-defined/planned values.

---

# 121. LANDING — FAQ HEALTH

Add a clear explanation:

> Nutrition information is provided for planning and tracking. It is not medical advice.

Translate naturally to Spanish.

---

# 122. LANDING — DATA SOURCES

When appropriate, communicate that nutrition data comes from structured food databases and may be approximate depending on source and portion.

Do not imply laboratory-level precision.

---

# 123. PRODUCT NARRATIVE

The landing should tell one coherent story:

```text
You have goals.
↓
Train Together turns goals into a plan.
↓
You follow the plan.
↓
The app tracks reality.
↓
Your household stays coordinated.
↓
Consistency becomes easier.
```

---

# 124. VISUAL STORYTELLING

Use actual application UI previews wherever possible.

Do not rely on stock gym photography as the primary visual.

---

# 125. HERO PRODUCT PREVIEW

The animated product preview should rotate subtly between:

```text
Workout
Nutrition
Meal Plan
Grocery
Couple Progress
```

No aggressive carousel.

---

# 126. LANDING RESPONSIVENESS

Verify:

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1280px
- 1440px+

No overflow.

---

# 127. LANDING ACCESSIBILITY

Ensure:

- meaningful headings
- keyboard navigation
- button labels
- visible focus
- reduced motion support
- proper contrast

---

# 128. PRICING RESPONSIVENESS

Pricing cards should stack naturally on mobile.

The Duo plan should remain clearly identifiable as recommended.

---

# 129. LANDING PERFORMANCE

Avoid:

- huge videos
- unoptimized GIFs
- excessive JavaScript
- unnecessary external APIs

Prefer CSS/framer-based effects and existing optimized assets.

---

# 130. DATABASE MIGRATIONS

Add versioned migrations.

Never destructively modify old production migrations.

Potential migration groups:

```text
household_foundation
household_invitations
subscription_foundation
entitlements
billing_events
rls_updates
realtime_updates
```

Use timestamps consistent with the repository convention.

---

# 131. GENERATED SUPABASE TYPES

The current documentation notes manual DB types.

Introduce:

```bash
yarn db:types
```

or equivalent.

Use:

```ts
SupabaseClient<Database>
```

when appropriate.

Update generated types whenever migrations change.

---

# 132. RLS TESTS

Add database-level checks for:

- own/private data
- household shared data
- subscription access
- invitation access
- unauthorized updates

---

# 133. SUBSCRIPTION TESTS

Unit tests:

- free entitlements
- plus entitlements
- duo entitlements
- expired subscription
- trial
- downgrade
- upgrade
- entitlement resolution

---

# 134. HOUSEHOLD TESTS

Test:

- create
- invite
- accept
- expiration
- leave
- member access
- private isolation
- shared data access

---

# 135. BILLING TESTS

Test:

- idempotent webhook
- active subscription
- canceled subscription
- payment failure
- plan change
- household Duo access

---

# 136. LANDING TESTS

Verify:

- CTA
- Google CTA
- pricing toggle
- language switch
- responsive layout
- reduced motion
- no broken links

---

# 137. REGRESSION

The current product must keep working:

```text
Landing
Login
Dashboard
Strategy
Live Training
Manual Training
Quick Log
Progress
History
Couple
Exercise Library
Profile

Food Library
Recipes
Food Log
Meal Planner
Grocery List
Nutrition Insights
```

---

# 138. COMMANDS

Continue using Yarn:

```bash
yarn install
yarn dev
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

Add only necessary commands.

---

# 139. ENVIRONMENT VARIABLES

Potential web variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

STRIPE_PRICE_PLUS_MONTHLY=
STRIPE_PRICE_PLUS_ANNUAL=
STRIPE_PRICE_DUO_MONTHLY=
STRIPE_PRICE_DUO_ANNUAL=
```

Never expose secrets via Vite.

---

# 140. MOBILE PROVIDER IDs

If mobile billing is later added, provider-specific product identifiers must remain outside generic plan codes.

---

# 141. SUBSCRIPTION SEED / DEV MODE

Provide development-only ways to simulate:

```text
free
plus
duo
trialing
expired
```

This should not be confused with real billing.

---

# 142. DEV PLAN SWITCHER

Optionally add a development-only plan switcher.

It must:

- be disabled in production
- not alter real billing
- clearly display "DEVELOPMENT ONLY"

This is useful for testing paywalls and entitlements.

---

# 143. NO REAL BILLING REQUIRED YET

The first implementation stage should be able to run entirely without Stripe credentials.

Use mocked/local provider behavior only for development.

The architecture must be production-ready for later connection.

---

# 144. HOUSEHOLD COMMERCIAL OWNERSHIP

Duo subscription should be attached to household, not user.

This means:

```text
User A
User B
   ↓
Household
   ↓
Duo subscription
```

not:

```text
User A → subscription
User B → another subscription
```

---

# 145. INDIVIDUAL PLUS

PLUS remains attached to the user when they are not using a shared Duo household.

If a Plus user joins a Duo household:

define precedence:

```text
household Duo
>
individual Plus
>
Free
```

Do not double-charge or create conflicting entitlements.

---

# 146. PLAN PRECEDENCE

Use a central resolution function:

```text
resolveEntitlements(user, household, subscriptions)
```

Determine the effective access context.

---

# 147. MULTIPLE SUBSCRIPTIONS

The system should gracefully handle:

- user has individual Plus
- user joins Duo household

Do not accidentally discard the individual subscription record.

Define business behavior separately from access calculation.

---

# 148. TRIAL PRECEDENCE

If the household is Duo trialing:

both members receive Duo trial entitlements.

If one individual has Plus and joins another household:

use explicit business rules.

---

# 149. CANCELLATION UX

Cancellation should not immediately remove access.

Show:

```text
Your plan remains active until DATE.
```

Then downgrade.

---

# 150. PAYMENT FAILURE UX

If payment fails:

do not immediately wipe premium data.

Use grace period/provider status rules.

Show a clear message and billing action.

---

# 151. LANDING PRICING

The prices shown on landing must come from the same configuration/source as checkout.

Never maintain separate hardcoded price strings.

---

# 152. PRICING TOGGLE

Support:

```text
Monthly
Yearly
```

and calculate savings from configured values.

Do not hardcode "save 30%" unless that is derived from configuration.

---

# 153. PLAN COMPARISON

The pricing page can have a deeper comparison than the landing.

Use:

```text
Feature
Free
Plus
Duo
```

Ensure descriptions match actual entitlements.

---

# 154. FAQ BILLING

Include:

- Can I cancel?
- What happens after cancellation?
- Does Duo cover both people?
- What happens if my partner leaves?
- Can I switch from Plus to Duo?
- Is there an annual plan?
- Can I use Train Together on mobile later?

---

# 155. BUSINESS COPY STYLE

Tone:

- premium
- warm
- motivating
- modern
- direct

Avoid:

- aggressive sales copy
- guilt
- shame
- fitness stereotypes
- "no excuses"
- "summer body" messaging

---

# 156. LANDING VISUAL LANGUAGE

Maintain current:

- dark background
- glass surfaces
- purple/magenta/cyan accents
- neon glow
- premium typography
- subtle motion

Do not create a separate marketing design system.

---

# 157. APPLICATION NAME

Continue using:

# Train Together

unless the existing product owner explicitly changes the brand.

---

# 158. BUSINESS MODEL SUMMARY

The strategic model is:

```text
FREE
↓
Acquisition

PLUS
↓
Individual monetization

DUO
↓
Core business
```

The product moat should become:

```text
Couple
+
Planning
+
Nutrition
+
Training
+
Household
```

---

# 159. FINAL ARCHITECTURAL TARGET

```text
                         TRAIN TOGETHER
                               │
              ┌────────────────┴────────────────┐
              │                                 │
           TRAINING                          NUTRITION
              │                                 │
        Strategy / Live                    Strategy / Meals
        Manual / Progress                  Recipes / Log
                                           Planner / Grocery
              │                                 │
              └────────────────┬────────────────┘
                               │
                          HOUSEHOLD
                               │
                    Couple / Shared Planning
                               │
                         SUBSCRIPTION
                               │
                   Free / Plus / Duo
                               │
                         ENTITLEMENTS
                               │
                  ┌────────────┴─────────────┐
                  │                          │
                 WEB                     MOBILE
              React/Vite             React Native/Expo
                  │                          │
                  └───────────┬──────────────┘
                              │
                           SUPABASE
                              │
                  Auth / PostgreSQL / RLS
                              │
                           Realtime
```

---

# 160. IMPLEMENTATION ORDER

## PHASE A — FULL AUDIT

Read:

- current technical documentation
- actual code
- migrations
- RLS
- Realtime
- auth
- existing nutrition
- existing couple model
- landing
- navigation
- i18n
- build/test configuration

Do not code before understanding the actual current state.

---

## PHASE B — DOMAIN CONTRACTS

Define:

- plan codes
- subscription statuses
- entitlements
- household membership
- invitation states
- billing abstractions

Prefer types/contracts before UI.

---

## PHASE C — HOUSEHOLD FOUNDATION

Implement:

- explicit household model
- membership
- invitations
- RLS
- compatibility with existing couples

---

## PHASE D — GOOGLE AUTH

Implement:

- Google OAuth
- session restoration
- onboarding routing
- demo fallback if needed

---

## PHASE E — SUBSCRIPTIONS

Implement:

- subscriptions table
- billing customer
- subscription events
- plan configuration
- entitlements
- usage limits
- subscription context/service

Initially all production users may remain Free.

---

## PHASE F — BILLING FOUNDATION

Implement:

- provider abstraction
- Stripe integration boundary
- webhook architecture
- idempotency
- customer portal boundary

Do not require production keys.

---

## PHASE G — ONBOARDING

Implement:

- profile setup
- household creation
- partner invitation
- first strategy
- first-week planning
- activation event

---

## PHASE H — LANDING REDESIGN

Update the landing to sell:

```text
Training
Nutrition
Weekly planning
Household
Grocery
Duo
```

Add:

- pricing
- CTA
- FAQ
- product previews

---

## PHASE I — PREMIUM GATING

Implement:

- PremiumGate
- UpgradeModal
- pricing page
- plan comparison
- contextual paywalls

---

## PHASE J — QA & HARDENING

Run:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn db:check
```

Then manually validate:

- auth
- household
- entitlements
- RLS
- Realtime
- landing
- onboarding
- responsive behavior

---

# 161. DEFINITION OF DONE

The work is complete only when:

### Identity

- Google login works
- session persists
- local dev fallback remains usable if intentionally retained

### Household

- household creation works
- invitations work
- membership works
- RLS protects private data

### Commercial layer

- Free/Plus/Duo exist conceptually
- plan config is centralized
- entitlements are centralized
- limits are centralized
- premium access is protected server-side

### Billing

- provider abstraction exists
- webhook architecture exists
- event idempotency exists
- no secrets leak
- checkout integration can be enabled later without changing domain architecture

### Landing

- product proposition is clear
- Nutrition is represented
- Planning is represented
- Grocery is represented
- Couple/Household is represented
- Duo is represented
- pricing is represented
- Google CTA is represented

### Mobile readiness

- domain logic is not trapped in web components
- subscription abstraction is platform-neutral
- reusable types/services exist

### Quality

- lint passes
- typecheck passes
- tests pass
- build passes
- DB checks pass

---

# 162. FINAL AGENT INSTRUCTION

Start by reading the entire current `DOCUMENTACION_TECNICA.md` and inspecting the real repository.

The uploaded technical documentation is the current baseline, but code is the final source of truth for implementation details.

If documentation and code disagree:

1. inspect the implementation
2. determine the real state
3. preserve working behavior where safe
4. document the discrepancy
5. make the smallest safe migration

Then execute the phases in order.

Do not ask for approval for ordinary engineering decisions.

Do not create fake billing.

Do not create fake Google authentication.

Do not create fake entitlement enforcement.

Do not implement client-only premium security.

Do not expose secrets.

Do not break existing Training or Nutrition.

Do not introduce unnecessary paid services.

Do not introduce AI APIs at this stage.

Use Yarn.

Keep the architecture compatible with React Native / Expo.

Update documentation with every meaningful architectural change.

At the end, provide a concise technical summary with:

- files changed
- migrations added
- tables added/changed
- RLS changes
- Realtime changes
- Auth changes
- Household changes
- Subscription architecture
- Entitlement architecture
- Billing integration boundary
- onboarding changes
- landing changes
- tests executed
- remaining technical limitations
- remaining business assumptions
