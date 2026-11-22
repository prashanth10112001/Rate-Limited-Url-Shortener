import { createContext } from "react"
import type { LoginRequest, RegisterRequest, User } from "@/types/api"

export interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isLoggingOut: boolean
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
