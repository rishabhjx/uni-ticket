"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/tickets/user-avatar";
import { ASSISTANT_SUGGESTIONS, answerAssistant } from "@/lib/assistant";
import { CURRENT_USER_ID } from "@/lib/mock";
import { useChatStore } from "@/lib/store/chat-store";
import { useTicketStore } from "@/lib/store/ticket-store";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; text: string };

export function AiAssistant() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const { tickets, projects } = useTicketStore();
  const { conversations, messages } = useChatStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerAssistant(trimmed, {
      tickets,
      projects,
      conversations,
      chatMessages: messages,
    });
    setTurns((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: answer },
    ]);
    setInput("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
        title="Ask AI"
        className="flex size-7 items-center justify-center rounded-md text-grey-500 transition-colors hover:bg-grey-100 hover:text-grey-900"
      >
        <Sparkles className="size-4" strokeWidth={1.75} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="hairline-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent-600" strokeWidth={1.75} />
              Ask AI
            </SheetTitle>
            <p className="text-caption text-grey-500">
              Simulated in this prototype — it reads the workspace&apos;s own data, not a real
              model.
            </p>
          </SheetHeader>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {turns.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-small text-grey-600">Try asking:</p>
                {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="rounded-md border border-grey-200 px-2.5 py-1.5 text-left text-small text-grey-700 transition-colors hover:border-grey-300 hover:bg-grey-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {turns.map((turn, index) => (
                  <div
                    key={index}
                    className={cn("flex gap-2", turn.role === "user" && "flex-row-reverse")}
                  >
                    {turn.role === "user" ? (
                      <UserAvatar userId={CURRENT_USER_ID} size="sm" className="mt-0.5 shrink-0" />
                    ) : (
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700">
                        <Sparkles className="size-3" strokeWidth={1.75} />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-md px-2.5 py-1.5 text-small whitespace-pre-wrap",
                        turn.role === "user"
                          ? "bg-accent-600 text-grey-0"
                          : "bg-grey-100 text-grey-800",
                      )}
                    >
                      {turn.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="hairline-t flex items-center gap-2 p-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a ticket, channel or project"
              aria-label="Ask AI"
              className="h-8 min-w-0 flex-1 rounded-md border border-grey-200 px-2.5 text-small text-grey-900 placeholder:text-grey-500 focus:border-accent-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-8 shrink-0 rounded-md bg-accent-600 px-3 text-small font-medium text-grey-0 transition-colors hover:bg-accent-700 disabled:bg-grey-100 disabled:text-grey-400"
            >
              Ask
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
