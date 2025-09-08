import fs from "node:fs";

export async function createUser(baseURL: string, userKindName: string) {
	const email = `${Math.random().toString(36).substring(2, 15)}@example.com`;
	const password = "testpassword123";

	try {
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

		writeEmailFile(email, `.auth/${userKindName}-user-email.txt`);
		writeSessionFile(data.session, baseURL, `.auth/${userKindName}-user.json`);
	} catch (error) {
		console.error("[setup-utils] error creating user:", error);
	}
}

export async function deleteUser(baseURL: string, userKindName: string) {
	const email = readEmailFile(`.auth/${userKindName}-user-email.txt`);

	try {
		const response = await fetch(`${baseURL}/api/internal/user`, {
			method: "DELETE",
			headers: {
				"content-type": "application/json",
				authorization: "Bearer VerySecretDummyToken",
			},
			body: JSON.stringify({ email }),
		});
		const data = await response.json().catch(() => null);
		// console.log("[setup-utils] delete user status:", response.status);
		// console.log("[setup-utils] delete user body:", data);
		fs.unlinkSync(`.auth/${userKindName}-user-email.txt`);
		fs.unlinkSync(`.auth/${userKindName}-user.json`);
	} catch (error) {
		console.error("[setup-utils] error deleting user:", error);
	}
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
			cookies: [
				{
					name: "session",
					value: session,
					domain: new URL(baseURL).hostname,
					path: "/",
					// Playwright will delete the cookie when the test is done
					expires: -1,
					httpOnly: true,
					secure: true,
					sameSite: "Lax",
				},
			],
			origins: [],
		}),
	);
}
