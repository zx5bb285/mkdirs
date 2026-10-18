import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/config/site";
import { hasSocialLogin } from "@/lib/auth-providers";
import { constructMetadata } from "@/lib/metadata";

export const metadata = constructMetadata({
  noIndex: true,
  title: "Login",
  description: "Login to your account",
  canonicalUrl: `${siteConfig.url}/auth/login`,
});

const LoginPage = () => {
  return (
    <LoginForm className="border-none" showSocialLoginButton={hasSocialLogin} />
  );
};

export default LoginPage;
