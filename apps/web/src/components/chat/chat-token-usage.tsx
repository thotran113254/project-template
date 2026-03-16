import { Coins } from "lucide-react";
import type { TokenUsageInfo } from "@/hooks/use-chat-stream";

interface ChatTokenUsageProps {
  usage: TokenUsageInfo;
}

function formatCost(usd: number): string {
  if (usd < 0.001) return "<$0.001";
  return `$${usd.toFixed(4)}`;
}

/** Compact inline display of token usage and estimated cost for a message. */
export function ChatTokenUsage({ usage }: ChatTokenUsageProps) {
  const { tokenUsage: t, estimatedCost: c } = usage;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-1.5 text-[11px] text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
      <Coins size={12} className="shrink-0 opacity-60" />
      <span>
        Input: <b className="font-medium text-gray-600 dark:text-gray-300">{t.promptTokens.toLocaleString()}</b> tokens
      </span>
      <span>
        Output: <b className="font-medium text-gray-600 dark:text-gray-300">{t.responseTokens.toLocaleString()}</b> tokens
      </span>
      <span>
        Tổng: <b className="font-medium text-gray-600 dark:text-gray-300">{t.totalTokens.toLocaleString()}</b>
      </span>
      <span className="ml-auto font-medium text-teal-600 dark:text-teal-400">
        ~{formatCost(c.totalCost)}
      </span>
    </div>
  );
}
