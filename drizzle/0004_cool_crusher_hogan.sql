CREATE TABLE `account_learners` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_roster` ON `account_learners` (`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `checkout_attempts` (
	`session_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checkout_account` ON `checkout_attempts` (`account_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`quantity` integer NOT NULL,
	`period_end` integer NOT NULL,
	`cancel_at_end` integer DEFAULT 0 NOT NULL,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_account` ON `subscriptions` (`account_id`);