CREATE TABLE `lead_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`payload` text,
	`revision` text NOT NULL,
	`provider_id` text,
	`error` text,
	`lease` integer DEFAULT 0 NOT NULL,
	`lock_token` text,
	`first_attempt` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lead_email_owner` ON `lead_emails` (`lead_id`);--> statement-breakpoint
ALTER TABLE `launch_leads` ADD `confirmed_at` text;--> statement-breakpoint
ALTER TABLE `launch_leads` ADD `email_token` text;