import {
	type Attributes,
	type Span,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";

export function isTelemetryEnabled() {
	return Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
}

export async function withSpan<T>(
	name: string,
	attributes: Attributes,
	fn: (span?: Span) => Promise<T>,
) {
	if (!isTelemetryEnabled()) {
		return fn();
	}

	const tracer = trace.getTracer("playwright-tutorial-next");

	return tracer.startActiveSpan(name, { attributes }, async (span) => {
		try {
			const result = await fn(span);
			span.setStatus({ code: SpanStatusCode.OK });
			return result;
		} catch (error) {
			span.recordException(error as Error);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		} finally {
			span.end();
		}
	});
}

export async function withActionSpan<T>(
	operation: string,
	fn: (span?: Span) => Promise<T>,
) {
	return withSpan(
		`action.${operation}`,
		{ "app.operation": `action.${operation}` },
		fn,
	);
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
