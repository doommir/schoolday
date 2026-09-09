CREATE TABLE `standard_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `standard_id` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `standard_snapshot` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `content_hash` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `generation_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `next_retry_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `days` ADD `lock_token` text;