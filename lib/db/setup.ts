import { execSync } from "node:child_process";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getLocalDatabasePath } from "./config";

function generateAuthSecret(): string {
	console.log("Step 1: Generating AUTH_SECRET...");
	return crypto.randomBytes(32).toString("hex");
}

async function writeEnvFile(envVars: Record<string, string>) {
	console.log("Step 3: Writing environment variables to .env");
	const envContent = Object.entries(envVars)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");

	await fs.writeFile(path.join(process.cwd(), ".env"), envContent);
	console.log(".env file created with the necessary variables.");
}

async function main() {
	console.log("🚀 Switching this project to local SQLite mode...\n");

	const DATABASE_URL = getLocalDatabasePath();
	const BASE_URL = "http://localhost:3000";
	const AUTH_SECRET = generateAuthSecret();

	await writeEnvFile({
		DATABASE_URL,
		BASE_URL,
		AUTH_SECRET,
	});

	console.log("Running database migrations...");
	execSync("pnpm db:migrate", { stdio: "inherit" });

	console.log("\n🎉 Setup completed successfully!");
	console.log("\nNext steps:");
	console.log("1. Run `pnpm db:seed` if you want sample local data");
	console.log("2. Run `pnpm dev` to start the development server");
}

main().catch(console.error);
