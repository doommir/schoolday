-- Resume the owner's existing early-access policy after the recorded successful provider test.
-- Runtime salesOpen still checks the current generation fingerprint and all technical requirements.
UPDATE settings SET value='true' WHERE id='sales_open' AND value='false'
AND EXISTS (SELECT 1 FROM settings WHERE id='launch_policy' AND value='early-access-owner-approved')
AND EXISTS (SELECT 1 FROM settings WHERE id='ai_probe' AND json_extract(value,'$.signature')='d41a9650794bccc3db715afaa1a09f87307b2039e4dfc287ca8d45e14b434965' AND json_extract(value,'$.checkedAt')='2026-09-09T04:02:42.765Z');
