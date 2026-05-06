# Adaptive POS

🚀 **AI-Driven Generative UI Orchestration with LangGraph & NestJS**

An adaptive Point of Sale (POS) system that uses artificial intelligence to dynamically generate user interfaces through Server-Driven UI architecture. The backend evaluates user intent and returns UI schemas that the frontend renders in real-time.

## 🏗️ Innovative Architecture

### Core Paradigm: Generative UI
- **Intelligent Backend**: NestJS + LangGraph.js evaluates user intent and returns **UI Schemas** (which component to render and with what props)
- **Adaptive Frontend**: React acts as an intelligent dumb client with a dictionary of pre-built components that mount dynamically
- **Real-time Communication**: Server-Sent Events (SSE) to emit graph state to the client

### Tech Stack

#### Backend (NestJS)
```
🔧 Framework: NestJS (TypeScript)
🧠 AI Orchestration: LangGraph.js (@langchain/langgraph)
🤖 LLM Provider: Google Gemini API (@langchain/google-genai)
✅ Validation: Zod for robust schemas
📦 Architecture: Modules, services, and controllers
🔍 Observability: LangSmith integration
```

#### Frontend (React)
```
⚛️ Framework: React 19 with modern hooks
🎨 Styling: TailwindCSS 4 (JIT, arbitrary values)
🔧 Build: Vite for fast development
🧩 Components: Generative with ComponentRegistry
📱 UI: Scandinavian style (minimalist, functional)
```

## 🚀 Key Features

### 🤖 Intelligent Agents
Specialized multi-agent system with defined roles:

- **Frontend Agent**: Materializes UISchemas into React components
- **Backend Agent**: Expert in NestJS and LangGraph.js
- **QA Agent**: Contract validation and regression testing
- **Infra Agent**: Monorepo management and observability
- **Doc Agent**: Technical documentation maintenance

### 📋 Single Contract Schema
The contract between backend and frontend is defined by Zod schemas:

```typescript
// UISchema - Single source of truth
{
  component: string,    // Component name to render
  props: Record<string, any>,  // Component properties
  status: 'loading' | 'success' | 'error'  // State
}
```

### 🔧 Integrated Tools
- **Inventory Management**: LangGraph tools with product data access
- **Shopping Cart**: Services for POS operations handling
- **Robust Validation**: LLM hallucination handling with JSON sanitization

## 📁 Project Structure

```
Adaptive-POS/
├── backend/                 # NestJS API + LangGraph
│   ├── src/
│   │   ├── application/     # Orchestration logic
│   │   │   └── orchestration/
│   │   │       └── pos-graph.builder.ts  # Main graph
│   │   ├── core/           # Domain and schemas
│   │   │   └── domain/
│   │   │       ├── ui-schema.schema.ts   # Zod contract
│   │   │       └── agent.interaction.dto.ts
│   │   ├── infrastructure/ # External services
│   │   │   ├── ai/gemini-adapter.service.ts
│   │   │   ├── inventory/inventory.service.ts
│   │   │   └── cart/cart.service.ts
│   │   └── controllers/    # API endpoints
│   └── package.json
├── frontend/               # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── generative/  # Dynamic components
│   │   │       ├── core/ComponentRenderer.tsx
│   │   │       ├── catalog/ProductCatalog.tsx
│   │   │       └── messages/SimpleMessage.tsx
│   │   ├── types/
│   │   │   └── ui-schema.ts  # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── AGENTS.md              # Agent documentation
└── README.md
```

## 🛠️ Setup and Development

### Prerequisites
- Node.js 18+
- Yarn 4.x
- Google Gemini API Key

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Adaptive-POS

# Install monorepo dependencies
yarn install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Gemini API key
```

### Development
```bash
# Backend (NestJS)
cd backend
yarn start:dev

# Frontend (React)
cd frontend
yarn dev
```

### Available Scripts
```bash
# Backend
yarn build          # Production build
yarn test           # Unit tests
yarn test:e2e       # End-to-end tests
yarn lint           # ESLint linting

# Frontend
yarn build          # Production build
yarn preview        # Preview build
yarn lint           # ESLint linting
```

## 🧪 Testing and Quality

### Testing Strategy
- **Prompt Regression Testing**: Prompt validation against hallucinations
- **Contract Testing**: UISchema verification
- **Integration Tests**: Complete user-to-UI flow
- **Component Tests**: React component validation

### Code Quality
- **Strict TypeScript**: No `any`, robust typing
- **ESLint + Prettier**: Consistent formatting
- **Zod Validation**: Runtime validation
- **Jest**: Testing framework

## 🌟 Why Adaptive POS is Different

### 🎯 Spec-Driven Development (SDD) Approach
1. **Define Zod Schema** (The Spec)
2. **QA Agent Validates** with regression tests
3. **Frontend and Backend** implement in parallel
4. **Integration** and end-to-end verification

### 🛡️ Hallucination Resilience
- Automatic JSON sanitization
- Robust error handling
- Runtime Zod validation
- Fallback components for errors

### 🚀 Performance and Scalability
- React 19 with concurrent mode
- TailwindCSS 4 JIT compilation
- NestJS with modular architecture
- LangGraph for efficient orchestration

## 🤝 How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** the Spec-Driven Workflow defined in `AGENTS.md`
4. **Test** with the complete test suite
5. **Commit** with conventional messages
6. **Push** to the branch and create a **Pull Request**

## 📄 License

This project is under UNLICENSED license.

## 👥 Team

Project developed following the specialized agent methodology defined in `AGENTS.md`.

---

**🔮 The future of POS is adaptive, intelligent, and generative.**
