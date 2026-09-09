CREATE TABLE `device_codes` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_code_hash` ON `device_codes` (`code_hash`);--> statement-breakpoint
CREATE TABLE `learner_usage` (
	`profile_id` text NOT NULL,
	`day` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_usage_day` ON `learner_usage` (`profile_id`,`day`);--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`livemode` integer NOT NULL,
	`status` text NOT NULL,
	`lease` integer DEFAULT 0 NOT NULL,
	`token` text,
	`error` text,
	`created_at` text NOT NULL
);
