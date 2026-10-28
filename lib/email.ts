import "server-only";

// Stand-in for a transactional email provider. Most sends are quick but, like
// most third-party APIs, it has a slow tail.
export async function sendInvitationEmail(email: string, role: string) {
	const latencyMs =
		Math.random() < 0.15
			? 6000 + Math.random() * 3000
			: 50 + Math.random() * 100;
	await new Promise((resolve) => setTimeout(resolve, latencyMs));
	console.log(
		`[email] sent ${role} invitation to ${email} in ${Math.round(latencyMs)}ms`,
	);
}
