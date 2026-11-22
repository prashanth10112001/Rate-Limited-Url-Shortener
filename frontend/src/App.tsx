import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { HelmetProvider } from "react-helmet-async"
import { Toaster } from "sonner"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoadingScreen } from "@/components/common/LoadingScreen"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { AuthProvider } from "@/context/AuthProvider"
import { BackendHealthProvider } from "@/context/BackendHealthProvider"
import { useTheme } from "@/context/ThemeContext"
import { ThemeProvider } from "@/context/ThemeProvider"

const PublicPage = lazy(() => import("@/pages/PublicPage"))
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/RegisterPage"))
const DashboardPage = lazy(() => import("@/pages/DashboardPage"))
const UrlDetailsPage = lazy(() => import("@/pages/UrlDetailsPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"))
const UrlNotFoundPage = lazy(() => import("@/pages/UrlNotFoundPage"))
const UrlExpiredPage = lazy(() => import("@/pages/UrlExpiredPage"))

function AppRoutes() {
  const { theme } = useTheme()

  return (
    <BackendHealthProvider>
      <AuthProvider>
        <AppLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<PublicPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/url-not-found" element={<UrlNotFoundPage />} />
              <Route path="/url-expired" element={<UrlExpiredPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/urls/:shortCode"
                element={
                  <ProtectedRoute>
                    <UrlDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppLayout>
        <Toaster position="top-right" richColors closeButton theme={theme} />
      </AuthProvider>
    </BackendHealthProvider>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  )
}
