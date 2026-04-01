import type { VerificationMethod } from "@/lib/cmsApi";

export function allowsEmailOtp(method: VerificationMethod | null | undefined): boolean {
  return method === "email" || method === "email_or_authenticator";
}

export function allowsAuthenticatorOtp(method: VerificationMethod | null | undefined): boolean {
  return method === "authenticator" || method === "email_or_authenticator";
}
