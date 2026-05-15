CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text,
	`doctor_name` text,
	`prescription_date` text NOT NULL,
	`notes` text,
	`medicines_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `prescriptions_user` ON `prescriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `prescriptions_profile` ON `prescriptions` (`profile_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`relation` text,
	`color` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profiles_user` ON `profiles` (`user_id`);--> statement-breakpoint
ALTER TABLE `medicines` ADD `profile_id` text REFERENCES profiles(id);--> statement-breakpoint
CREATE INDEX `medicines_profile` ON `medicines` (`profile_id`);