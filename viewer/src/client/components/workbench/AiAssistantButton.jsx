import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

const BOT_GRADIENT_ID = "ai-robot-gradient";
const GUIDE_MESSAGE_KEYS = ["aiGuideTip1", "aiGuideTip2", "aiGuideTip3", "aiGuideTip4"];
const BUBBLE_FIRST_DELAY_MS = 6000;
const BUBBLE_HOLD_MS = 12000;
const BUBBLE_GAP_MS = 20000;

export function AiRobotGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={BOT_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6">
            <animate
              attributeName="stopColor"
              values="#8b5cf6;#3b82f6;#06b6d4;#ec4899;#8b5cf6"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="#06b6d4">
            <animate
              attributeName="stopColor"
              values="#06b6d4;#ec4899;#8b5cf6;#3b82f6;#06b6d4"
              dur="8s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>
      <line x1="12" y1="3.5" x2="12" y2="5.5" stroke={`url(#${BOT_GRADIENT_ID})`} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="2.8" r="1.1" fill="#f43f5e">
        <animate attributeName="opacity" values="1;0.25;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <rect x="4.5" y="6.5" width="15" height="11.5" rx="4" fill={`url(#${BOT_GRADIENT_ID})`}>
        <animate attributeName="y" values="6.5;7;6.5" dur="2.2s" repeatCount="indefinite" />
      </rect>
      <ellipse cx="9" cy="11.8" rx="1.6" ry="2" fill="#ffffff">
        <animate attributeName="ry" values="2;2;0.25;2;2" dur="4.2s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="15" cy="11.8" rx="1.6" ry="2" fill="#ffffff">
        <animate attributeName="ry" values="2;2;0.25;2;2" dur="4.2s" repeatCount="indefinite" />
      </ellipse>
      <path d="M9.5 15.8h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function AiGuideBubble({ aiChatOpen }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const messageIndexRef = useRef(0);

  useEffect(() => {
    if (aiChatOpen) {
      setVisible(false);
      return undefined;
    }
    const timers = [];
    let cancelled = false;
    const scheduleShow = (delay) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) {
            return;
          }
          setMessageIndex(messageIndexRef.current % GUIDE_MESSAGE_KEYS.length);
          messageIndexRef.current += 1;
          setVisible(true);
          timers.push(
            setTimeout(() => {
              if (!cancelled) {
                setVisible(false);
              }
            }, BUBBLE_HOLD_MS)
          );
          scheduleShow(BUBBLE_GAP_MS);
        }, delay)
      );
    };
    scheduleShow(BUBBLE_FIRST_DELAY_MS);
    return () => {
      cancelled = true;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [aiChatOpen]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute right-full top-1/2 z-60 mr-2 -translate-y-1/2 animate-in fade-in zoom-in">
      <div className="relative flex items-center gap-2 whitespace-nowrap rounded-md border border-primary/30 bg-popover px-2.5 py-1.5 text-xs shadow-lg">
        <span className="leading-none text-muted-foreground">{t(GUIDE_MESSAGE_KEYS[messageIndex])}</span>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => setVisible(false)}
          aria-label={t("aiClose")}
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

export default function AiAssistantButton({ aiChatOpen = false, onAiChatOpen }) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("aiOpen")}
        title={t("aiOpen")}
        className="size-7"
        onClick={() => onAiChatOpen?.()}
      >
        <AiRobotGlyph className="size-4" />
      </Button>
      <AiGuideBubble aiChatOpen={aiChatOpen} />
    </div>
  );
}
