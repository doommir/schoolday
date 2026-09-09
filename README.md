# Schoolday OS · NovaPath

Parent-led learning software for grades 6–8, with Solo and live/asynchronous Squad workflows.

Current hosted app: https://schoolday-os.sickyicky.chatgpt.site

## Repository status

**Application source import is pending. This repository is not yet deployable.**

The existing application is committed in its Sites-managed source repository at revision `9950a5d7a0118746585ba467807029eb5d900258`. The source transfer was interrupted by a disconnected development workspace on September 9, 2026. This initial commit contains project documentation only; it is not a backup of the application.

## Intended deployment stack

- GitHub: application source and change history.
- Vercel: application hosting and deployment previews.
- Supabase: Postgres database and authentication.

The current app uses vinext, Cloudflare Workers/D1, and Sites-provided adult authentication. It requires a tested runtime, database, and authentication migration before deployment on Vercel/Supabase. Connecting the services alone does not complete that migration.

## Import and migration sequence

1. Import and verify the complete committed source, including assets, dependency lockfile, database migrations and tests.
2. Preserve the current hosted deployment while preparing the migration separately.
3. Port Cloudflare runtime dependencies and SQLite queries/schema to the target runtime and Postgres.
4. Replace Sites identity headers with verified authentication and retain family ownership, parental consent and access controls.
5. Verify learning persistence, Solo/Squad workflows, generation validation, billing events, cancellation and account recovery before production cutover.
6. Configure the chosen production domain, HTTPS, canonical URLs, authentication redirects and payment endpoints.

No Vercel deployment, Supabase Schoolday database or custom-domain configuration is completed by this commit.

## Configuration and data

Store production credentials in the hosting providers' secret/environment settings, not Git. Do not commit live databases, learner records, authentication cookies, API keys or payment secrets. Source import does not migrate production data.

## Product scope

Schoolday is learning software, not school enrollment. AI-generated instruction requires adult oversight. Publication and automated checks do not establish full-year educational effectiveness.
