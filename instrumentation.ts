import { registerOTel } from "@vercel/otel";

function backendOtelEnabled() {
	return Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
}

export function register() {
	if (!backendOtelEnabled()) {
		return;
	}

	registerOTel({
		serviceName: process.env.OTEL_SERVICE_NAME || "playwright-tutorial-next",
		attributes: {
			"service.namespace": "playwright-tutorial",
			"endform.telemetry.source": "next-app",
		},
	});
}
