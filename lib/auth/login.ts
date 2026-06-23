import { and, eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import {
	ActivityType,
	invitations,
	type NewTeam,
	type NewTeamMember,
	type NewUser,
	teamMembers,
	teams,
	users,
} from "@/lib/db/schema";
import { isFaultActive } from "@/lib/faults";
import { withSpan } from "@/lib/telemetry";
import { logActivity } from "./activity";

export async function signup(
	email: string,
	password: string,
	inviteId?: string,
) {
	return withSpan(
		"auth.signup",
		{
			"app.operation": "auth.signup",
			"auth.invitation_present": Boolean(inviteId),
		},
		async (span) => {
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.email, email))
				.limit(1);

			if (existingUser.length > 0) {
				span?.setAttribute("app.result", "user_exists");

				return {
					error: "Failed to create user. Please try again.",
					email,
					password,
				};
			}

			const passwordHash = await hashPassword(password);

			const newUser: NewUser = {
				email,
				passwordHash,
				role: "owner", // Default role, will be overridden if there's an invitation
			};

			const [createdUser] = await db.insert(users).values(newUser).returning();

			if (!createdUser) {
				span?.setAttribute("app.result", "user_create_failed");

				return {
					error: "Failed to create user. Please try again.",
					email,
					password,
				};
			}

			let teamId: number;
			let userRole: string;
			let createdTeam: typeof teams.$inferSelect | null = null;

			if (inviteId) {
				// Check if there's a valid invitation
				const [invitation] = await db
					.select()
					.from(invitations)
					.where(
						and(
							eq(invitations.id, parseInt(inviteId, 10)),
							eq(invitations.email, email),
							eq(invitations.status, "pending"),
						),
					)
					.limit(1);

				if (invitation) {
					teamId = invitation.teamId;
					userRole = (await isFaultActive("invite-role-drift"))
						? "owner"
						: invitation.role;

					await db
						.update(invitations)
						.set({ status: "accepted" })
						.where(eq(invitations.id, invitation.id));

					await logActivity(
						teamId,
						createdUser.id,
						ActivityType.ACCEPT_INVITATION,
					);

					[createdTeam] = await db
						.select()
						.from(teams)
						.where(eq(teams.id, teamId))
						.limit(1);
				} else {
					span?.setAttribute("app.result", "invitation_invalid");

					return { error: "Invalid or expired invitation.", email, password };
				}
			} else {
				// Create a new team if there's no invitation
				const newTeam: NewTeam = {
					name: `${email}'s Team`,
				};

				[createdTeam] = await db.insert(teams).values(newTeam).returning();

				if (!createdTeam) {
					span?.setAttribute("app.result", "team_create_failed");

					return {
						error: "Failed to create team. Please try again.",
						email,
						password,
					};
				}

				teamId = createdTeam.id;
				userRole = "owner";

				await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM);
			}

			const newTeamMember: NewTeamMember = {
				userId: createdUser.id,
				teamId: teamId,
				role: userRole,
			};

			const skipTeamMembership =
				Boolean(inviteId) &&
				(await isFaultActive("invite-accepted-but-member-missing"));

			await Promise.all([
				...(skipTeamMembership
					? []
					: [db.insert(teamMembers).values(newTeamMember)]),
				logActivity(teamId, createdUser.id, ActivityType.SIGN_UP),
			]);

			span?.setAttribute(
				"app.result",
				skipTeamMembership ? "team_membership_skipped" : "user_created",
			);

			return createdUser as NewUser;
		},
	);
}
