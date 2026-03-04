import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Khách sạn view biển?",
  "Combo Đà Lạt 3N2Đ?",
  "Tìm phòng decor vintage",
];

interface ChatSuggestionChipsProps {
  onSelect: (text: string) => void;
}

/** Row of quick-reply suggestion chips for the chat interface. */
export function ChatSuggestionChips({ onSelect }: ChatSuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={cn(
            "rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors",
            "hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
            "focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1",
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
