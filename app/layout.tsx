import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { SWRConfig } from "swr";
import { getTeamForUser, getUser } from "@/lib/db/queries";

export const metadata: Metadata = {
	title: "Playwright Tutorial",
	description:
		"Learn how to end-to-end test web applications with Playwright and Endform.",
};

export const viewport: Viewport = {
	maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
		>
			<body className="min-h-[100dvh] bg-gray-50">
				<SWRConfig
					value={{
						fallback: {
							// We do NOT await here
							// Only components that read this data will suspend
							"/api/user": getUser(),
							"/api/team": getTeamForUser(),
						},
					}}
				>
					{children}
				</SWRConfig>
			</body>
		</html>
	);
}
