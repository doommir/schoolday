CREATE TABLE `learning_years` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`grade` integer NOT NULL,
	`curriculum_version` text NOT NULL,
	`start_day` integer NOT NULL,
	`total_days` integer DEFAULT 180 NOT NULL,
	`review` text,
	`review_signature` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_year_start` ON `learning_years` (`profile_id`,`start_day`);--> statement-breakpoint
ALTER TABLE `activities` ADD `lesson_key` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `course_context` text;--> statement-breakpoint
ALTER TABLE `days` ADD `learning_year_id` text;--> statement-breakpoint
ALTER TABLE `days` ADD `year_day` integer;