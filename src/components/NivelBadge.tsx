import { cn } from "@/lib/utils";
import type { OcorrenciaNivel } from "@/lib/mock-data";
import { nivelLabel } from "@/lib/mock-data";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface NivelBadgeProps {
  nivel: OcorrenciaNivel;
  showIcon?: boolean;
  className?: string;
}

export function NivelBadge({ nivel, showIcon = true, className }: NivelBadgeProps) {
  const config = {
    baixa: {
      cls: "bg-success/10 text-success border-success/30",
      Icon: Info,
    },
    media: {
      cls: "bg-warning/15 text-warning-foreground border-warning/40",
      Icon: AlertCircle,
    },
    grave: {
      cls: "bg-destructive/10 text-destructive border-destructive/30",
      Icon: AlertTriangle,
    },
  }[nivel];

  const Icon = config.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.cls,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {nivelLabel[nivel]}
    </span>
  );
}
