CREATE TABLE `school_records` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`profile_id` text,
	`record_key` text NOT NULL,
	`data` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `school_record_history` ON `school_records` (`profile_id`,`kind`,`record_key`);