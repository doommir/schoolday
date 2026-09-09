ALTER TABLE `activities` ADD `superseded_by` text;
--> statement-breakpoint
UPDATE activities SET status='held',phase='held',lock_token=NULL,locked_until=0,error='Earlier pilot lesson: assign a verified standard or create a replacement before continuing.' WHERE standard_id IS NULL AND phase!='routine' AND status!='complete';
