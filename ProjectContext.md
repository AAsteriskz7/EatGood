Project Context: AnchorFuel

1. Project Overview & Mission

Project AnchorFuel is an intelligent, camera-first proactive health coach designed specifically for the Anthropic + NBC hackathon challenge.

The application addresses the core pain point of traveling national correspondents: traditional health and calorie tracking requires too much time, typing, and cognitive load. After a 14-hour shoot or a red-eye flight, a user does not want to manually log meals or guess what is healthy. AnchorFuel eliminates the keyboard entirely. It uses real-time visual analysis and environmental context to make instant, hyper-personalized nutritional and fitness decisions on behalf of the user.

2. Target Persona & Problem Space

The User: National correspondents, traveling journalists, or any high-stress, constantly moving professional.

The Problem: Unpredictable schedules, chronic fatigue, and eating on the go lead to poor nutritional choices. Advice like "eat more protein" is useless when staring at a hotel mini-fridge at 2 AM or an airport lounge menu during a 30-minute layover.

The Solution: A zero-friction app that looks at what is available right in front of the user and tells them exactly what to choose based on their immediate goals (e.g., maintaining a 2000-calorie target, prioritizing hypertrophy, and adhering strictly to a vegetarian diet) without them needing to search or filter.

3. Core Features

Feature 1: The Visual AR Coach (Zero-Friction Camera Interface)

The app is built entirely around a camera interface rather than a text-input interface.

Instant Menu Analysis: The user points their phone at a physical restaurant menu or an airport kiosk screen. The app visually scans the items and overlays floating recommendation cards directly on the real-world view.

Green Highlight (Recommended): Contextualized to the moment. "Grab the paneer and lentil bowl. It hits your vegetarian protein goals and won't cause a sugar crash before your 11 PM flight."

Red Highlight (Avoid): "Skip the heavy pasta tonight; it will disrupt your sleep schedule."

Midnight Fridge Mode: The user snaps a photo of an open fridge. The AI identifies the available ingredients and instantly generates a 5-minute, zero-cook vegetarian recipe using only what is visible, perfectly portioned for their remaining daily targets.

Feature 2: "Terminal-to-Table" Location Awareness

AnchorFuel acts before the user even has to ask.

Proactive Gate-Side Suggestions: By syncing with flight itineraries and location data, the app knows when the user lands and at which concourse.

Pre-Filtered Options: It proactively identifies food spots within a 5-minute walking radius and sends a notification with a direct recommendation (e.g., "You have a 45-minute layover. The cafe at Gate B12 has a high-protein black bean burger that fits your exact macros today.").

Feature 3: Dynamic Schedule & Fatigue Mapping

Generic advice is useless for odd hours. AnchorFuel adapts to the reality of a chaotic schedule.

Calendar Syncing: The application understands the user's upcoming events, such as back-to-back red-eye flights or a 4 AM broadcast call time.

Predictive Adjustments: It automatically adjusts caloric and macro recommendations based on projected fatigue. It also suggests micro-interventions, such as a 10-minute mobility stretch in a hotel room, rather than suggesting a full gym workout when the user is clearly operating on low sleep.

4. The User Experience (UX) Flow

Open & Point: User opens the app directly to a camera viewfinder on their phone. No menus, no dashboards.

Scan: User points the camera at their immediate food environment (menu, fridge, buffet).

Overlay & Decide: Within seconds, AR cards float over the specific real-world items. The user reads the one-sentence recommendation, makes the healthy choice effortlessly, and closes the app.

Passive Monitoring: In the background, the app checks their location and calendar, sending brief, highly actionable notifications only when an optimal food or movement window appears.

5. The Anthropic Edge (AI Architecture)

To execute real-time AR overlays, AnchorFuel relies entirely on agentic reasoning and high-speed visual processing.

Claude Vision Engine: We bypass traditional databases by sending the camera feed directly to Claude. Claude doesn't just "see" a menu; its advanced reasoning capabilities cross-reference the extracted menu items against the user's specific constraints (e.g., strict vegetarian) and biometric goals (e.g., hypertrophy) in under two seconds.

Agentic Routing: Instead of a rigid backend, AnchorFuel uses an LLM router. If the user scans a fridge, Claude dynamically switches to a "Culinary Agent" persona to generate a recipe. If the user scans an airport menu, it switches to a "Triage Agent" to find the fastest macro-friendly meal.

6. Business Value for NBC (The ROI)

NBC invests millions in its on-air talent. AnchorFuel is an enterprise wellness tool designed to protect that investment.

Reduced Burnout: By removing the cognitive load of health tracking, correspondents retain mental energy for their actual reporting.

Optimized On-Air Performance: Preventing sugar crashes and ensuring proper caloric intake directly translates to higher energy, sharper focus, and better on-camera presence during grueling news cycles.

Retention & Care: Demonstrates NBC’s commitment to the physical well-being of its most heavily deployed field staff.

7. Future Scalability (Beyond the Hackathon)

Smart Glasses Integration: AnchorFuel’s camera-first UI is the perfect predecessor for wearable tech. In the future, correspondents wearing smart glasses will see AR recommendations without even pulling out their phones.

Corporate Expense Syncing: Integration with NBC's corporate card systems (like Concur) to automatically flag and expense meals that AnchorFuel recommends, creating a seamless "eat, expense, and go" pipeline.