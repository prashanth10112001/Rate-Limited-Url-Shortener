import { useState } from "react"
import { ArrowUpRight, Link2, Menu, X } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { useAuth } from "@/context/useAuth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/common/ThemeToggle"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
    isActive ? "bg-muted text-foreground" : "text-muted-foreground",
  )

export function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          onClick={closeMenu}
          aria-label="Linkly home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>linkly<span className="text-primary">.</span></span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {!user ? (
              <>
                <NavLink to="/login" className={linkClass}>Log in</NavLink>
                <Button asChild size="sm" className="ml-2">
                  <Link to="/register">
                    Get started <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <span className="mx-2 max-w-36 truncate text-sm text-muted-foreground">
                  {user.username}
                </span>
                <Button size="sm" variant="outline" onClick={logout}>Log out</Button>
              </>
            )}
          </nav>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 md:hidden",
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <nav
          className="overflow-hidden border-t border-border/70 px-4"
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="container-page flex flex-col gap-1 py-3">
            {!user ? (
              <>
                <NavLink to="/login" className={linkClass} onClick={closeMenu}>Log in</NavLink>
                <Link
                  to="/register"
                  className={cn(
                    "mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
                  )}
                  onClick={closeMenu}
                >
                  Create your account
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={linkClass} onClick={closeMenu}>Dashboard</NavLink>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    closeMenu()
                    logout()
                  }}
                >
                  Log out
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
