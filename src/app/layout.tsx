import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Viko',
  description: 'Directorio de emprendimientos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root, html, body, * {
            --cream: #F5F0E8;
            --beige: #EDE8DC;
            --white: #FAFAF7;
            --black: #1A1814;
            --charcoal: #2D2B26;
            --muted: #7A756A;
            --olive: #6B7A5A;
            --olive-light: #EFF2EB;
            --olive-dark: #3B6D11;
            --terracota: #C4664A;
            --gold: #C9A84C;
            --border: rgba(26,24,20,0.12);
            --border-strong: rgba(26,24,20,0.25);
            --shadow: 0 4px 24px rgba(26,24,20,0.08);
            --shadow-lg: 0 12px 48px rgba(26,24,20,0.14);
            --radius: 12px;
            --radius-lg: 20px;
            --radius-full: 100px;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}