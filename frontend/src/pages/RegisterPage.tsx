import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, UserRoundPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/api/client"
import { LoadingButton } from "@/components/common/LoadingButton"
import { LoadingScreen } from "@/components/common/LoadingScreen"
import { SeoHead } from "@/components/common/SeoHead"
import { useBackendHealth } from "@/context/BackendHealthContext"
import { useAuth } from "@/context/useAuth"
import { registerSchema, type RegisterFormValues } from "@/lib/validation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const { register: createAccount, user, isLoading } = useAuth()
  const { ensureBackendReady, status: backendStatus } = useBackendHealth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
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
      await createAccount(values)
      toast.success("Account created. You can sign in now.")
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  })

  return (
    <section className="container-page flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <SeoHead title="Create an account — Linkly" noIndex />
      <Card className="w-full max-w-md animate-fade-up">
        <CardHeader className="pb-3 text-center">
          <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRoundPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Keep your short links organized in one private workspace.</CardDescription>
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
                aria-describedby={errors.username ? "register-username-error" : undefined}
                {...register("username")}
              />
              {errors.username && (
                <p id="register-username-error" className="text-sm text-destructive" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="register-email-error" className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "register-password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="register-password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Your email address is validated by the server before your account is created.
            </p>
            <LoadingButton
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
              loadingText="Registering…"
            >
              Create account <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LoadingButton>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
