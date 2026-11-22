import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { getCurrentUser, loginUser, registerUser } from "@/api/auth"
import {
  getApiErrorMessage,
  setUnauthorizedHandler,
  TOKEN_STORAGE_KEY,
} from "@/api/client"
import { AuthContext } from "@/context/AuthContext"
import { useBackendHealth } from "@/context/BackendHealthContext"
import type { LoginRequest, RegisterRequest } from "@/types/api"

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { status: backendStatus, ensureBackendReady } = useBackendHealth()
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>> | null>(
    null,
  )
  const [token, setToken] = useState<string | null>(() =>
    window.localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY)),
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = useCallback(() => {
    setIsLoggingOut(true)
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setIsLoading(false)
    navigate("/", { replace: true })
    toast.success("Logged out successfully.")
  }, [navigate])

  useEffect(() => {
    if (location.pathname !== "/" || !isLoggingOut) {
      return
    }

    const timeoutId = window.setTimeout(() => setIsLoggingOut(false), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isLoggingOut, location.pathname])

  const handleUnauthorized = useCallback(() => {
    const hadSession = Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY))
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    if (hadSession) {
      toast.error("Session expired. Please login again.")
      navigate("/login", { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  useEffect(() => {
    let active = true
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!storedToken) {
      return () => {
        active = false
      }
    }

    if (backendStatus === "error") {
      return () => {
        active = false
      }
    }

    if (backendStatus !== "ready") {
      void ensureBackendReady().catch(() => undefined)
      return () => {
        active = false
      }
    }

    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
        }
      })
      .catch((error: unknown) => {
        if (
          active &&
          !(axios.isAxiosError(error) && error.response?.status === 401)
        ) {
          toast.error(getApiErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [backendStatus, ensureBackendReady])

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoggingOut(false)
    const result = await loginUser(payload)
    window.localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token)
    setToken(result.access_token)
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      setToken(null)
      setUser(null)
      throw error
    }
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    await registerUser(payload)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, isLoggingOut, login, register, logout }),
    [user, token, isLoading, isLoggingOut, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
