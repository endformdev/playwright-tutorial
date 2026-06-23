function backendOtelEnabled() {
	return Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
}

export async function register() {
	if (!backendOtelEnabled()) {
		return;
	}

	const { registerOTel } = await import("@vercel/otel");

	registerOTel({
		serviceName: process.env.OTEL_SERVICE_NAME || "playwright-tutorial-next",
		traceSampler: "always_on",
		attributes: {
			"service.namespace": "playwright-tutorial",
			"endform.telemetry.source": "next-app",
		},
	});
}
