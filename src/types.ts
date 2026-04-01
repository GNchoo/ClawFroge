export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface AppSettings {
  provider: "gemini" | "openai" | "deepseek" | "local";
  model: string;
  localLlmUrl: string;
  openaiKey?: string;
  deepseekKey?: string;
  systemPrompt: string;
}
