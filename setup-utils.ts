import fs from "node:fs";
import type { BrowserContext } from "@playwright/test";

export interface ApiUser {
	email: string;
	password: string;
	session: string;
}

export async function createUser(baseURL: string): Promise<ApiUser> {
	const email = `${Math.random().toString(36).substring(2, 15)}@example.com`;
	const password = "testpassword123";

	const headers = new Headers({
		"content-type": "application/json",
		authorization: "Bearer VerySecretDummyToken",
	});

	if (process.env.VERCEL_BYPASS_TOKEN)
		headers.set("x-vercel-protection-bypass", process.env.VERCEL_BYPASS_TOKEN);
	await setNetlifyPasswordCookie(headers, baseURL);

	const response = await fetch(`${baseURL}/api/internal/user`, {
		method: "POST",
		headers,
		body: JSON.stringify({ email, password }),
	});

	let data: { session: string };

	const textResponse = await response.text();
	try {
		data = JSON.parse(textResponse);
	} catch {
		throw new Error(
			`Failed to parse response (${response.status} ${response.statusText}): ${textResponse}`,
		);
	}

	if (!data.session) {
		throw new Error("Failed to create user");
	}

	return { email, password, session: data.session };
}

export async function deleteUser(baseURL: string, email: string) {
	const headers = new Headers({
		"content-type": "application/json",
		authorization: "Bearer VerySecretDummyToken",
	});

	if (process.env.VERCEL_BYPASS_TOKEN)
		headers.set("x-vercel-protection-bypass", process.env.VERCEL_BYPASS_TOKEN);
	await setNetlifyPasswordCookie(headers, baseURL);

	const response = await fetch(`${baseURL}/api/internal/user`, {
		method: "DELETE",
		headers,
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

let netlifyPasswordCookie: Promise<{ name: string; value: string } | null>;

// Netlify answers every request to a password-protected deploy with its
// password page until the request carries the cookie that page sets. Posting
// the password once gets that cookie, which works for the whole deploy.
export function getNetlifyPasswordCookie(baseURL: string) {
	const password = process.env.E2E_NETLIFY_PREVIEW_PASSWORD;
	if (!password) return Promise.resolve(null);

	netlifyPasswordCookie ??= fetch(baseURL, {
		method: "POST",
		body: new URLSearchParams({ password }),
		redirect: "manual",
	}).then((response) => {
		const [cookie] = response.headers.getSetCookie();
		if (!cookie) {
			throw new Error(
				`Netlify rejected E2E_NETLIFY_PREVIEW_PASSWORD (${response.status})`,
			);
		}

		const [name, value] = cookie.split(";")[0]!.split("=");

		return { name: name!, value: value! };
	});

	return netlifyPasswordCookie;
}

export async function addNetlifyPasswordCookie(
	context: BrowserContext,
	baseURL: string,
) {
	const cookie = await getNetlifyPasswordCookie(baseURL);
	if (!cookie) return;

	await context.addCookies([
		{
			...cookie,
			domain: new URL(baseURL).hostname,
			path: "/",
			httpOnly: true,
			secure: true,
		},
	]);
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

async function setNetlifyPasswordCookie(headers: Headers, baseURL: string) {
	const cookie = await getNetlifyPasswordCookie(baseURL);
	if (cookie) headers.set("cookie", `${cookie.name}=${cookie.value}`);
}
