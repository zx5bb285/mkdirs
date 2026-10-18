import { Link } from "@/i18n/navigation";
import { CheckIcon } from "lucide-react";

export interface FilterItemMobileProps {
  title: string;
  href: string;
  active: boolean;
  clickAction?: () => void;
}

export default function FilterItemMobile({
  title,
  href,
  active,
  clickAction,
}: FilterItemMobileProps) {
  return (
    <div>
      {/* shwo in mobile, wrapped in Link and shwo in a Drawer */}
      <Link href={href} prefetch={false} onClick={clickAction}>
        <li className="rounded-lg text-foreground hover:bg-muted">
          <div className="flex items-center justify-between p-3 text-sm">
            <h2>{title}</h2>
            {active && <CheckIcon className="size-4" />}
          </div>
        </li>
      </Link>
    </div>
  );
}
