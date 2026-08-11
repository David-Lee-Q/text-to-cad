import { Fragment, useEffect, useRef, useState } from "react";
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
import { AI_INTENTS, COLOR_KEYWORDS, buildCommandRows, parseAiCommand } from "@/workbench/aiCommands";
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

function normalizeLlmHex(value) {
  if (value == null || value === "") {
    return null;
  }
  const text = String(value).trim();
  if (/^0x/i.test(text)) {
    return parseInt(text.slice(2), 16);
  }
  if (text.startsWith("#")) {
    return parseInt(text.slice(1), 16);
  }
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeLlmResult(data, context) {
  const intent = String(data?.intent || "").trim();
  const params = data?.params && typeof data.params === "object" ? data.params : {};
  const reply = String(data?.reply || "").trim();
  if (intent === AI_INTENTS.OPEN_FILE) {
    const key = String(params.fileKey ?? params.key ?? params.file ?? "");
    const file = (context.catalog || []).find(
      (entry) => entry.key === key || entry.label === key
    );
    if (!file) {
      return { intent: "chat", params: {}, reply: reply || key };
    }
    return { intent, params: { file, query: key } };
  }
  if (intent === AI_INTENTS.SET_PARAM) {
    const id = String(params.id ?? params.parameterId ?? "");
    const parameter = (context.parameters || []).find(
      (entry) => entry.id === id || entry.label === id
    );
    if (!parameter) {
      return { intent: "chat", params: {}, reply: reply || id };
    }
    return { intent, params: { parameter, value: params.value, query: id } };
  }
  if (intent === AI_INTENTS.SET_COLOR) {
    let hex = normalizeLlmHex(params.hex);
    if (hex === undefined) {
      const name = String(params.color || "").trim().toLowerCase();
      const known = name ? COLOR_KEYWORDS[name] : undefined;
      hex = known !== undefined ? known : null;
    }
    return { intent, params: { hex, color: String(params.color || params.hex || "") } };
  }
  if (intent === AI_INTENTS.ROTATE_MODEL) {
    const angleDeg = Number(params.angleDeg ?? params.angle);
    if (!Number.isFinite(angleDeg)) {
      return { intent: "chat", params: {}, reply: reply || "" };
    }
    return { intent, params: { angleDeg } };
  }
  if (Object.values(AI_INTENTS).includes(intent)) {
    return { intent, params };
  }
  return { intent: "chat", params: {}, reply };
}

async function requestLlm(text, context) {
  const response = await fetch("/__cad/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text,
      context: {
        sourceFormat: context?.sourceFormat,
        fileName: context?.fileName,
        fileFormat: context?.fileFormatLabel,
        catalog: context?.catalog || [],
        parameters: context?.parameters || []
      }
    })
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
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

    case AI_INTENTS.SET_COLOR: {
      if (params?.hex === null) {
        const applied = actions?.setColor?.(null) !== false;
        if (!applied) {
          return { kind: "error", text: t("aiNoFile") };
        }
        return { kind: "ok", text: t("aiColorReset") };
      }
      if (!params?.hex) {
        return { kind: "error", text: t("aiColorUnknown", { color: params?.color || "" }) };
      }
      const applied = actions?.setColor?.(params.hex) !== false;
      if (!applied) {
        return { kind: "error", text: t("aiNoFile") };
      }
      return { kind: "ok", text: t("aiColorSet", { color: params.color }) };
    }

    case AI_INTENTS.ROTATE_MODEL: {
      if (!Number.isFinite(params?.angleDeg)) {
        return { kind: "error", text: t("aiRotateInvalid") };
      }
      const applied = actions?.rotateModel?.(params.angleDeg) !== false;
      if (!applied) {
        return { kind: "error", text: t("aiNoFile") };
      }
      return { kind: "ok", text: t("aiRotated", { angle: params.angleDeg }) };
    }

    case AI_INTENTS.PLAY_DANCE: {
      const applied = actions?.playDanceAnimation?.() !== false;
      if (!applied) {
        return { kind: "error", text: t("aiNoFile") };
      }
      return { kind: "ok", text: t("aiDanceStart") };
    }

    case AI_INTENTS.STOP_DANCE:
      actions?.stopDanceAnimation?.();
      return { kind: "ok", text: t("aiDanceStop") };

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
  context = {},
  width = 280
}) {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState(() => [{
    id: "greeting",
    role: "assistant",
    kind: "text",
    text: t("aiGreeting")
  }]);
  const [input, setInput] = useState("");
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const activeRowRef = useRef(null);

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

  const sendCommand = async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      return;
    }
    const pendingId = `a-${Date.now() + 1}`;
    setMessages((current) => [
      ...current,
      { id: `u-${Date.now()}`, role: "user", text: trimmed },
      { id: pendingId, role: "assistant", kind: "pending", text: t("aiThinking") }
    ]);
    setInput("");
    let reply;
    try {
      const parsed = parseAiCommand(trimmed, {
        sourceFormat: context.sourceFormat,
        catalog: context.catalog || [],
        parameters: context.parameters || []
      });
      if (parsed) {
        reply = buildReply(parsed, { context, actions, t });
      } else {
        const llm = await requestLlm(trimmed, context);
        if (!llm) {
          reply = { kind: "error", text: t("aiUnknown") };
        } else {
          const result = normalizeLlmResult(llm, context);
          if (result.intent === "chat") {
            reply = { kind: "ok", text: result.reply || t("aiUnknown") };
          } else {
            reply = buildReply(result, { context, actions, t });
          }
        }
      }
    } catch (error) {
      reply = { kind: "error", text: t("aiUnknown") };
    }
    setMessages((current) =>
      current.map((message) =>
        message.id === pendingId
          ? { ...message, kind: reply.kind, text: reply.text }
          : message
      )
    );
  };

  const sendMessage = () => {
    sendCommand(input);
  };

  const handleCommandClick = (command) => {
    if (command.includes("<") || command.endsWith(" ")) {
      setInput(command);
      inputRef.current?.focus();
      return;
    }
    sendCommand(command);
  };

  const hasFile = Boolean(context?.fileName);
  const showCommands = input.trim().startsWith("/");
  const commandRows = buildCommandRows({
    catalog: context.catalog || [],
    parameters: context.parameters || [],
    lang,
    sourceFormat: context.sourceFormat || ""
  });
  const commandQuery = showCommands ? input.trim().slice(1).toLowerCase() : "";
  const filteredRows = commandQuery
    ? commandRows.filter((row) =>
        row.zh.toLowerCase().includes(commandQuery) ||
        row.en.toLowerCase().includes(commandQuery) ||
        row.command.toLowerCase().includes(commandQuery)
      )
    : commandRows;

  useEffect(() => {
    setActiveCommandIndex(0);
  }, [commandQuery]);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeCommandIndex]);

  const handleInputKeyDown = (event) => {
    if (!showCommands || filteredRows.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCommandIndex((index) => (index + 1) % filteredRows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCommandIndex((index) => (index - 1 + filteredRows.length) % filteredRows.length);
    } else if (event.key === "Enter" && filteredRows[activeCommandIndex]) {
      event.preventDefault();
      handleCommandClick(filteredRows[activeCommandIndex].command);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setInput("");
    }
  };

  const GROUP_LABELS = {
    file: t("aiCmdGroupFile"),
    param: t("aiCmdGroupParam")
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-md"
        overlayClassName="bg-black/20 !top-11"
        showCloseButton={false}
        style={{ top: "44px", height: "auto", width: `${width}px` }}
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
            <div id="ai-command-suggestions" className="shrink-0 overflow-hidden rounded-md border border-sidebar-border">
              <div className="border-b border-sidebar-border bg-sidebar-accent/40 px-4 py-1.5 text-[11px] font-medium text-muted-foreground">
                {t("aiCmdListTitle")}
              </div>
              {filteredRows.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  {t("aiCmdNoMatch", { query: input.trim() })}
                </div>
              ) : (
                <ScrollArea viewportClassName="max-h-52" type="auto">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      {filteredRows.map((row, index) => {
                        const groupChanged = row.group !== filteredRows[index - 1]?.group;
                        const isActive = index === activeCommandIndex;
                        return (
                          <Fragment key={row.key}>
                            {groupChanged && row.group ? (
                              <tr className="border-b border-sidebar-border/50 bg-sidebar-accent/60">
                                <td colSpan={2} className="px-4 py-1 text-[11px] font-medium text-muted-foreground">
                                  {GROUP_LABELS[row.group]}
                                </td>
                              </tr>
                            ) : null}
                            <tr
                              ref={isActive ? activeRowRef : undefined}
                              className={`group cursor-pointer border-b border-sidebar-border/50 last:border-0 ${
                                isActive
                                  ? "bg-sidebar-accent"
                                  : "hover:bg-sidebar-accent/60"
                              }`}
                              onClick={() => handleCommandClick(row.command)}
                              role="button"
                              tabIndex={0}
                              aria-selected={isActive}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  handleCommandClick(row.command);
                                }
                              }}
                              onMouseEnter={() => setActiveCommandIndex(index)}
                            >
                              <td className="px-4 py-1.5 font-mono text-foreground">{row.zh}</td>
                              <td className="px-4 py-1.5 font-mono text-muted-foreground">{row.en}</td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
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
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={t("aiPlaceholder")}
              aria-label={t("aiPlaceholder")}
              aria-expanded={showCommands}
              aria-controls="ai-command-suggestions"
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
