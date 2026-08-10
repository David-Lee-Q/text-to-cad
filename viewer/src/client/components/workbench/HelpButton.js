import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";

export const HELP_PAGE_HASH = "#/help";

export function helpPageUrl() {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${HELP_PAGE_HASH}`;
}

export default function HelpButton({
  className,
  iconClassName
}) {
  const { t } = useI18n();

  const openHelp = () => {
    window.open(helpPageUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("helpOpen")}
          title={t("helpOpen")}
          onClick={openHelp}
          className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-xs font-medium leading-none text-muted-foreground hover:text-sidebar-foreground ${className || ""}`}
        >
          <CircleHelp
            className={`h-4 w-4 shrink-0 ${iconClassName || ""}`}
            aria-hidden="true"
          />
          <span aria-hidden="true">{t("helpTitle")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className="cad-glass-popover border border-sidebar-border bg-popover p-1.5 text-[11px] text-popover-foreground shadow-lg shadow-black/10"
      >
        {t("helpOpen")}
      </TooltipContent>
    </Tooltip>
  );
}
