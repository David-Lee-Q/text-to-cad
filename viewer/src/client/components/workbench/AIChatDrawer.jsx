import { useEffect, useRef, useState } from "react";
import { Bot, CornerDownLeft, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle
} from "@/components/ui/sheet";
import { RENDER_FORMAT } from "@/workbench/constants";
import { AI_COMMAND_ROWS, AI_INTENTS, parseAiCommand } from "@/workbench/aiCommands";
import { useI18n } from "@/i18n";

function isStepLike(sourceFormat) {
  return sourceFormat === RENDER_FORMAT.STEP;
}

function isImplicitLike(sourceFormat) {
  return sourceFormat === RENDER_FORMAT.IMPLICIT;
}

function isRobotLike(sourceFormat) {
  return sourceFormat === RENDER_FORMAT.URDF ||
    sourceFormat === RENDER_FORMAT.SRDF ||
    sourceFormat === RENDER_FORMAT.SDF;
}

function buildReply(result, { context, actions, t }) {
  const { intent, params } = result;
  const sourceFormat = context?.sourceFormat || "";

  switch (intent) {
    case AI_INTENTS.HELP:
      return { kind: "help", text: t("aiHelpText") };

    case AI_INTENTS.OPEN_FILE: {
      if (!params?.file) {
        return { kind: "error", text: t("aiOpenNoMatch", { query: params?.query || "" }) };
      }
      actions?.openFile?.(params.file.key);
      return { kind: "ok", text: t("aiFileOpened", { name: String(params.file.label || params.file.key) }) };
    }

    case AI_INTENTS.SET_DISPLAY_MODE: {
      if (!isStepLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForStep") };
      }
      actions?.setDisplayMode?.(params.mode);
      return { kind: "ok", text: t("aiDisplayModeSet", { mode: t(`display${displayModeLabelKey(params.mode)}`) }) };
    }

    case AI_INTENTS.SET_PROJECTION: {
      if (!isStepLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForStep") };
      }
      actions?.setProjection?.(params.projection);
      return { kind: "ok", text: t("aiProjectionSet", { projection: t(params.projection === "perspective" ? "projPerspective" : "projOrthographic") }) };
    }

    case AI_INTENTS.FIT_VIEW:
      actions?.fitView?.();
      return { kind: "ok", text: t("aiFitView") };

    case AI_INTENTS.RESET_VIEW:
      actions?.resetView?.();
      return { kind: "ok", text: t("aiResetView") };

    case AI_INTENTS.HIDE_ALL:
      if (!isStepLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForStep") };
      }
      actions?.hideAll?.();
      return { kind: "ok", text: t("aiHideAll") };

    case AI_INTENTS.SHOW_ALL:
      if (!isStepLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForStep") };
      }
      actions?.showAll?.();
      return { kind: "ok", text: t("aiShowAll") };

    case AI_INTENTS.HIDE_OTHERS:
      if (!isStepLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForStep") };
      }
      actions?.hideOthers?.();
      return { kind: "ok", text: t("aiHideOthers") };

    case AI_INTENTS.PLAY_ANIMATION:
      actions?.playAnimation?.();
      return { kind: "ok", text: t("aiPlayAnimation") };

    case AI_INTENTS.PAUSE_ANIMATION:
      actions?.pauseAnimation?.();
      return { kind: "ok", text: t("aiPauseAnimation") };

    case AI_INTENTS.SCREENSHOT:
      actions?.screenshot?.();
      return { kind: "ok", text: t("aiScreenshot") };

    case AI_INTENTS.ENTER_PREVIEW:
      actions?.enterPreview?.();
      return { kind: "ok", text: t("aiEnterPreview") };

    case AI_INTENTS.EXIT_PREVIEW:
      actions?.exitPreview?.();
      return { kind: "ok", text: t("aiExitPreview") };

    case AI_INTENTS.FILE_INFO: {
      const name = context?.fileName || "";
      const label = context?.fileFormatLabel || "";
      if (!name) {
        return { kind: "error", text: t("aiNoFile") };
      }
      return { kind: "ok", text: t("aiFileInfo", { name, format: label }) };
    }

    case AI_INTENTS.RESET_PARAMS:
      if (!isImplicitLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForImplicit") };
      }
      actions?.resetParams?.();
      return { kind: "ok", text: t("aiResetParams") };

    case AI_INTENTS.SET_PARAM: {
      if (!isImplicitLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForImplicit") };
      }
      if (!params?.parameter) {
        return { kind: "error", text: t("aiParamUnknown", { query: params?.query || "" }) };
      }
      actions?.setParam?.(params.parameter.id, params.value);
      return { kind: "ok", text: t("aiParamSet", { name: params.parameter.label || params.parameter.id, value: params.value }) };
    }

    case AI_INTENTS.RESET_POSE:
      if (!isRobotLike(sourceFormat)) {
        return { kind: "error", text: t("aiOnlyForRobot") };
      }
      actions?.resetPose?.();
      return { kind: "ok", text: t("aiResetPose") };

    case AI_INTENTS.DARK_THEME:
      actions?.setTheme?.("dark");
      return { kind: "ok", text: t("aiDarkTheme") };

    case AI_INTENTS.LIGHT_THEME:
      actions?.setTheme?.("light");
      return { kind: "ok", text: t("aiLightTheme") };

    default:
      return { kind: "error", text: t("aiUnknown") };
  }
}

