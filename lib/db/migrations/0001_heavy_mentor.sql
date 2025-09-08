PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`timestamp` integer NOT NULL,
	`ip_address` text,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_activity_logs`("id", "team_id", "user_id", "action", "timestamp", "ip_address") SELECT "id", "team_id", "user_id", "action", "timestamp", "ip_address" FROM `activity_logs`;--> statement-breakpoint
DROP TABLE `activity_logs`;--> statement-breakpoint
ALTER TABLE `__new_activity_logs` RENAME TO `activity_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;