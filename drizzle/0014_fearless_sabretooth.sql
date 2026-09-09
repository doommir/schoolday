CREATE TABLE `pipeline_contacts` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`email_cipher` text NOT NULL,
	`contact_id` text,
	`state` text NOT NULL,
	`prospect_status` text NOT NULL,
	`customer_status` text NOT NULL,
	`revision` text NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pipeline_contact_updated` ON `pipeline_contacts` (`updated_at`);--> statement-breakpoint
CREATE TABLE `pipeline_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `launch_leads` ADD `pipeline_consent` text;