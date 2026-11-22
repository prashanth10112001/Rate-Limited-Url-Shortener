import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, KeyRound, Link2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/api/client"
import { LoadingButton } from "@/components/common/LoadingButton"
import { LoadingScreen } from "@/components/common/LoadingScreen"
import { SeoHead } from "@/components/common/SeoHead"
import { useBackendHealth } from "@/context/BackendHealthContext"
import { useAuth } from "@/context/useAuth"
import { loginSchema, type LoginFormValues } from "@/lib/validation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const { login, user, isLoading } = useAuth()
  const { ensureBackendReady, status: backendStatus } = useBackendHealth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: { pathname?: string } } | null
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  if (isLoading && backendStatus !== "error") {
    return <LoadingScreen label="Restoring your session…" />
  }
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = handleSubmit(async (values) => {
    try {
      await ensureBackendReady()
      await login(values)
      toast.success("Welcome back.")
      navigate(state?.from?.pathname || "/dashboard", { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <section className="container-page flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <SeoHead title="Log in — Linkly" noIndex />
      <Card className="w-full max-w-md animate-fade-up">
        <CardHeader className="pb-3 text-center">
          <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to manage your links and view their performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit} noValidate>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input
                id="username"
                autoComplete="username"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? "login-username-error" : undefined}
                {...register("username")}
              />
              {errors.username && (
                <p id="login-username-error" className="text-sm text-destructive" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="login-password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            <LoadingButton
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
              loadingText="Logging in…"
            >
              Log in <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LoadingButton>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Shorten a link without signing in
          </Link>
        </CardContent>
      </Card>
    </section>
  )
}
