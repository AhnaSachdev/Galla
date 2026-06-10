import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
}: ActionCardProps) {
  return (
    <Link className="action-card" href={href}>
      <span className="card-icon">
        <Icon size={20} />
      </span>
      <span>
        <h3>{title}</h3>
        <p>{description}</p>
      </span>
    </Link>
  );
}
