'use client'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-16">
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          Built with{' '}
          <span className="text-brand-500 font-medium">Next.js</span>,{' '}
          <span className="text-brand-500 font-medium">Tailwind CSS</span> &amp; ❤️
        </p>
        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  )
}
