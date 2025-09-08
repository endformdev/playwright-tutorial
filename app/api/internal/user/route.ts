import { eq } from "drizzle-orm";
import { createSession, hashPassword } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";

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

		const passwordHash = await hashPassword(password);

		const createdUser = (
			await db
				.insert(users)
				.values({ email, passwordHash, role: "member" })
				.returning({ id: users.id, email: users.email })
		)[0];

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

		await db.delete(users).where(eq(users.email, email));

		return new Response("", { status: 200 });
	} catch (error) {
		return Response.json(
			{ error: `Failed to delete user: ${error}` },
			{ status: 500 },
		);
	}
}
