# Arte+ — MusicSite

A lightweight static site for the Arte+ classical trio. Built with Vite and vanilla JavaScript, the project includes a small admin area, booking calendar with availability, and a contact form that writes to Supabase.

## LOGINS за проверка от SoftUni

- acc: velchevADMIN
- pass: parolaadmin

## Features

- Responsive landing, media and booking pages
- Shared `styles/site.css` for consistent look & feel
- Booking calendar with selectable dates and form-based booking inquiries
- Admin UI for reviewing contact messages and booking inquiries
- Supabase migrations in `supabase/migrations` for DB schema and RLS policies

## Repo layout (important files)

- `index.html`, `about.html`, `media.html`, `book.html`, `contact.html` — main pages
- `styles/site.css` — shared stylesheet
- `book-calendar.css` — booking widget styles
- `scripts/` — client-side JS (auth, booking, admin features)
- `supabase/migrations/` — SQL migrations for DB and RLS policies
- `package.json` — npm scripts

## Requirements

- Node.js >= 22.12.0
- npm
- (Optional) Supabase project and CLI to run migrations remotely

## Quick local setup

1. Install dependencies

```bash
npm install
```

2. Start dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

4. Preview production build

```bash
npm run preview
```

## Supabase & Migrations

This project stores contact messages and booking inquiries in Supabase. Migrations are stored in `supabase/migrations`.

To apply migrations to your Supabase project (recommended), install and authenticate the Supabase CLI and run:

```bash
# log in with supabase CLI if not already
supabase login

# set project ref or use environment variables per supabase docs
supabase link --project-ref <your-project-ref>

# apply migrations
supabase migration apply
```

Two migrations added during development are:

- `20260227170000_add_telephone_to_contact_messages.sql` — adds `telephone` column to `contact_messages`
- `20260227173000_admin_delete_contact_messages.sql` — allows admins to delete contact messages via RLS

If you cannot run migrations, the client-side code includes fallback logic so the contact form and admin listing still function (the telephone field will be omitted server-side).

## Environment

By default the client uses the public/publishable Supabase URL and key found in `scripts/supabaseClient.js`. For production you should replace these with your own values or change the client to read from secure env variables.

## Admin

- Admin pages require an admin user defined in the `admins` table. See `supabase/migrations/20260226172323_admin_workflow_and_messages.sql` for policies.
- Admin pages support:
  - Reviewing contact messages (telephone displayed if present)
  - Deleting messages (requires the delete policy to be applied)
  - Managing booking inquiries

## Development notes

- Styling tokens and global UI tweaks live in `styles/site.css`.
- The booking form now uses a 24-hour `HH:MM` two-select UI (`book.html`) to avoid scrolling clock widgets.
- Inline feedback (muted gold) is used instead of `alert()` for form validation and confirmations.

## Troubleshooting

- If admin delete appears to silently fail, ensure the migration that creates the `Admins can delete contact messages` policy is applied.
- If contact messages do not show telephone values, apply the `add_telephone_to_contact_messages` migration.

## License

ISC

---
