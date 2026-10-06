# Parent math guide correction and comparison support — October 6, 2026

## Scope and reason

Improve the existing public `/resources/middle-school-math-check-at-home` guide only. No new guide, Site, price, payment setting, generation rule, launch gate or email campaign.

Parent question: why is a lower hourly rate not always cheaper when there is a starting fee? This is an editorial response to a concrete instructional gap, not evidence of search volume or customer demand.

The grade 8 worked answer incorrectly gave $49 for `3 × 8 + 5`; corrected to $29. Added an original two-plan table at 0, 2, 4, 5 and 8 hours, an explanation of the five-hour break-even point, prompts for two likely misconceptions, and a six-hour transfer question ($23 versus $24). Hints and worked answers remain collapsed separately; the comparison question is visible before the answer. The table has a caption, column and row headers, wrapping cells and a container-relative width.

Primary source checked October 6: [IES, Improving Mathematical Problem Solving in Grades 4 Through 8](https://ies.ed.gov/ncee/wwc/PracticeGuide/16), revised October 2018. It recommends reflection, visual representations and multiple strategies. These recommendations inform the parent support approach; the original rental example is not an IES assessment, endorsement or evidence of Schoolday effectiveness.

## Verification before publication

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- Sites `build-site.mjs` / existing bounded production build: passed.
- `node --test tests/rendered-html.test.mjs tests/workflow.test.mjs tests/pricing-revision.test.mjs`: 12 passed, 0 failed.
- Rendered response regression checks confirm corrected prose, all table rows and their arithmetic, table inside the collapsed grade 8 answer, all three grade-specific sample campaign links, internal guide links, public resources index and sitemap coverage.
- Existing workflow checks cover preserving grade and campaign through preview/sign-in/checkout return, saved-work continuation and sample restoration. Pricing checks preserve the new $49 and legacy-price mapping.
- Git diff limited to guide data, guide renderer, scoped table styling, regression checks and this record. No provider calls, learner data collection, checkout or production writes were used for tests.
- User-facing preview was skipped because this is unattended work. No interactive browser or real purchase-to-generated-day verification is claimed.

## Production evidence and blockers

Read-only Sites production database inspection October 6 returned complete empty tables (no additional pages): `launch_leads`, `checkout_attempts`, `subscriptions`. These app records do not constitute a Stripe-account audit. Visitor/sample analytics are inaccessible; no conversion rate, traffic gain or new paying customer is verified.

Custom-domain refresh October 6: `schoolday.novapath.dev` remains pending; TLS is pending validation. Keep using the existing public Sites origin. Recorded email-sender and real purchase-to-generated-day gaps remain unverified in this pass; no access or readiness claim was upgraded.

## Distribution opportunities — owner review only

Rules checked October 6. Nothing submitted, posted, emailed or purchased in this pass.

1. [r/HomeschoolResources pinned welcome](https://www.reddit.com/r/HomeschoolResources/comments/kbu4qr/welcome_to_rhomeschoolresources_feel_free_to_post/) explicitly permits free or paid homeschool resources. Best matched next action is the existing founder-disclosed math-guide post after the account security lock recorded September 30 is resolved. Lock resolution was not verified here; do not evade it. Use the existing `reddit_homeschoolresources` campaign source.
2. [Free Homeschool Deals](https://www.freehomeschooldeals.com/submit/) accepts homeschool/family-friendly freebies from companies; requires original third-person copy of at least 150 words, a preview graphic (preferably 1000×1500), no affiliate links, and editorial selection. Its current public page instructs submission by email with subject “Freebie submission.” Review the already-sent September 30 eligibility inquiry before further contact; no duplicate inquiry. Campaign: `fhd_editorial`.
3. [Family Learning Lab](https://familylearninglab.org/submit-listing/) accepts resources accessible to greater Sacramento families, explicitly including online services; website required, manually reviewed, form asks for location, payment methods and charter vendor status. No listing fee is stated on this form; free placement is not verified. Do not claim charter approval. Proposed campaign: `family_learning_lab`.

## Publication and rollback

Publish only the archive built from this exact source through the existing public Site. The native deployment status establishes publication; source push and this record alone do not. Sites retains the saved-version/deployment relationship. The baseline was version 36, source `6d040bea4a6f4f37e776be1986f0820651395472`.

If styling needs rollback, revert the table markup/styles while retaining the $29 correction. Do not restore the incorrect worked answer. The unchanged live-learning and billing gates must remain in force.
