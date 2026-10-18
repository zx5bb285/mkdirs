import { AuthCard } from "@/components/auth/auth-card";
import { TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export const ErrorCard = () => {
  const t = useTranslations();
  return (
    <AuthCard
      headerLabel={t("Auth.somethingWentWrong")}
      bottomButtonHref="/auth/login"
      bottomButtonLabel={t("Auth.backToLogin")}
      className="border-none"
    >
      <div className="w-full flex justify-center items-center py-4 gap-2">
        <TriangleAlertIcon className="text-destructive size-4" />
        <p className="font-medium text-destructive">
          {t("Auth.pleaseTryAgain")}
        </p>
      </div>
    </AuthCard>
  );
};
