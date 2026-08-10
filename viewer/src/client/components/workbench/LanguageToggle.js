import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  languageName,
  languageToggleLabel,
  useI18n
} from "@/i18n";
import {
  LANG_EN,
  LANG_ZH
} from "@/i18n";

export default function LanguageToggle({
  className,
  iconClassName
}) {
  const { lang, toggleLang, t } = useI18n();
  const nextLang = lang === LANG_ZH ? LANG_EN : LANG_ZH;
  const label = t("languageLabel", {
    language: languageName(lang),
    next: languageName(nextLang)
  });

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={label}
          title={label}
          onClick={toggleLang}
          className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-xs font-medium leading-none text-muted-foreground hover:text-sidebar-foreground ${className || ""}`}
        >
          <span className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className={`text-[11px] tabular-nums ${iconClassName || ""}`}
            >
              {languageToggleLabel(lang)}
            </span>
            <span
              className={`rounded-sm border border-sidebar-border px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-muted-foreground ${iconClassName || ""}`}
            >
              {lang === LANG_ZH ? "中文" : "EN"}
            </span>
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className="cad-glass-popover border border-sidebar-border bg-popover p-1.5 text-[11px] text-popover-foreground shadow-lg shadow-black/10"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
