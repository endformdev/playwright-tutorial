type RetryOptions = {
	attempts?: number;
	baseDelayMs?: number;
};

// The database proxy occasionally drops a request while it fails over. Most of
// those requests succeed if we try again a moment later, so retry with
// exponential backoff before giving up.
export async function withRetry<T>(
	operation: () => Promise<T>,
	{ attempts = 3, baseDelayMs = 100 }: RetryOptions = {},
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (attempt === attempts) break;

			const delayMs = baseDelayMs * 2 ** (attempt - 1);
			console.warn(
				`[retry] attempt ${attempt} of ${attempts} failed, retrying in ${delayMs}ms`,
				error,
			);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	throw lastError;
}
