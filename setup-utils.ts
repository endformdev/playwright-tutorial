import fs from "node:fs";

export interface ApiUser {
	email: string;
	password: string;
	session: string;
}

export async function createUser(baseURL: string): Promise<ApiUser> {
	const email = `${Math.random().toString(36).substring(2, 15)}@example.com`;
	const password = "testpassword123";

	const response = await fetch(`${baseURL}/api/internal/user`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			authorization: "Bearer VerySecretDummyToken",
		},
		body: JSON.stringify({ email, password }),
	});
	const data = (await response.json()) as { session: string };
	if (!data.session) {
		throw new Error("Failed to create user");
	}

	return { email, password, session: data.session };
}

export async function deleteUser(baseURL: string, email: string) {
	const response = await fetch(`${baseURL}/api/internal/user`, {
		method: "DELETE",
		headers: {
			"content-type": "application/json",
			authorization: "Bearer VerySecretDummyToken",
		},
		body: JSON.stringify({ email }),
	});
	const data = await response.json().catch(() => null);

	return data;
}

export async function createUserInFile(baseURL: string, userKindName: string) {
	try {
		const { email, session } = await createUser(baseURL);

		fs.mkdirSync(".auth", { recursive: true });
		writeEmailFile(email, `.auth/${userKindName}-user-email.txt`);
		writeSessionFile(session, baseURL, `.auth/${userKindName}-user.json`);
	} catch (error) {
		console.error("[setup-utils] error creating user:", error);
	}
}

export async function deleteUserFromFile(
	baseURL: string,
	userKindName: string,
) {
	const email = readEmailFile(`.auth/${userKindName}-user-email.txt`);

	try {
		await deleteUser(baseURL, email);
		// console.log("[setup-utils] delete user status:", response.status);
		// console.log("[setup-utils] delete user body:", data);
		fs.unlinkSync(`.auth/${userKindName}-user-email.txt`);
		fs.unlinkSync(`.auth/${userKindName}-user.json`);
	} catch (error) {
		console.error("[setup-utils] error deleting user:", error);
	}
}

export function getCookieForSession(session: string, baseURL: string) {
	return {
		name: "session",
		value: session,
		domain: new URL(baseURL).hostname,
		path: "/",
		// Playwright will delete the cookie when the test is done
		expires: -1,
		httpOnly: true,
		secure: true,
		sameSite: "Lax" as const,
	};
}

function writeEmailFile(email: string, filePath: string) {
	fs.writeFileSync(filePath, email);
}

function readEmailFile(filePath: string) {
	return fs.readFileSync(filePath, "utf8");
}

function writeSessionFile(session: string, baseURL: string, filePath: string) {
	fs.writeFileSync(
		filePath,
		JSON.stringify({
			cookies: [getCookieForSession(session, baseURL)],
			origins: [],
		}),
	);
}
