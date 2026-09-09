CREATE TABLE `adult_security` (
	`account_id` text PRIMARY KEY NOT NULL,
	`pin_hash` text NOT NULL,
	`salt` text NOT NULL,
	`recovery_hash` text NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
