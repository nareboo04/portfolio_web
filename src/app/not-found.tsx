import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-extrabold gradient-text mb-4">404</h1>
      <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">This page does not exist.</p>
      <Link href="/" className="btn-primary">← Back Home</Link>
    </div>
  )
}
