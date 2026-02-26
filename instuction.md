# Supabase Migration Rules

## 1. Never modify the database schema directly in the Supabase Dashboard.
All structural changes must be done through migration files.

## 2. Always create a migration before changing schema.
Use:
supabase migration new <migration_name>

Do not write schema changes without generating a migration file first.

## 3. Never edit an old migration that has already been pushed.
Create a new migration instead of modifying history.

## 4. Keep migrations atomic.
Each migration should contain one logical change (e.g., create table, add column, create index).

## 5. Use enums for status fields.
Do not use free-text strings for statuses such as booking states.

## 6. Always include timestamps.
Every table must contain:
- created_at (default now())
- updated_at (default now())

## 7. Add indexes where necessary.
Foreign keys and frequently queried columns must have proper indexes.

## 8. Prevent destructive changes without confirmation.
Never drop tables or columns unless explicitly instructed.

## 9. After schema changes, regenerate types.
If using TypeScript, update generated database types after running migrations.

## 10. Verify before push.
Always run:
supabase db push
and confirm there are no errors before committing changes.

## 11. Keep remote and local migrations in sync at all times.
Every Supabase migration applied to the project must also exist in this repo under:
- supabase/migrations/

If a migration exists remotely but not locally, create the missing local file immediately before continuing work.

## 12. Required workflow for every DB change.
1. Create local migration file in `supabase/migrations/<timestamp>_<name>.sql`
2. Apply migration to Supabase
3. Confirm migration appears in remote list
4. Commit code + migration file together

Do not ship DB changes without the matching SQL migration file in the repository.