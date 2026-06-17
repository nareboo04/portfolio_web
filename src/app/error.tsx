'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md">{error.message}</p>
      <button onClick={reset} className="btn-primary">Try Again</button>
    </div>
  )
}
