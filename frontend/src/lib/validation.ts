import { z } from "zod"

export const registerSchema = z.object({
  username: z.string().min(1, "Enter your username."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
})

export const loginSchema = z.object({
  username: z.string().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
})

export const shortenSchema = z.object({
  long_url: z
    .string()
    .trim()
    .min(1, "Enter a URL to shorten.")
    .max(2048, "URL must be 2048 characters or fewer.")
    .url("Enter a valid URL.")
    .refine((value) => {
      try {
        const url = new URL(value)
        return (
          (url.protocol === "http:" || url.protocol === "https:") &&
          !url.username &&
          !url.password
        )
      } catch {
        return false
      }
    }, "Use an HTTP or HTTPS URL without embedded credentials."),
})

export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type ShortenFormValues = z.infer<typeof shortenSchema>
