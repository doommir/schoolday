CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`subject` text NOT NULL,
	`title` text NOT NULL,
	`goal` text NOT NULL,
	`prerequisite` text NOT NULL,
	`minutes` integer NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`phase` text DEFAULT 'research' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`payload` text,
	`source_pack` text,
	`reviews` text DEFAULT '[]' NOT NULL,
	`error` text,
	`locked_until` integer DEFAULT 0 NOT NULL,
	`lock_token` text
);
--> statement-breakpoint
CREATE INDEX `activities_day` ON `activities` (`day_id`);--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`day` text PRIMARY KEY NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `days` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`day_number` integer NOT NULL,
	`theme` text NOT NULL,
	`question` text NOT NULL,
	`status` text NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `days_profile` ON `days` (`profile_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `days_number` ON `days` (`profile_id`,`day_number`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`kind` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_profile` ON `events` (`profile_id`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`stage` integer NOT NULL,
	`response` text NOT NULL,
	`choice` integer,
	`correct` integer,
	`self_check` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_step` ON `evidence` (`profile_id`,`activity_id`,`stage`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`profile_id` text NOT NULL,
	`ordinal` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_room_profile` ON `members` (`room_code`,`profile_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`session` text NOT NULL,
	`name` text NOT NULL,
	`grade` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_session` ON `profiles` (`session`);--> statement-breakpoint
CREATE TABLE `room_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`profile_id` text NOT NULL,
	`stage` integer NOT NULL,
	`response` text NOT NULL,
	`choice` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_response_stage` ON `room_responses` (`room_code`,`profile_id`,`stage`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`activity_id` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'lobby' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
