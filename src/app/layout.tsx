
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sv">
            <body>
                <header>Header</header>

                {children}

                <footer>Footer</footer>
            </body>
        </html>
    );
}