function displayModeLabelKey(mode) {
  const map = {
    solid: "displaySolid",
    rendered: "displayRendered",
    transparent: "displayXRay",
    hidden_edges: "displayHidden",
    hidden_lines_removed: "displayLines",
    unshaded: "displayFlat",
    wireframe: "displayWire"
  };
  return map[mode] || "displaySolid";
}

export default function AIChatDrawer({
  open,
  onOpenChange,
  actions = {},
  context = {}
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState(() => [{
    id: "greeting",
    role: "assistant",
    kind: "text",
    text: t("aiGreeting")
  }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMessages((current) =>
        current.some((m) => m.id === "greeting")
          ? current
          : [{ id: "greeting", role: "assistant", kind: "text", text: t("aiGreeting") }, ...current]
      );
    }
  }, [open, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) {
      return;
    }
    const parsed = parseAiCommand(text, {
      sourceFormat: context.sourceFormat,
      catalog: context.catalog || [],
      parameters: context.parameters || []
    });
    let reply;
    if (!parsed) {
      reply = { kind: "error", text: t("aiUnknown") };
    } else {
      reply = buildReply(parsed, { context, actions, t });
    }
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: "user", text },
      { id: `a-${Date.now() + 1}`, role: "assistant", kind: reply.kind, text: reply.text }
    ]);
    setInput("");
  };

  const hasFile = Boolean(context?.fileName);
  const showCommands = input.trim().startsWith("/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-md"
        overlayClassName="bg-black/20"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">{t("aiTitle")}</SheetTitle>
        <div className="flex h-full min-h-0 flex-col gap-3 py-4">
          <div className="flex shrink-0 items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bot className="size-4 text-primary" aria-hidden="true" />
              <span>{t("aiTitle")}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              aria-label={t("aiClose")}
              title={t("aiClose")}
              onClick={() => onOpenChange?.(false)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <ScrollArea ref={scrollRef} className="min-h-0 flex-1" type="auto">
            <div className="flex flex-col gap-2.5 px-4 pb-1">
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : message.kind === "error"
                            ? "border border-destructive/40 bg-destructive/10 text-destructive"
                            : message.kind === "help"
                              ? "border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground"
                              : "border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {!hasFile ? (
            <div className="shrink-0 rounded-md border border-dashed border-sidebar-border px-4 py-2 text-xs text-muted-foreground">
              {t("aiNoFileHint")}
            </div>
          ) : null}

          {showCommands ? (
            <div className="shrink-0 overflow-hidden rounded-md border border-sidebar-border">
              <div className="border-b border-sidebar-border bg-sidebar-accent/40 px-4 py-1.5 text-[11px] font-medium text-muted-foreground">
                {t("aiCmdListTitle")}
              </div>
              <ScrollArea className="max-h-52" type="auto">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {AI_COMMAND_ROWS.map((row) => (
                      <tr
                        key={`${row.zh}-${row.en}`}
                        className="border-b border-sidebar-border/50 last:border-0"
                      >
                        <td className="px-4 py-1.5 font-mono text-foreground">{row.zh}</td>
                        <td className="px-4 py-1.5 font-mono text-muted-foreground">{row.en}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          ) : null}

          <form
            className="flex shrink-0 items-center gap-2 px-4"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("aiPlaceholder")}
              aria-label={t("aiPlaceholder")}
              className="h-9 text-[13px]"
            />
            <Button
              type="submit"
              size="icon-sm"
              className="h-9 w-9 shrink-0"
              disabled={!input.trim()}
              aria-label={t("aiSend")}
              title={t("aiSend")}
            >
              <SendHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
