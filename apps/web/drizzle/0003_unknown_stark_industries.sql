CREATE TABLE `usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`medicine_id` text NOT NULL,
	`date` text NOT NULL,
	`taken` integer NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usage_logs_user` ON `usage_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `usage_logs_medicine` ON `usage_logs` (`medicine_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `usage_logs_medicine_date` ON `usage_logs` (`medicine_id`,`date`);--> statement-breakpoint
ALTER TABLE `medicines` ADD `archived_at` text;