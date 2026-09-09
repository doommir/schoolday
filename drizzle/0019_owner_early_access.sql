-- Owner authorized launch-check deferral in the Schoolday build chat on 2026-09-09.
-- This changes business availability only; it does not create review/consent/payment evidence.
INSERT INTO settings(id,value)
SELECT 'launch_policy','early-access-owner-approved'
WHERE EXISTS(SELECT 1 FROM settings WHERE id='billing_config')
AND EXISTS(SELECT 1 FROM settings WHERE id='ai_probe' AND value!='null')
ON CONFLICT(id) DO UPDATE SET value=excluded.value;
--> statement-breakpoint
INSERT INTO settings(id,value)
SELECT 'sales_open','true'
WHERE EXISTS(SELECT 1 FROM settings WHERE id='launch_policy' AND value='early-access-owner-approved')
ON CONFLICT(id) DO UPDATE SET value=excluded.value;
