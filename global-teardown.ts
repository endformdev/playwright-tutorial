import { baseURL } from "./playwright.config";
import { deleteUserFromFile } from "./setup-utils";

export default async function globalTeardown() {
	await deleteUserFromFile(baseURL, "api");
}
