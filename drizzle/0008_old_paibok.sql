CREATE TABLE `launch_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`audience` text NOT NULL,
	`source` text NOT NULL,
	`consent_version` text NOT NULL,
	`delete_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `launch_lead_email` ON `launch_leads` (`email`);--> statement-breakpoint
CREATE TABLE `lead_limits` (
	`id` text NOT NULL,
	`day` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lead_limits_day` ON `lead_limits` (`id`,`day`);