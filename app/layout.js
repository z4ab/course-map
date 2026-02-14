export const metadata = {
  title: 'Course Map',
  description: 'Course prerequisite visualization',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
