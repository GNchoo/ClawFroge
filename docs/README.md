# 🦅 ClawForge: The Ultimate AI Coding Harness

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg)](https://tailwindcss.com/)

**ClawForge** is a high-performance, autonomous AI coding assistant inspired by Claude Code. It provides a powerful web-based harness that allows AI agents to interact directly with your local file system, execute complex search patterns, and manage multi-model workflows seamlessly.

---

## ✨ Key Features

- 🤖 **Autonomous Agent**: An AI that doesn't just talk—it acts. It can explore your codebase, read files, and apply changes autonomously.
- 🌐 **Multi-Provider Support**: Switch between **Google Gemini**, **OpenAI**, **DeepSeek**, and **Local LLMs (Ollama)** with a single click.
- 🛠️ **Powerful Toolset**: Full parity with Claude Code tools, including `list_files`, `read_file`, `write_file`, and `search_code` (grep).
- 🐚 **Real-time Terminal**: Monitor every action the AI takes through an integrated terminal interface.
- 📦 **Ollama Management**: Pull and manage local open-source models (like `llama3`, `qwen3.5`, `mistral`) directly from the UI.
- 🎨 **Modern UI**: A sleek, dark-themed developer interface built with React and Tailwind CSS.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0 or higher.
- **Ollama** (Optional): If you want to use local LLMs. [Download here](https://ollama.com/).
- **API Keys**: For Gemini, OpenAI, or DeepSeek (if using cloud providers).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ClawForge.git
   cd ClawForge
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to `http://localhost:3000`.

---

## 📖 Usage Guide

### 1. Selecting a Provider
Click the **Settings (Gear Icon)** in the sidebar to open the configuration panel. Choose your preferred provider:
- **Gemini**: High-speed, high-context cloud model.
- **OpenAI/DeepSeek**: Industry-standard cloud models (requires API Key).
- **Ollama**: Privacy-focused local models running on your hardware.

### 2. Using Ollama (Local LLMs)
To use local models like `qwen3.5`:
- Ensure Ollama is running on your machine.
- Run Ollama with CORS allowed: `OLLAMA_ORIGINS="*" ollama serve`.
- In ClawForge, select **Ollama** as the provider.
- Use the **"Pull New Model"** section to download any model from the Ollama library.
- Click **[Refresh]** to see your installed models.

### 3. Chatting with the Agent
Simply type your request in the chat box. For example:
- *"Add a dark mode toggle to the header."*
- *"Refactor the file selection logic in Sidebar.tsx."*
- *"Search for all usages of the 'cn' utility function."*

The agent will analyze the codebase, propose a plan, and execute the necessary file changes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, TSX.
- **AI Integration**: `@google/genai`, `openai` SDK, Ollama API.
- **Utilities**: `axios`, `clsx`, `tailwind-merge`.

---

## 📂 Project Structure

```text
ClawForge/
├── src/                # Frontend React application
│   ├── components/     # UI components (Sidebar, Chat, etc.)
│   ├── lib/            # Utility functions
│   └── types.ts        # TypeScript interfaces
├── docs/               # Project documentation and guides
├── server.ts           # Express backend and API proxy
├── package.json        # Dependencies and scripts
└── vite.config.ts      # Vite configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for the developer community.
</p>
