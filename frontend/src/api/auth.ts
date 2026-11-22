import api from "@/api/client"
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "@/types/api"

export async function registerUser(payload: RegisterRequest) {
  const response = await api.post<{ message: string; user_id: number }>(
    "/auth/register",
    payload,
  )
  return response.data
}

export async function loginUser(payload: LoginRequest) {
  const response = await api.post<TokenResponse>("/auth/login", payload)
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get<User>("/auth/me")
  return response.data
}
