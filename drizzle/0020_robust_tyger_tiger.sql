ALTER TABLE `billing_notices` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_notices` ADD `first_attempt` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `billing_notices` ADD `next_attempt` integer DEFAULT 0 NOT NULL;