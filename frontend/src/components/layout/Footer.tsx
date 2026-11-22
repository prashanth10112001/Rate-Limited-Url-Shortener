const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background">
      <div className="container-page flex min-h-16 flex-col items-center justify-between gap-2 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <p>© {currentYear} Durgam Prashanth. All rights reserved.</p>
        <p>Short links, thoughtful analytics.</p>
      </div>
    </footer>
  )
}
