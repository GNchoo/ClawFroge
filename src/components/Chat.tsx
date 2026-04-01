import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Message, AppSettings } from "@/src/types";
import CodeBlock from "./CodeBlock";

interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export default function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-accent" />
            <div>
              <h2 className="text-xl font-semibold">How can I help you today?</h2>
              <p className="text-sm text-text-secondary max-w-md">
                I can help you write code, debug errors, or explain complex concepts.
                Try asking about the current project structure.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === "user" ? "bg-accent" : "bg-sidebar border border-border"
                )}
              >
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  "flex-1 px-4 py-2 rounded-2xl text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-accent/10 text-text-primary border border-accent/20"
                    : "bg-sidebar/50 text-text-primary border border-border"
                )}
              >
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, "")}
                        />
                      ) : (
                        <code className={cn("bg-white/10 px-1 rounded", className)} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-sidebar border border-border flex items-center justify-center animate-pulse">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 text-text-secondary text-sm italic">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-sidebar/30">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-accent transition-colors resize-none custom-scrollbar max-h-48"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-accent text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-[10px] text-center mt-2 text-text-secondary">
          CodeForge can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
}
