import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { withSpan } from "@/lib/telemetry";
import { db } from "./drizzle";
import {
	activityLogs,
	type TeamDataWithMembers,
	teamMembers,
	teams,
	users,
} from "./schema";

export async function getUser() {
	return withSpan(
		"auth.user.lookup",
		{ "app.operation": "auth.user.lookup" },
		async (span) => {
			const sessionCookie = (await cookies()).get("session");
			if (!sessionCookie?.value) {
				span?.setAttribute("app.authenticated", false);
				span?.setAttribute("app.result", "session_missing");

				return null;
			}

			const sessionData = await withSpan(
				"auth.session.verify",
				{ "app.operation": "auth.session.verify" },
				async () => verifyToken(sessionCookie.value),
			);
			if (!sessionData?.user || typeof sessionData.user.id !== "number") {
				span?.setAttribute("app.authenticated", false);
				span?.setAttribute("app.result", "session_invalid");

				return null;
			}

			if (new Date(sessionData.expires) < new Date()) {
				span?.setAttribute("app.authenticated", false);
				span?.setAttribute("app.result", "session_expired");

				return null;
			}

			const user = await db
				.select()
				.from(users)
				.where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
				.limit(1);

			if (user.length === 0) {
				span?.setAttribute("app.authenticated", false);
				span?.setAttribute("app.result", "user_missing");

				return null;
			}

			span?.setAttribute("app.authenticated", true);
			span?.setAttribute("app.result", "user_found");

			return user[0];
		},
	);
}

export async function updateTeamSubscription(
	teamId: number,
	subscriptionData: {
		planName: string | null;
		subscriptionStatus: string;
	},
) {
	await withSpan(
		"team.subscription.update",
		{
			"app.operation": "team.subscription.update",
			"subscription.status": subscriptionData.subscriptionStatus,
			"subscription.plan": subscriptionData.planName ?? "none",
		},
		async () =>
			db
				.update(teams)
				.set({
					...subscriptionData,
					updatedAt: new Date(),
				})
				.where(eq(teams.id, teamId)),
	);
}

export async function getUserWithTeam(userId: number) {
	const result = await db
		.select({
			user: users,
			teamId: teamMembers.teamId,
		})
		.from(users)
		.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
		.where(eq(users.id, userId))
		.limit(1);

	return result[0];
}

export async function getActivityLogs() {
	return withSpan(
		"activity.logs.get",
		{ "app.operation": "activity.logs.get" },
		async (span) => {
			const user = await getUser();
			if (!user) {
				span?.setAttribute("app.authenticated", false);
				throw new Error("User not authenticated");
			}

			const logs = await db
				.select({
					id: activityLogs.id,
					action: activityLogs.action,
					timestamp: activityLogs.timestamp,
					ipAddress: activityLogs.ipAddress,
					userName: users.name,
				})
				.from(activityLogs)
				.leftJoin(users, eq(activityLogs.userId, users.id))
				.where(eq(activityLogs.userId, user.id))
				.orderBy(desc(activityLogs.timestamp))
				.limit(10);

			span?.setAttribute("activity.count", logs.length);

			return logs;
		},
	);
}

export async function getTeamForUser() {
	return withSpan(
		"team.for_user.get",
		{ "app.operation": "team.for_user.get" },
		async (span) => {
			const user = await getUser();
			if (!user) {
				span?.setAttribute("app.authenticated", false);

				return null;
			}

			const result = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, user.id),
				with: {
					team: {
						with: {
							teamMembers: {
								with: {
									user: {
										columns: {
											id: true,
											name: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!result?.team) {
				span?.setAttribute("app.result", "team_missing");

				return null;
			}

			span?.setAttribute("app.result", "team_found");
			span?.setAttribute("team.member_count", result.team.teamMembers.length);

			return {
				...result.team,
				teamMembers: [...result.team.teamMembers].sort(compareTeamMembers),
			};
		},
	);
}

function compareTeamMembers(
	a: TeamDataWithMembers["teamMembers"][number],
	b: TeamDataWithMembers["teamMembers"][number],
) {
	const roleOrder = roleSortOrder(a.role) - roleSortOrder(b.role);
	if (roleOrder !== 0) return roleOrder;

	return a.joinedAt.getTime() - b.joinedAt.getTime() || a.id - b.id;
}

function roleSortOrder(role: string) {
	return role === "owner" ? 0 : 1;
}
