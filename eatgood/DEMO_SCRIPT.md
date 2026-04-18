# AnchorFuel Demo Script

This document is for the team spokesperson during the demo, Q&A, and any informal product conversations.

## One-Sentence Pitch

AnchorFuel is a camera-first AI nutrition coach for busy people that helps them decide what to eat in seconds based on what is in front of them, where they are, and what their schedule looks like next.

## Short Intro Script

Hi, we built AnchorFuel for busy people who do not have the time or energy to manually track food. That could be a student between classes, a parent juggling errands, a nurse on a long shift, an office worker between meetings, or someone commuting across town. Most nutrition apps expect you to search, type, and log everything yourself. AnchorFuel removes that friction. You open the app, point your camera at a menu or a fridge, and the AI gives you instant, personalized guidance based on your goals, diet, allergies, remaining macros, location, and schedule.

## 60-90 Second Demo Script

Today we are showing AnchorFuel, an AI-powered nutrition coach built for busy people navigating packed days.

The problem is simple: when your day is packed with meetings, classes, errands, shifts, workouts, family responsibilities, or travel, healthy eating becomes a decision-making burden. At that point, even good advice is too much work if it requires typing, searching, or reading nutrition labels.

AnchorFuel solves that with a camera-first experience. The user sets up a profile with their calorie and macro targets, dietary preferences, allergies, and schedule. From there, they can scan a menu, a plate of food, or an open fridge. Our AI analyzes what is visible and tells them what is a good option, what is just okay, and what to avoid, along with estimated macros and a quick explanation.

If the user scans a fridge, AnchorFuel can also generate a recipe using only the ingredients it sees. If the user has an upcoming event soon, like a meeting, class, shift, workout, or trip, the app switches into a faster triage mode and gives recommendations optimized for speed, energy, and convenience.

On the dashboard, the app tracks daily meals, shows progress toward macro goals, and uses the user's location and schedule to proactively suggest nearby food options and small wellness interventions like hydration, breathing, or movement breaks.

So instead of asking users to be disciplined data-entry experts, AnchorFuel meets them in the moment and helps them make the best decision with almost no effort, whether they are at home, at work, on campus, or on the move.

## Live Walkthrough Script

### 1. Profile Setup

Here I'm loading our demo profile. We set a calorie target, protein target, allergies, fitness goal, and a realistic schedule with upcoming events. This matters because the app uses that schedule to decide how aggressive or lightweight its recommendations should be.

### 2. Scan Flow

Now we go to the scanner, which is the heart of the app. The user can choose menu mode or fridge mode. Instead of typing in food names, they just point the camera or upload an image.

### 3. Menu Analysis

In menu mode, the AI reviews the visible options and labels each item as good, okay, or avoid. It does not just give generic nutrition advice. It explains the recommendation in context of the user's remaining calories, protein needs, dietary restrictions, and time pressure.

### 4. Fridge Mode

In fridge mode, the app identifies ingredients and creates a practical recipe from what is already there. That is useful for anyone looking into their fridge at home, in a dorm, at work, or anywhere they need a fast decision without overthinking it.

### 5. Triage Mode

Because our demo profile includes an event coming up soon, the app can shift into a triage mindset. That means it prioritizes speed, convenience, and how the user will feel before the next obligation, not just raw calories.

### 6. Dashboard

On the dashboard, we show macro progress, meals logged today, the current schedule, and proactive suggestions based on location. We also surface micro-interventions, like hydration or a five-minute reset, because performance is not only about food. It is about sustaining energy across a busy day.

## If You Need a Very Short Version

AnchorFuel is a smart nutrition coach for busy people. You point your camera at food, and it tells you what to eat based on your goals, schedule, and location, then helps you stay on track throughout the day.

## Likely Questions And Strong Answers

### What makes this different from MyFitnessPal or calorie trackers?

Most trackers are reactive and manual. You have to know what to search for, enter it, and interpret the result. AnchorFuel is proactive and camera-first. It looks at the real food environment around you and gives a recommendation immediately, which is much more useful when you are tired or under time pressure.

### Who is this for?

