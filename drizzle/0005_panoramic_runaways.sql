CREATE TABLE `help_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`stage` integer NOT NULL,
	`question` text NOT NULL,
	`response` text,
	`responder` text,
	`status` text NOT NULL,
	`open_key` text,
	`created_at` text NOT NULL,
	`answered_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `help_open_step` ON `help_requests` (`open_key`);--> statement-breakpoint
CREATE INDEX `help_profile_status` ON `help_requests` (`profile_id`,`status`);--> statement-breakpoint
CREATE TABLE `learner_preferences` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`preferences` text NOT NULL,
	`updated_at` text NOT NULL
);
