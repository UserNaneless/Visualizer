import type { Metadata } from "next";
import "./globals.sass";

export const metadata: Metadata = {
    title: "Visualizer",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