This is for anyone with a busy schedule who wants better food decisions without extra mental load. That includes students, parents, office workers, healthcare staff, gym-goers, shift workers, and travelers. The underlying problem is broad: people are busy, tired, and making food choices under time pressure.

### What is actually live in the demo?

In the live demo, users can set up a profile, add schedule events, scan a menu or fridge photo, get AI-generated recommendations with estimated macros, log meals, view daily and weekly progress, and receive proactive nearby food suggestions plus micro-interventions. Data is stored locally in the browser for a simple hackathon-ready experience.

### How does the AI decide what to recommend?

It combines visual analysis of the food or menu with profile data like calorie target, protein target, allergies, diet preference, and current schedule. If an event is coming up soon, the system shifts into a triage mode that prioritizes convenience, energy stability, and lower-risk meal choices for that moment.

### Is it using a nutrition database?

Not in this version. For the hackathon prototype, we leaned on AI-based visual and contextual reasoning instead of a rigid nutrition database. That gives us broad flexibility across menus, fridges, and real-world food environments. A future version could combine this with verified nutrition sources for higher precision.

### How accurate are the calorie and macro estimates?

They are estimates, not medical-grade measurements. For a demo and real-world guidance tool, the goal is fast, useful decision support rather than exact laboratory accuracy. Over time, we would improve precision by combining AI vision with structured nutrition data and feedback loops.

### Does it work only for vegetarian users?

No. The concept supports multiple diet preferences. The live app already supports several diet modes and allergy constraints.

### How is location used?

Location helps AnchorFuel suggest nearby meal options that fit the user's current nutritional needs and timing. Instead of waiting for the user to search, the app can surface likely options nearby and recommend what type of meal makes sense before the next event.

### What do you mean by micro-interventions?

Those are short wellness actions like hydration reminders, breathing exercises, light movement, or rest prompts. We included them because a productive day is not just about calories. Sometimes the best intervention before the next meeting, class, shift, or workout is a five-minute reset, not another heavy meal.

### Is user data private?

In the current prototype, profile and meal history are stored locally in the browser, so there is no account system and no cross-device storage. That keeps the demo lightweight and privacy-friendly. In a production version, privacy and enterprise controls would be a major design priority.

### What is the business value?

The value is better performance, less burnout, and more support for people trying to stay healthy in the middle of full schedules. For teams and employers, even small improvements in food choices and energy management can compound into better focus, consistency, and well-being.

### Who would pay for this?

There are two clear paths. One is B2B, where an employer, school, gym, or wellness program provides it to members or staff. The other is B2C for busy individuals who want intelligent food guidance without a lot of tracking friction.

### What is the biggest limitation right now?

The biggest limitation is that some recommendations rely on AI estimation rather than verified real-time restaurant and nutrition integrations. That is acceptable for a hackathon prototype because it proves the user experience and decision-making model. The next step would be strengthening data sources and reliability.

### What would you build next?

Next we would add more grounded restaurant data, stronger nutrition verification, calendar integrations, notifications, and eventually wearable or smart-glasses experiences. The core insight stays the same: the product should help the user make the right choice in the moment, with almost no effort.

## If A Judge Asks A Technical Question

AnchorFuel is built as a Next.js app with a mobile-first interface. The frontend captures camera or uploaded images, sends them to an AI analysis route, and receives structured recommendations back as JSON. We also use profile data, schedule context, geolocation, and local storage to drive dashboard insights and proactive suggestions.

## If A Judge Asks What The "Wow" Factor Is

The wow factor is that the app does not ask the user to stop and do admin work. It sees what they see, understands what they need right now, and helps them decide instantly.

## If A Judge Pushes On Feasibility

That is exactly why we focused on a low-friction workflow. Even as a prototype, the core experience is already believable: profile setup, schedule awareness, image-based analysis, meal logging, and proactive suggestions. The product can become more accurate and enterprise-ready over time, but the user behavior change is already clear.

## Closing Line

AnchorFuel turns nutrition from a chore into a real-time decision assistant, built for people whose schedules do not leave room for second-guessing.
