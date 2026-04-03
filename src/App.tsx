/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, AppSettings } from "./types";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { Terminal, X, Maximize2, Minimize2, BookOpen, Settings as SettingsIcon, MessageSquare } from "lucide-react";

const INITIAL_SETTINGS: AppSettings = {
  provider: "gemini",
  model: "gemini-3-flash-preview",
  localLlmUrl: "http://localhost:11434/api/generate",
  systemPrompt: `You are ClawForge, a high-performance AI coding assistant inspired by Claude Code. 
You have full access to the project's file system through a set of powerful tools.
Your goal is to be autonomous, proactive, and efficient. 
When a user asks for a change, first explore the codebase to understand the context, then propose a plan, and finally execute the changes using your tools.
Always use the 'search_code' tool to find relevant patterns and 'list_files' to understand the project structure.
Be precise and thorough in your explanations.`,
};

// Tool Definitions
const listFilesTool: FunctionDeclaration = {
  name: "list_files",
  description: "List all files in the project directory.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const readFileTool: FunctionDeclaration = {
  name: "read_file",
  description: "Read the content of a specific file.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING, description: "The relative path to the file." },
    },
    required: ["path"],
  },
};

const writeFileTool: FunctionDeclaration = {
  name: "write_file",
  description: "Write or update content in a specific file.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: { type: Type.STRING, description: "The relative path to the file." },
      content: { type: Type.STRING, description: "The full content to write." },
    },
    required: ["path", "content"],
  },
};

