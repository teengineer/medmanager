CREATE TABLE `medicine_use_cases` (
	`medicine_id` text NOT NULL,
	`use_case_id` text NOT NULL,
	PRIMARY KEY(`medicine_id`, `use_case_id`),
	FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`use_case_id`) REFERENCES `use_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`active_ingredient` text,
	`strength` text,
	`form` text,
	`barcode` text,
	`expiry_date` text NOT NULL,
	`opened_at` text,
	`opened_shelf_life_days` integer,
	`quantity` text DEFAULT '1' NOT NULL,
	`unit` text DEFAULT 'unit' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `medicines_user` ON `medicines` (`user_id`);--> statement-breakpoint
CREATE INDEX `medicines_user_expiry` ON `medicines` (`user_id`,`expiry_date`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refresh_tokens_hash_unique` ON `refresh_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `use_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name_tr` text NOT NULL,
	`name_en` text NOT NULL,
	`icd10_code` text,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `use_cases_slug_user` ON `use_cases` (`slug`,`user_id`);--> statement-breakpoint
CREATE INDEX `use_cases_user` ON `use_cases` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text DEFAULT '' NOT NULL,
	`first_name` text,
	`last_name` text,
	`locale` text DEFAULT 'tr' NOT NULL,
	`time_zone` text DEFAULT 'Europe/Istanbul' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);