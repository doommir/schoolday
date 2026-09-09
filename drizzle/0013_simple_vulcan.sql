CREATE TABLE `family_journal` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`school_year` text NOT NULL,
	`school_date` text NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_journal_date_revision` ON `family_journal` (`account_id`,`profile_id`,`school_date`,`revision`);--> statement-breakpoint
CREATE INDEX `family_journal_year` ON `family_journal` (`account_id`,`profile_id`,`school_year`);--> statement-breakpoint
CREATE TABLE `family_setups` (
	`account_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`school_year` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `family_setup_owner_year` ON `family_setups` (`account_id`,`profile_id`,`school_year`);--> statement-breakpoint
CREATE TABLE `launch_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`target_id` text NOT NULL,
	`signature` text NOT NULL,
	`content_hash` text NOT NULL,
	`notes` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `launch_review_target` ON `launch_reviews` (`kind`,`target_id`,`signature`);--> statement-breakpoint
ALTER TABLE `activities` ADD `generation_signature` text;
--> statement-breakpoint
UPDATE settings SET value='false' WHERE id='sales_open';
