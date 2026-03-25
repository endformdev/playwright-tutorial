import { hashPassword } from "@/lib/auth/session";
import { db } from "./drizzle";
import { teamMembers, teams, users } from "./schema";

function assertSafeSeedTarget() {
	const databaseUrl = process.env.DATABASE_URL?.trim();

	if (!databaseUrl || databaseUrl.startsWith("http")) {
		throw new Error(
			"Refusing to seed the shared remote demo database. Run `pnpm db:setup` first or set DATABASE_URL to a local SQLite file or a dedicated Turso database.",
		);
	}
}

async function seed() {
	assertSafeSeedTarget();

	console.log("Seeding database with initial data...");

	const email = "test@test.com";
	const password = "admin123";
	const passwordHash = await hashPassword(password);

	const [user] = await db
		.insert(users)
		.values([
			{
				email: email,
				passwordHash: passwordHash,
				role: "owner",
			},
		])
		.returning();

	console.log("Initial user created.");

	const [team] = await db
		.insert(teams)
		.values({
			name: "Test Team",
		})
		.returning();

	await db.insert(teamMembers).values({
		teamId: team.id,
		userId: user.id,
		role: "owner",
	});

	console.log("Sample team and membership created.");
	console.log("");
	console.log("🎉 Database seeded successfully!");
	console.log("");
	console.log("You can now sign in with:");
	console.log(`Email: ${email}`);
	console.log(`Password: ${password}`);
}

seed()
	.catch((error) => {
		console.error("Seed process failed:", error);
		process.exit(1);
	})
	.finally(() => {
		console.log("Seed process finished. Exiting...");
		process.exit(0);
	});
