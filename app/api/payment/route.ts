import { desc } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/drizzle";
import { getUser } from "@/lib/db/queries";
import { payments } from "@/lib/db/schema";

export async function GET(_request: NextRequest) {
	const user = await getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const userPayments = await db
			.select()
			.from(payments)
			.orderBy(desc(payments.createdAt))
			.limit(10);

		return NextResponse.json(userPayments);
	} catch (error) {
		console.error("Error fetching payments:", error);
		return NextResponse.json(
			{ error: "Failed to fetch payments" },
			{ status: 500 },
		);
	}
}
