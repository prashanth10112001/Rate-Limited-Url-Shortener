import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { ThemeContext, type Theme } from "@/context/ThemeContext"

type ThemePreference = Theme | "system"

const THEME_STORAGE_KEY = "linkly.theme"

function getInitialPreference(): ThemePreference {
  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedPreference === "light" || storedPreference === "dark"
    ? storedPreference
    : "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference)
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  )
  const theme = preference === "system" ? systemTheme : preference

  const toggleTheme = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark")
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", updateSystemTheme)
    return () => mediaQuery.removeEventListener("change", updateSystemTheme)
  }, [])

  useEffect(() => {
    if (preference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    }
  }, [preference])

  useEffect(() => {
    const root = document.documentElement
    root.style.colorScheme = theme
    if (root.dataset.theme === theme) {
      return
    }

    root.classList.add("theme-transition")
    root.dataset.theme = theme
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    themeColor?.setAttribute("content", theme === "dark" ? "#09090b" : "#f8fafc")
    const timeoutId = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      220,
    )
    return () => window.clearTimeout(timeoutId)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
