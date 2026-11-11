import { Check } from "lucide-react";
import { Suspense, use } from "react";
import { processPayment } from "@/lib/payments/actions";

type CheckoutSearchParams = {
	plan?: string;
	amount?: string;
	step?: string;
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
	Base: ["Unlimited usage", "Unlimited workspace members", "Email support"],
	Plus: [
		"Everything in Base",
		"Early access to new features",
		"24/7 support and Slack access",
	],
};

function Checkout({
	searchParams,
}: {
	searchParams: Promise<CheckoutSearchParams>;
}) {
	const resolvedParams = use(searchParams);
	const planName = resolvedParams.plan || "Unknown Plan";
	const amount = Number(resolvedParams.amount) || 0;

	if (resolvedParams.step === "payment") {
		return <CheckoutForm planName={planName} amount={amount} />;
	}

	return <ReviewUpgrade planName={planName} amount={amount} />;
}

function ReviewUpgrade({
	planName,
	amount,
}: {
	planName: string;
	amount: number;
}) {
	const paymentHref = `/pricing/checkout?plan=${encodeURIComponent(planName)}&amount=${amount}&step=payment`;

	return (
		<main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="bg-white shadow-lg rounded-lg p-8">
				<p className="text-sm font-medium text-orange-600 mb-2">Step 1 of 2</p>
				<h1 className="text-3xl font-bold text-gray-900 mb-6">
					Review your upgrade
				</h1>

				<div className="rounded-lg border border-gray-200 p-6 mb-6">
					<div className="flex items-baseline justify-between mb-4">
						<h2 className="text-xl font-semibold text-gray-900">
							{planName} plan
						</h2>
						<p className="text-xl font-semibold text-gray-900">
							${amount / 100}
							<span className="text-sm font-normal text-gray-600">/month</span>
						</p>
					</div>
					<ul className="space-y-2">
						{(PLAN_HIGHLIGHTS[planName] ?? []).map((highlight) => (
							<li key={highlight} className="flex items-center text-gray-700">
								<Check className="h-4 w-4 text-orange-500 mr-2 shrink-0" />
								{highlight}
							</li>
						))}
					</ul>
				</div>

				<dl className="space-y-2 text-sm mb-8">
					<div className="flex justify-between">
						<dt className="text-gray-600">Billed</dt>
						<dd className="text-gray-900">Monthly, starting today</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-gray-600">Cancel</dt>
						<dd className="text-gray-900">Anytime from Team Settings</dd>
					</div>
					<div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
						<dt className="text-gray-900">Due today</dt>
						<dd className="text-gray-900">${amount / 100}.00</dd>
					</div>
				</dl>

				<div className="flex justify-between items-center pt-6 border-t border-gray-200">
					<a
						href="/pricing"
						className="text-orange-600 hover:text-orange-500 font-medium"
					>
						← Back to plans
					</a>
					<a
						href={paymentHref}
						className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md"
					>
						Continue to payment
					</a>
				</div>
			</div>
		</main>
	);
}

function CheckoutForm({
	planName,
	amount,
}: {
	planName: string;
	amount: number;
}) {
	return (
		<main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="bg-white shadow-lg rounded-lg p-8">
				<p className="text-sm font-medium text-orange-600 mb-2">Step 2 of 2</p>
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Complete Your Purchase
				</h1>
				<p className="text-gray-600 mb-8">
					You are purchasing: <strong>{planName}</strong> for{" "}
					<strong>${amount / 100}/month</strong>
				</p>

				<form action={processPayment} className="space-y-6">
					<input type="hidden" name="planName" value={planName} />
					<input type="hidden" name="amount" value={amount} />

					<div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
						<p className="text-yellow-800 text-sm">
							<strong>Demo Payment System:</strong> This is a dummy payment form
							for testing purposes. Only 8-digit card numbers are accepted to
							prevent real credit card usage.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Payment Information
							</h3>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="cardHolderName"
										className="block text-sm font-medium text-gray-700"
									>
										Card Holder Name
									</label>
									<input
										type="text"
										id="cardHolderName"
										name="cardHolderName"
										required
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
										placeholder="John Doe"
									/>
								</div>

								<div>
									<label
										htmlFor="cardNumber"
										className="block text-sm font-medium text-gray-700"
									>
										Card Number (8 digits only)
									</label>
									<input
										type="text"
										id="cardNumber"
										name="cardNumber"
										required
										maxLength={8}
										pattern="\d{8}"
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
										placeholder="12345678"
									/>
									<p className="mt-1 text-xs text-gray-500">
										Example: 12345678 (for demo purposes only)
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="expiryDate"
											className="block text-sm font-medium text-gray-700"
										>
											Expiry Date
										</label>
										<input
											type="text"
											id="expiryDate"
											name="expiryDate"
											required
											placeholder="MM/YY"
											pattern="\d{2}\/\d{2}"
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
										/>
									</div>

									<div>
										<label
											htmlFor="cvv"
											className="block text-sm font-medium text-gray-700"
										>
											CVV
										</label>
										<input
											type="text"
											id="cvv"
											name="cvv"
											required
											maxLength={3}
											pattern="\d{3}"
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
											placeholder="123"
										/>
									</div>
								</div>
							</div>
						</div>

						<div>
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Billing Address
							</h3>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="billingAddress"
										className="block text-sm font-medium text-gray-700"
									>
										Street Address
									</label>
									<input
										type="text"
										id="billingAddress"
										name="billingAddress"
										required
										className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
										placeholder="123 Main Street"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="city"
											className="block text-sm font-medium text-gray-700"
										>
											City
										</label>
										<input
											type="text"
											id="city"
											name="city"
											required
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
											placeholder="New York"
										/>
									</div>

									<div>
										<label
											htmlFor="state"
											className="block text-sm font-medium text-gray-700"
										>
											State
										</label>
										<input
											type="text"
											id="state"
											name="state"
											required
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
											placeholder="NY"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="zipCode"
											className="block text-sm font-medium text-gray-700"
										>
											ZIP Code
										</label>
										<input
											type="text"
											id="zipCode"
											name="zipCode"
											required
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
											placeholder="10001"
										/>
									</div>

									<div>
										<label
											htmlFor="country"
											className="block text-sm font-medium text-gray-700"
										>
											Country
										</label>
										<input
											type="text"
											id="country"
											name="country"
											required
											className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
											placeholder="United States"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="flex justify-between items-center pt-6 border-t border-gray-200">
						<a
							href="/pricing"
							className="text-gray-600 hover:text-gray-900 text-sm font-medium"
						>
							← Back to pricing
						</a>
						<button
							type="submit"
							className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 font-medium"
						>
							Complete Purchase - ${amount / 100}/month
						</button>
					</div>
				</form>
			</div>
		</main>
	);
}

export default function CheckoutPage({
	searchParams,
}: {
	searchParams: Promise<CheckoutSearchParams>;
}) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Checkout searchParams={searchParams} />
		</Suspense>
	);
}
