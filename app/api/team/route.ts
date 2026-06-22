import { getTeamForUser } from "@/lib/db/queries";
import { isFaultActive } from "@/lib/faults";

export async function GET() {
	if (await isFaultActive("api-team-malformed-json")) {
		return new Response("{", {
			status: 200,
			headers: {
				"content-type": "application/json",
				"x-fault-injected": "api-team-malformed-json",
			},
		});
	}

	const team = await getTeamForUser();
	return Response.json(team);
}
