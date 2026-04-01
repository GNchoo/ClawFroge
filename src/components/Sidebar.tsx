import { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, Settings, Cpu, Globe, Download, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { FileNode, AppSettings } from "@/src/types";

interface SidebarProps {
  onFileSelect: (path: string) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

export default function Sidebar({ onFileSelect, settings, setSettings }: SidebarProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState("");
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);
  const [pullModelName, setPullModelName] = useState("");

  const POPULAR_MODELS = [
    "llama4", "llama3.3", "mistral-large-2", "phi-4", "gemma-3", 
    "deepseek-v3", "deepseek-coder-v2.5", "qwen3.5", "qwen3", "codestral-v2"
  ];

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then(setFiles)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (settings.provider === "local") {
      fetchOllamaModels();
    }
  }, [settings.provider]);

  const fetchOllamaModels = async () => {
    try {
      const res = await fetch("/api/ollama/models");
      if (res.ok) {
        const data = await res.json();
        setOllamaModels(data);
      }
    } catch (error) {
      console.error("Failed to fetch Ollama models:", error);
    }
  };

  const toggleFolder = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handlePullModel = async (modelName?: string) => {
    const targetModel = modelName || pullModelName;
    if (!targetModel) return;
    setIsPulling(true);
    setPullStatus(`Pulling ${targetModel}...`);
    try {
      const res = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: targetModel }),
      });
      if (res.ok) {
        setPullStatus("Success!");
        fetchOllamaModels();
        setTimeout(() => setPullStatus(""), 3000);
      } else {
        const errorData = await res.json();
        setPullStatus("Failed: Server error");
        console.error("Ollama pull failed:", errorData);
      }
    } catch (error) {
      setPullStatus("Error: Connection failed");
    } finally {
      setIsPulling(false);
    }
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map((node) => (
      <div key={node.path} className="ml-4">
        {node.type === "directory" ? (
          <div>
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-2 w-full text-left py-1 px-2 hover:bg-white/5 rounded text-sm group"
            >
              {expanded[node.path] ? (
                <ChevronDown size={14} className="text-text-secondary" />
              ) : (
                <ChevronRight size={14} className="text-text-secondary" />
              )}
              <Folder size={14} className="text-accent" />
              <span className="truncate">{node.name}</span>
            </button>
            {expanded[node.path] && node.children && renderTree(node.children)}
          </div>
        ) : (
          <button
            onClick={() => onFileSelect(node.path)}
            className="flex items-center gap-2 w-full text-left py-1 px-2 hover:bg-white/5 rounded text-sm pl-6 group"
          >
            <File size={14} className="text-text-secondary" />
            <span className="truncate">{node.name}</span>
          </button>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-sidebar border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-4 border-bottom border-border flex items-center justify-between">
        <h1 className="font-semibold text-accent flex items-center gap-2">
          <Cpu size={18} />
          ClawForge
        </h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            showSettings ? "bg-accent text-white" : "hover:bg-white/10 text-text-secondary"
          )}
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {showSettings ? (
          <div className="space-y-4 p-2">
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) => {
                  const provider = e.target.value as any;
                  let defaultModel = "gemini-3-flash-preview";
                  if (provider === "openai") defaultModel = "gpt-4o";
                  if (provider === "deepseek") defaultModel = "deepseek-chat";
                  if (provider === "local") defaultModel = "llama3";
                  setSettings({ ...settings, provider, model: defaultModel });
                }}
                className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="local">Ollama (Local)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                Model
              </label>
              {settings.provider === "gemini" ? (
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                </select>
              ) : settings.provider === "openai" ? (
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="o1-preview">o1 Preview</option>
                </select>
              ) : settings.provider === "deepseek" ? (
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                >
                  <option value="deepseek-chat">DeepSeek Chat</option>
                  <option value="deepseek-reasoner">DeepSeek Reasoner</option>
                </select>
              ) : (
                <div className="space-y-3">
                  {/* Installed Models Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-text-secondary uppercase block">
                        Installed Models
                      </label>
                      <button 
                        onClick={fetchOllamaModels}
                        className="text-[10px] text-accent hover:underline flex items-center gap-1"
                      >
                        Refresh
                      </button>
                    </div>
                    <select
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                      className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                    >
                      {ollamaModels.length > 0 ? (
                        ollamaModels.map((m) => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))
                      ) : (
                        <option value="">No models found</option>
                      )}
                    </select>
                  </div>

                  {/* Pull New Model */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-medium text-text-secondary uppercase block">
                        Pull New Model
                      </label>
                      <a 
                        href="https://ollama.com/library" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-accent hover:underline"
                      >
                        Browse Library
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pullModelName}
                        onChange={(e) => setPullModelName(e.target.value)}
                        placeholder="e.g. llama3"
                        className="flex-1 bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => handlePullModel()}
                        disabled={isPulling}
                        className="p-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors disabled:opacity-50"
                        title="Pull Model"
                      >
                        {isPulling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Popular Models List */}
                  <div>
                    <label className="text-[10px] font-medium text-text-secondary uppercase mb-1 block">
                      Popular Models
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {POPULAR_MODELS.map(m => (
                        <button
                          key={m}
                          onClick={() => handlePullModel(m)}
                          disabled={isPulling}
                          className="text-[10px] px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-border rounded transition-colors disabled:opacity-50"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {pullStatus && <p className="text-[10px] mt-1 text-accent font-medium">{pullStatus}</p>}
            </div>

            {settings.provider === "openai" && (
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiKey || ""}
                  onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
              </div>
            )}

            {settings.provider === "deepseek" && (
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                  DeepSeek API Key
                </label>
                <input
                  type="password"
                  value={settings.deepseekKey || ""}
                  onChange={(e) => setSettings({ ...settings, deepseekKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
              </div>
            )}

            {settings.provider === "local" && (
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                  Local API URL
                </label>
                <input
                  type="text"
                  value={settings.localLlmUrl}
                  onChange={(e) => setSettings({ ...settings, localLlmUrl: e.target.value })}
                  placeholder="http://localhost:11434/api/generate"
                  className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">
                System Prompt
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                rows={4}
                className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-accent resize-none"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-medium text-text-secondary uppercase px-4 mb-2">
              Files
            </div>
            {renderTree(files)}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-black/20">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Globe size={12} />
          <span className="capitalize">Connected to {settings.provider}</span>
        </div>
      </div>
    </div>
  );
}
