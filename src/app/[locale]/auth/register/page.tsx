import { RegisterForm } from "@/components/auth/register-form";
import { siteConfig } from "@/config/site";
import { hasSocialLogin } from "@/lib/auth-providers";
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  noIndex: true,
  title: "Register",
  description: "Create an account to get started",
  canonicalUrl: `${siteConfig.url}/auth/register`,
});

const RegisterPage = () => {
  return <RegisterForm showSocialLoginButton={hasSocialLogin} />;
};

export default RegisterPage;
