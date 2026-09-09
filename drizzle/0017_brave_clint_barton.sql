CREATE TABLE IF NOT EXISTS `family_consents` (
	`account_id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`status` text NOT NULL,
	`squads` integer DEFAULT 0 NOT NULL,
	`requested_at` text NOT NULL,
	`verified_at` text,
	`verified_by` text,
	`method` text,
	`reference` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `learner_lifecycle` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);

--> statement-breakpoint
INSERT OR IGNORE INTO learner_lifecycle SELECT id,CAST(strftime('%s','now') AS INTEGER)*1000+31536000000 FROM profiles;