const searchCodeTool: FunctionDeclaration = {
  name: "search_code",
  description: "Search for a string pattern across all files (grep).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search pattern." },
    },
    required: ["query"],
  },
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalContent, setTerminalContent] = useState<string[]>(["ClawForge Harness v1.2.0 Initialized", "Ready for autonomous execution.", "Full parity with Claude Code tools achieved."]);
  const [activeTab, setActiveTab] = useState<"chat" | "docs">("chat");
  const [docs, setDocs] = useState<{ name: string; path: string }[]>([]);

  useEffect(() => {
    fetch("/api/docs").then(res => res.json()).then(setDocs);
  }, []);

  const addTerminalLine = (line: string) => {
    setTerminalContent(prev => [...prev.slice(-49), line]);
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      switch (settings.provider) {
        case "gemini":
          await handleGemini(content);
          break;
        case "openai":
          await handleOpenAI(content);
          break;
        case "deepseek":
          await handleDeepSeek(content);
          break;
        case "local":
          await handleLocalLlm(content);
          break;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addTerminalLine(`[ERROR] ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeToolCall = async (call: { name: string; args: Record<string, unknown> }) => {
    addTerminalLine(`[TOOL] Calling ${call.name} with ${JSON.stringify(call.args)}`);
    if (call.name === "list_files") {
      const res = await fetch("/api/files");
      return await res.json();
    } else if (call.name === "read_file") {
      const res = await fetch(`/api/file?path=${encodeURIComponent(call.args.path as string)}`);
      return await res.json();
    } else if (call.name === "write_file") {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(call.args),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        addTerminalLine(`[ERROR] Failed to write ${call.args.path}: ${result.error || res.statusText}`);
      } else {
        addTerminalLine(`[FILE] Written to ${call.args.path}`);
      }
      return result;
    } else if (call.name === "search_code") {
      const res = await fetch(`/api/search?q=${encodeURIComponent(call.args.query as string)}`);
      return await res.json();
    }
    return { error: "Unknown tool" };
  };

  const handleGemini = async (content: string) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const tools = [
      { functionDeclarations: [listFilesTool, readFileTool, writeFileTool, searchCodeTool] }
    ];

    // Build history: filter out system messages, map "assistant" → "model"
    const history = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = ai.chats.create({
      model: settings.model,
      config: {
        tools,
        systemInstruction: settings.systemPrompt,
      },
      history,
    });

    // Agentic loop: keep processing tool calls until we get a final text response
    let response = await chat.sendMessage({ message: content });
    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const calls = response.functionCalls;
      if (!calls || calls.length === 0) break;

      addTerminalLine(`[AI] Chain of thought continues with ${calls.length} tool(s)...`);

      // Execute all tool calls in this round, then send all results back at once
      const functionResponses = await Promise.all(
        calls.map(async (call) => {
          const result = await executeToolCall(call as { name: string; args: Record<string, unknown> });
          return {
            functionResponse: {
              name: call.name,
              response: { output: result },
            },
          };
        })
      );

      response = await chat.sendMessage({ message: functionResponses });
    }

    // Display final text response
    const finalText = response.text;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: finalText || "Action completed.",
      timestamp: Date.now(),
    }]);
  };

  const handleLocalLlm = async (content: string) => {
    const response = await fetch("/api/local-llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: settings.localLlmUrl,
        body: {
          model: settings.model,
          prompt: `${settings.systemPrompt}\n\nUser: ${content}`,
          stream: false,
        },
      }),
    });

    const data = await response.json();
    if (data.error) {
      addTerminalLine(`[ERROR] Local LLM: ${data.error}. Ensure Ollama is running locally with OLLAMA_ORIGINS="*"`);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ **Ollama 연결 실패**: ${data.error}\n\n웹 버전에서는 서버에 Ollama가 설치되어 있지 않아 로컬 LLM을 직접 실행할 수 없습니다. 본인의 컴퓨터에서 Ollama를 실행 중이라면, CORS 설정을 확인하시거나 로컬에서 이 프로젝트를 실행해 주세요.`,
        timestamp: Date.now()
      }]);
      return;
    }
    
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.response || data.content || "No response from local LLM.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleOpenAI = async (content: string) => {
    if (!settings.openaiKey) {
      addTerminalLine("[ERROR] OpenAI API Key is missing.");
      return;
    }

    const response = await fetch("/api/chat/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: settings.openaiKey,
        model: settings.model,
        messages: [
          { role: "system", content: settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "No response from OpenAI.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleDeepSeek = async (content: string) => {
    if (!settings.deepseekKey) {
      addTerminalLine("[ERROR] DeepSeek API Key is missing.");
      return;
    }

    const response = await fetch("/api/chat/deepseek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: settings.deepseekKey,
        model: settings.model,
        messages: [
          { role: "system", content: settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "No response from DeepSeek.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleFileSelect = async (path: string) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      
      const systemMsg: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `Reading file: \`${path}\`\n\n\`\`\`\n${data.content}\n\`\`\``,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text-primary">
      <Sidebar 
        onFileSelect={handleFileSelect} 
        settings={settings} 
        setSettings={setSettings} 
      />
      
      <main className="flex-1 flex flex-col relative">
        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-sidebar/50">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === "chat" ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}
          >
            <MessageSquare size={16} />
            CHAT
          </button>
          <button 
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === "docs" ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}
          >
            <BookOpen size={16} />
            DOCS
          </button>
        </div>

        {activeTab === "chat" ? (
          <Chat 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="text-accent" />
              Documentation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.map((doc, i) => (
                <div 
                  key={i} 
                  className="p-4 bg-sidebar border border-border rounded-lg cursor-pointer hover:border-accent transition-all group"
                  onClick={() => handleFileSelect(doc.path)}
                >
                  <h3 className="font-medium group-hover:text-accent transition-colors">{doc.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">View documentation for {doc.name.replace('.md', '')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terminal Overlay */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-sidebar border-t border-border transition-all duration-300 ease-in-out ${
            terminalOpen ? 'h-64' : 'h-10'
          }`}
        >
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5"
            onClick={() => setTerminalOpen(!terminalOpen)}
          >
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
              <Terminal size={14} />
              <span>TERMINAL</span>
            </div>
            <div className="flex items-center gap-2">
              {terminalOpen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </div>
          </div>
          
          {terminalOpen && (
            <div className="p-4 font-mono text-xs overflow-y-auto h-52 custom-scrollbar bg-black/40">
              {terminalContent.map((line, i) => (
                <div key={i} className="mb-1">
                  <span className="text-accent mr-2">$</span>
                  {line}
                </div>
              ))}
              <div className="flex items-center">
                <span className="text-accent mr-2">$</span>
                <input 
                  type="text" 
                  className="bg-transparent outline-none flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const cmd = (e.target as HTMLInputElement).value;
                      setTerminalContent(prev => [...prev, cmd, `Command '${cmd}' executed (simulation)`]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

