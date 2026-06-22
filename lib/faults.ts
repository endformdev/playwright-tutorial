import "server-only";

import { headers } from "next/headers";

const FAULT_HEADER = "x-faults";

export async function isFaultActive(faultName: string) {
	return (await headers()).get(FAULT_HEADER)?.trim() === faultName;
}
