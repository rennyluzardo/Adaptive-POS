# Adaptive POS

🚀 **AI-Driven Generative UI Orchestration with LangGraph & NestJS**

Un sistema de Punto de Venta (POS) adaptativo que utiliza inteligencia artificial para generar interfaces de usuario dinámicamente mediante arquitectura Server-Driven UI. El backend evalúa la intención del usuario y devuelve esquemas de UI que el frontend renderiza en tiempo real.

## 🏗️ Arquitectura Innovadora

### Paradigma Core: Generative UI
- **Backend Inteligente**: NestJS + LangGraph.js evalúa la intención del usuario y devuelve **Esquemas de UI** (qué componente renderizar y con qué props)
- **Frontend Adaptativo**: React actúa como un cliente tonto inteligente con un diccionario de componentes pre-construidos que se montan dinámicamente
- **Comunicación en Tiempo Real**: Server-Sent Events (SSE) para emitir el estado del grafo al cliente

### Stack Tecnológico

#### Backend (NestJS)
```
🔧 Framework: NestJS (TypeScript)
🧠 IA Orquestación: LangGraph.js (@langchain/langgraph)
🤖 LLM Provider: Google Gemini API (@langchain/google-genai)
✅ Validación: Zod para esquemas robustos
📦 Arquitectura: Módulos, servicios y controladores
🔍 Observabilidad: Integración con LangSmith
```

#### Frontend (React)
```
⚛️ Framework: React 19 con hooks modernos
🎨 Styling: TailwindCSS 4 (JIT, arbitrary values)
🔧 Build: Vite para desarrollo rápido
🧩 Componentes: Generativos con ComponentRegistry
📱 UI: Estilo Scandinavian (minimalista, funcional)
```

## 🚀 Características Principales

### 🤖 Agentes Inteligentes
Sistema multi-agente especializado con roles definidos:

- **Frontend Agent**: Materializa UISchemas en componentes React
- **Backend Agent**: Experto en NestJS y LangGraph.js
- **QA Agent**: Validación de contratos y pruebas de regresión
- **Infra Agent**: Gestión de monorepo y observabilidad
- **Doc Agent**: Mantenimiento de documentación técnica

### 📋 Esquema de Contrato Único
El contrato entre backend y frontend está definido por esquemas Zod:

```typescript
// UISchema - Contrato único de verdad
{
  component: string,    // Nombre del componente a renderizar
  props: Record<string, any>,  // Propiedades del componente
  status: 'loading' | 'success' | 'error'  // Estado
}
```

### 🔧 Herramientas Integradas
- **Gestión de Inventario**: Tools para LangGraph con acceso a datos de productos
- **Carrito de Compras**: Servicios para manejo de operaciones POS
- **Validación Robusta**: Manejo de alucinaciones LLM con sanitización JSON

## 📁 Estructura del Proyecto

```
Adaptive-POS/
├── backend/                 # NestJS API + LangGraph
│   ├── src/
│   │   ├── application/     # Lógica de orquestación
│   │   │   └── orchestration/
│   │   │       └── pos-graph.builder.ts  # Grafo principal
│   │   ├── core/           # Dominio y esquemas
│   │   │   └── domain/
│   │   │       ├── ui-schema.schema.ts   # Contrato Zod
│   │   │       └── agent.interaction.dto.ts
│   │   ├── infrastructure/ # Servicios externos
│   │   │   ├── ai/gemini-adapter.service.ts
│   │   │   ├── inventory/inventory.service.ts
│   │   │   └── cart/cart.service.ts
│   │   └── controllers/    # Endpoints API
│   └── package.json
├── frontend/               # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   └── generative/  # Componentes dinámicos
│   │   │       ├── core/ComponentRenderer.tsx
│   │   │       ├── catalog/ProductCatalog.tsx
│   │   │       └── messages/SimpleMessage.tsx
│   │   ├── types/
│   │   │   └── ui-schema.ts  # Tipos TypeScript
│   │   └── App.tsx
│   └── package.json
├── AGENTS.md              # Documentación de agentes
└── README.md
```

## 🛠️ Configuración y Desarrollo

### Prerrequisitos
- Node.js 18+
- Yarn 4.x
- Google Gemini API Key

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd Adaptive-POS

# Instalar dependencias del monorepo
yarn install

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tu API key de Gemini
```

### Desarrollo
```bash
# Backend (NestJS)
cd backend
yarn start:dev

# Frontend (React)
cd frontend
yarn dev
```

### Scripts Disponibles
```bash
# Backend
yarn build          # Build para producción
yarn test           # Tests unitarios
yarn test:e2e       # Tests end-to-end
yarn lint           # Linting con ESLint

# Frontend
yarn build          # Build para producción
yarn preview        # Preview del build
yarn lint           # Linting con ESLint
```

## 🧪 Testing y Calidad

### Estrategia de Testing
- **Prompt Regression Testing**: Validación de prompts contra alucinaciones
- **Contract Testing**: Verificación del esquema UISchema
- **Integration Tests**: Flujo completo de usuario a UI
- **Component Tests**: Validación de componentes React

### Calidad de Código
- **TypeScript Estricto**: Sin `any`, tipado robusto
- **ESLint + Prettier**: Formato consistente
- **Zod Validation**: Validación en runtime
- **Jest**: Framework de testing

## 🌟 Por Qué Adaptive POS es Diferente

### 🎯 Enfoque Spec-Driven Development (SDD)
1. **Definir Esquema Zod** (La Spec)
2. **QA Agent Valida** con tests de regresión
3. **Frontend y Backend** implementan en paralelo
4. **Integración** y verificación end-to-end

### 🛡️ Resiliencia ante Alucinaciones
- Sanitización JSON automática
- Manejo de errores robusto
- Validación Zod en runtime
- Componentes fallback para errores

### 🚀 Performance y Escalabilidad
- React 19 con concurrent mode
- TailwindCSS 4 JIT compilation
- NestJS con arquitectura modular
- LangGraph para orquestación eficiente

## 🤝 Cómo Contribuir

1. **Fork** el repositorio
2. **Crear** una feature branch (`git checkout -b feature/amazing-feature`)
3. **Seguir** el Spec-Driven Workflow definido en `AGENTS.md`
4. **Testear** con el suite completo de pruebas
5. **Commit** con mensajes convencionales
6. **Push** al branch y crear **Pull Request**

## 📄 Licencia

Este proyecto está bajo licencia UNLICENSED.

## 👥 Equipo

Proyecto desarrollado siguiendo la metodología de agentes especializados definida en `AGENTS.md`.

---

**🔮 El futuro del POS es adaptativo, inteligente y generativo.**
