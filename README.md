# 🦅 ClawForge: 궁극의 AI 코딩 하네스 (The Ultimate AI Coding Harness)

[🇰🇷 한국어](./README.md) | [🇺🇸 English](./README.en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg)](https://tailwindcss.com/)

**ClawForge**는 Claude Code에서 영감을 받은 고성능 자율 AI 코딩 어시스턴트입니다. AI 에이전트가 로컬 파일 시스템과 직접 상호작용하고, 복잡한 검색 패턴을 실행하며, 멀티 모델 워크플로우를 원활하게 관리할 수 있는 강력한 웹 기반 하네스를 제공합니다.

---

## ✨ 주요 기능

- 🤖 **자율 에이전트**: 단순히 대화만 하는 것이 아니라 직접 행동합니다. 코드베이스를 탐색하고, 파일을 읽고, 자율적으로 변경 사항을 적용합니다.
- 🌐 **멀티 프로바이더 지원**: **Google Gemini**, **OpenAI**, **DeepSeek**, 그리고 로컬 LLM인 **Ollama**를 클릭 한 번으로 전환할 수 있습니다.
- 🛠️ **강력한 툴셋**: `list_files`, `read_file`, `write_file`, `search_code` (grep) 등 Claude Code와 동일한 수준의 도구를 제공합니다.
- 🐚 **실시간 터미널**: AI가 수행하는 모든 작업을 통합 터미널 인터페이스를 통해 실시간으로 모니터링할 수 있습니다.
- 📦 **Ollama 관리**: `llama3`, `qwen3.5`, `mistral`과 같은 로컬 오픈소스 모델을 UI에서 직접 다운로드하고 관리할 수 있습니다.
- 🎨 **현대적인 UI**: React와 Tailwind CSS로 구축된 세련된 다크 테마 개발자 인터페이스를 제공합니다.

---

## 🚀 시작하기

### 사전 요구 사항

- **Node.js**: v18.0 이상.
- **Ollama** (선택 사항): 로컬 LLM을 사용하려는 경우. [여기에서 다운로드](https://ollama.com/).
- **API 키**: 클라우드 프로바이더를 사용하는 경우 Gemini, OpenAI 또는 DeepSeek 키가 필요합니다.

### 설치 방법

1. **저장소 클론**:
   ```bash
   git clone https://github.com/your-username/ClawForge.git
   cd ClawForge
   ```

2. **의존성 설치**:
   ```bash
   npm install
   ```

3. **환경 변수 설정**:
   루트 디렉토리에 `.env` 파일을 생성합니다:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **개발 서버 시작**:
   ```bash
   npm run dev
   ```

5. **브라우저에서 열기**:
   `http://localhost:3000`으로 접속합니다.

---

## 📖 사용 가이드

### 1. 프로바이더 선택
사이드바의 **설정(톱니바퀴 아이콘)**을 클릭하여 구성 패널을 엽니다. 원하는 프로바이더를 선택하세요:
- **Gemini**: 고속, 대규모 컨텍스트 클라우드 모델.
- **OpenAI/DeepSeek**: 업계 표준 클라우드 모델 (API 키 필요).
- **Ollama**: 사용자 하드웨어에서 실행되는 개인정보 보호 중심 로컬 모델.

### 2. Ollama 사용 (로컬 LLM)
`qwen3.5`와 같은 로컬 모델을 사용하려면:
- 로컬 머신에서 Ollama가 실행 중인지 확인하세요.
- CORS가 허용된 상태로 Ollama를 실행합니다: `OLLAMA_ORIGINS="*" ollama serve`.
- ClawForge에서 프로바이더로 **Ollama**를 선택합니다.
- **"Pull New Model"** 섹션을 사용하여 Ollama 라이브러리에서 모델을 다운로드합니다.
- **[Refresh]**를 클릭하여 설치된 모델 목록을 확인합니다.

### 3. 에이전트와 대화하기
채팅창에 요청 사항을 입력하기만 하면 됩니다. 예시:
- *"헤더에 다크 모드 토글 기능을 추가해줘."*
- *"Sidebar.tsx의 파일 선택 로직을 리팩토링해줘."*
- *"'cn' 유틸리티 함수가 사용된 모든 곳을 찾아줘."*

에이전트가 코드베이스를 분석하고, 계획을 제안하며, 필요한 파일 변경을 수행합니다.

---

## 🛠️ 기술 스택

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, TSX.
- **AI Integration**: `@google/genai`, `openai` SDK, Ollama API.
- **Utilities**: `axios`, `clsx`, `tailwind-merge`.

---

## 📂 프로젝트 구조

```text
ClawForge/
├── src/                # 프론트엔드 React 애플리케이션
│   ├── components/     # UI 컴포넌트 (Sidebar, Chat 등)
│   ├── lib/            # 유틸리티 함수
│   └── types.ts        # TypeScript 인터페이스
├── docs/               # 프로젝트 문서 및 가이드
├── server.ts           # Express 백엔드 및 API 프록시
├── package.json        # 의존성 및 스크립트
└── vite.config.ts      # Vite 설정
```

---

## 🤝 기여하기

기여는 언제나 환영합니다! Pull Request를 자유롭게 제출해 주세요.

1. 프로젝트 포크 (Fork)
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경 사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 열기

---

## 📄 라이선스

MIT 라이선스에 따라 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

<p align="center">
  개발자 커뮤니티를 위해 ❤️로 제작되었습니다.
</p>
