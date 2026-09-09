CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`stage` integer NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`choice` integer,
	`self_check` text DEFAULT '[]' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `draft_step` ON `drafts` (`profile_id`,`activity_id`,`stage`);--> statement-breakpoint
CREATE TABLE `learning_state` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'solo' NOT NULL,
	`activity_id` text,
	`stage` integer DEFAULT 0 NOT NULL,
	`room_code` text,
	`paused` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `squad_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`profile_id` text NOT NULL,
	`target_id` text NOT NULL,
	`response` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `squad_reply_target` ON `squad_replies` (`room_code`,`profile_id`,`target_id`);--> statement-breakpoint
CREATE INDEX `squad_replies_room` ON `squad_replies` (`room_code`);--> statement-breakpoint
ALTER TABLE `members` ADD `pacing` text DEFAULT 'follow' NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `mode` text DEFAULT 'live' NOT NULL;