# Arte+ Website – AI System Instructions

## Project Overview

This project is a production-oriented website for the classical trio **Arte+**.

### Stack
- Vite
- Bootstrap 5
- Supabase (PostgreSQL)
- Supabase Edge Functions
- TypeScript (preferred)

### Core Features
- Home
- About
- Media
- Booking Calendar
- Contact
- Inquiry system
- Booking management (availability logic)

This project prioritizes clean architecture, long-term maintainability, and predictable structure.

---

# General AI Behavior Rules

- Think before implementing.
- Provide a short plan when the task is non-trivial.
- Modify only relevant files.
- Do not introduce unnecessary dependencies.
- Prefer clarity over cleverness.
- Avoid overengineering.
- Preserve existing structure unless explicitly instructed.

---

# Architecture Rules

## Separation of Concerns

Maintain strict separation between:

- UI components
- Business logic
- Database queries
- Edge functions
- Type definitions

Do not mix DOM logic, database access, and API logic in the same file.

---

# Project Structure Guidelines

Follow this structure:
/src
/components
/pages
/styles
/services
/lib
/types
/supabase
/migrations
/functions


- UI logic → `/components`
- Supabase queries → `/services`
- Shared utilities → `/lib`
- Types → `/types`
- Edge functions → `/supabase/functions`

Do not reorganize folders without explicit instruction.

---

# Supabase & Database Rules (CRITICAL)

- NEVER modify schema directly in production.
- ALWAYS create a migration file for schema changes.
- If schema was manually modified, generate migration via:


## Core Tables

- musicians
- services
- media
- events
- inquiries
- bookings

---

# Booking Logic Rules

- Inquiry does NOT block a date.
- Only bookings with status `confirmed` block availability.
- Status fields must use enums.

### inquiries status:
- new
- replied
- declined
- converted

### bookings status:
- tentative
- confirmed
- canceled

- Prevent overlapping confirmed bookings.
- Always validate dates server-side in Edge Functions.
- Never trust frontend validation alone.

---

# Security Rules

- Never expose Supabase service role key to frontend.
- Edge Functions must handle sensitive logic.
- Validate all user input server-side.
- Apply RLS policies when appropriate.
- Do not store unnecessary personal data.

---

# UI & Design Rules

Design direction:
- Elegant
- Minimal
- Classical
- Premium

### Color Direction
- Ivory / light neutral backgrounds
- Charcoal text
- Muted gold accents

### Typography
- Serif for headings
- Clean sans-serif for body

Avoid:
- Flashy animations
- Heavy UI libraries
- Excessive JavaScript

Prioritize:
- Spacing
- Typography hierarchy
- Clean layout
- Performance

---

# Booking Calendar Rules

- Availability is derived from confirmed bookings only.
- Availability must be computed dynamically.
- Clicking an available date opens inquiry form.
- Edge Function must revalidate availability before saving.
- Handle timezone properly.

---

# Edge Function Rules

- Keep functions small and single-purpose.
- Always validate request body.
- Return structured JSON responses.
- Handle errors gracefully.
- Do not mix presentation logic inside Edge Functions.

---

# Code Quality Rules

- Prefer TypeScript.
- Avoid `any`.
- Define explicit types for:
- Inquiries
- Bookings
- Musicians
- Events
- Add proper error handling for async calls.
- Do not ignore Promise rejections.

---

# Performance Rules

- Optimize images.
- Lazy-load media when possible.
- Avoid unnecessary dependencies.
- Keep JavaScript minimal.
- Use semantic HTML.

---

# Feature Implementation Order

When adding a new feature:

1. Create database migration (if needed).
2. Update TypeScript types.
3. Implement service layer.
4. Implement Edge Function (if needed).
5. Implement UI.
6. Validate full flow end-to-end.

Do not skip steps.

---

# What NOT To Do

- Do not refactor large sections without instruction.
- Do not change folder structure arbitrarily.
- Do not introduce state management libraries unless required.
- Do not implement features that were not requested.
- Do not alter booking logic assumptions.

---

# Priority

Favor stability, clarity, and clean architecture over speed.
This is a long-term maintainable project.