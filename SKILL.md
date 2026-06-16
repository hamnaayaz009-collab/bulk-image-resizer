---
name: interactive-website
description: "You are a senior frontend engineer and interaction designer."
---


I want you to build a modern, high-end interactive website similar to Apple product pages (like the Apple Vision Pro page).

Goal:
Create a scroll-based storytelling website where animations are triggered by scrolling.

Tech Requirements:
- Use Next.js (React)
- Use GSAP with ScrollTrigger for animations
- Use clean, modular structure
- Use Tailwind CSS for styling

Core Features:
1. Full-screen sections (100vh each)
2. Smooth scroll-based animations (scrub-based)
3. Sticky sections where content stays fixed during animation
4. Parallax effects
5. Text reveal animations (fade + slide + stagger)
6. Image zoom / scale animations
7. Clean modern UI (Apple-style minimal design)

Structure:
Create at least 4 sections:

SECTION 1 (Hero):
- Large centered heading
- Subtext
- Smooth fade + scale animation on scroll

SECTION 2 (Feature Reveal):
- Left: text
- Right: image
- Text animates line by line
- Image scales slightly on scroll

SECTION 3 (Sticky Animation Section):
- Sticky container
- Content changes while scrolling
- Multiple steps (like product storytelling)

SECTION 4 (Details Section):
- Grid layout
- Cards appear with stagger animation

Technical Details:
- Use GSAP ScrollTrigger with scrub:true
- Use proper trigger start/end points
- Use reusable animation functions
- Separate components for each section
- Optimize performance (no unnecessary re-renders)

Output:
- Full working code (not explanation)
- Folder structure
- All components
- Example animations implemented
- Clean and readable code

Bonus:
- Add one advanced effect (parallax OR video scrubbing OR 3D rotation)

Do NOT give explanation unless necessary.
Focus on production-ready code.