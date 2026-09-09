CREATE TABLE IF NOT EXISTS `billing_notices` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`subscription_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	`sent_at` text,
	`provider_id` text,
	`error` text,
	`lease` integer DEFAULT 0 NOT NULL
);
