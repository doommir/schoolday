# Customer readiness audit — September 29, 2026

## Verified live

- Public family landing page resolves to the $29/month purchase option after its API request finishes. Family entry reaches adult ChatGPT sign-in without charging or collecting learner data first.
- Stored sales_open is true; the current early-access policy still checks technical readiness before offering checkout.
- Live NovaPath Stripe webhook is enabled for Schoolday's payment endpoint, using API version 2026-08-26.dahlia, including completed and delayed successful checkout events, subscription lifecycle events, paid invoices and failed invoices.
- Live billing portal configuration is active. Invoice history, payment-method changes, quantity updates and cancellation at period end are enabled. Its terms and privacy links point to this Site.
- Recent production error-log query returned no events; this does not prove all customer journeys succeed.
- Stored provider probe passed September 9 using gpt-4.1. This audit did not repeat live AI generation.

## Fix

The family offer previously treated pending and failed availability requests as a closed pilot. It now distinguishes loading, open, closed and unavailable states, bounds the request to 15 seconds and offers a retry after failures. The paid entry link retains the URL's grade and campaign context. No prices, payment gates, consent rules or generation checks changed.

## Verification and limits

65 targeted fixture-based tests passed across payment lifecycle, customer launch controls, family entry, privacy, generation resilience and source-search compatibility. Mocked tests do not prove a real card purchase, parent verification, generated first day, delivery of email, or educational effectiveness.

Owner authentication was not present in this browser. A completed real customer checkout and generated first day remain unverified. No card was charged, no learner was invented, and no email was sent.

App-managed email sender is not configured in settings. Schoolday has no recorded subscriptions or checkout attempts in its current app database. This is not a visitor count. Custom-domain validation remains pending; use the current public Site URL until connected.

Release scope is a parent-supervised early-access software offer, not a verified full-year school service or a fully unattended operation.
