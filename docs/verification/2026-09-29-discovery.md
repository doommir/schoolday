# Schoolday discovery release — September 29, 2026

## Parent question

What does “standards-aligned” actually mean when a family evaluates a middle-school learning app?

This question was selected from a gap in the existing curriculum checklist. It is an editorial decision, not evidence of search volume or customer demand.

## Change

- Reworked the existing curriculum checklist into a one-lesson and one-year audit.
- Added direct grade 6, 7 and 8 sample paths with campaign source `guide_middle_school_curriculum_checklist`.
- Added links to the math-check and schedule guides; the resource remains covered by the existing resource index and sitemap.
- Separated curriculum-quality review from state schooling routes, filings and records.
- Preserved the free fixed samples versus generated-learning distinction and all launch, payment and pricing gates.

## Primary sources checked

- California Department of Education, Search the California Content Standards, checked September 29, 2026: https://www2.cde.ca.gov/cacs/ela
- California Department of Education, Private Schools and Schooling at Home, checked September 29, 2026: https://www.cde.ca.gov/sp/ps/homeschool.asp

The guide does not claim that Schoolday covers all 12 California standards categories, enrolls a learner, determines legal compliance or establishes educational effectiveness.

## Verification

TypeScript and the production build passed. All 24 targeted checks passed across rendered public routes, the curriculum checklist, grade/campaign continuity, family entry and the protected Stripe bootstrap. These checks used local fixtures and mocked providers; they do not establish live checkout, live generation, learner outcomes or legal compliance.
