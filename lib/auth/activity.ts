import { db } from "@/lib/db/drizzle";
import {
	type ActivityType,
	activityLogs,
	type NewActivityLog,
} from "@/lib/db/schema";
import { withSpan } from "@/lib/telemetry";

export async function logActivity(
	teamId: number | null | undefined,
	userId: number,
	type: ActivityType,
	ipAddress?: string,
) {
	await withSpan(
		"activity.log",
		{
			"app.operation": "activity.log",
			"activity.type": type,
		},
		async (span) => {
			if (teamId === null || teamId === undefined) {
				span?.setAttribute("app.result", "team_missing");

				return;
			}

			const newActivity: NewActivityLog = {
				teamId,
				userId,
				action: type,
				ipAddress: ipAddress || "",
			};

			await db.insert(activityLogs).values(newActivity);

			span?.setAttribute("app.result", "activity_created");
		},
	);
}
