import { Sparkles, Wrench } from "lucide-react";

export function AiBadge({ source }: { source: "ai" | "local" }) {
  if (source === "ai") {
    return (
      <span className="badge-ai">
        <Sparkles className="h-3 w-3" /> AI-generated
      </span>
    );
  }
  return (
    <span className="badge-local">
      <Wrench className="h-3 w-3" /> Local rules — AI unavailable
    </span>
  );
}
