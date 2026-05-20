import { baseURL } from "./playwright.config";
import { createUserInFile } from "./setup-utils";

export default async function globalSetup() {
	await createUserInFile(baseURL, "api");
}
