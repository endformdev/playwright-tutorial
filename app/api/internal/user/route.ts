import { and, eq } from "drizzle-orm";
import { signup } from "@/lib/auth/login";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { teamMembers, users } from "@/lib/db/schema";

function isAuthorized(request: Request) {
	const authHeader = request.headers.get("authorization");
	if (!authHeader) return false;
	const [scheme, token] = authHeader.split(" ");
	return scheme === "Bearer" && token === "VerySecretDummyToken";
}

export async function POST(request: Request) {
	if (!isAuthorized(request)) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const { email, password } = await request.json();
		if (!email || !password) {
			return new Response("Missing email or password", { status: 400 });
		}

		const createdUser = await signup(email, password, undefined);

		if ("error" in createdUser) {
			return new Response(createdUser.error, { status: 400 });
		}

		const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const encryptedSession = await createSession(
			createdUser.id!,
			expiresInOneDay,
		);

		return Response.json({
			user: createdUser,
			session: encryptedSession,
		});
	} catch (error) {
		return Response.json(
			{ error: `Failed to create user: ${error}` },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	if (!isAuthorized(request)) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const { email } = await request.json();
		if (!email) {
			return new Response("Missing email", { status: 400 });
		}
		console.log("[DELETE] email:", email);

		// Check if user exists before attempting to delete
		const existingUserRows = await db
			.select({
				user: users,
				teamId: teamMembers.teamId,
			})
			.from(users)
			.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
			.where(eq(users.email, email));
		if (existingUserRows.length === 0) {
			return new Response("User not found", { status: 404 });
		}

		for (const existingUserRow of existingUserRows) {
			if (existingUserRow.teamId) {
				await db
					.delete(teamMembers)
					.where(
						and(
							eq(teamMembers.userId, existingUserRow.user.id),
							eq(teamMembers.teamId, existingUserRow.teamId),
						),
					);
			}
		}

		await db.delete(users).where(eq(users.email, email));

		return new Response("", { status: 200 });
	} catch (error) {
		return Response.json(
			{ error: `Failed to delete user: ${error}` },
			{ status: 500 },
		);
	}
}
