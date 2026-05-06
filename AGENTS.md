# AGENTS.md - Biblia de Orquestación para Adaptive POS

Este documento sirve como la única fuente de verdad para la orquestación de agentes de IA en el proyecto Adaptive POS, siguiendo un enfoque de Spec-Driven Development (SDD).

---

## Core Architecture Spec

El contrato único de verdad entre el backend y frontend está definido por los esquemas Zod en:

- **Backend**: `backend/src/core/domain/ui-schema.schema.ts`
- **Frontend**: `frontend/src/types/ui-schema.ts` (interfaz TypeScript derivada del esquema Zod)

### Esquema Zod de UISchema
```typescript
import { z } from 'zod';

export const UISchemaSchema = z.object({
  component: z.string().min(1, 'Component name is required'),
  props: z.record(z.string(), z.any()),
  status: z.enum(['loading', 'success', 'error']).default('success'),
});

export type UISchemaZod = z.infer<typeof UISchemaSchema>;

export function validateUISchema(data: unknown): UISchemaZod {
  return UISchemaSchema.parse(data);
}
```

**Reglas del Contrato:**
1. El `component` debe ser una cadena no vacía que coincida con un componente registrado en el `ComponentRegistry`.
2. Los `props` son un objeto cuyas claves son strings y valores de cualquier tipo (validado por el componente consumidor).
3. El `status` es obligatorio y debe ser uno de: 'loading', 'success', 'error'.
4. Cualquier desviación de este esquema provoca un error de validación que debe ser manejado por el `uiGeneratorNode` (backend) y mostrado como `ErrorComponent` (frontend).

---

## Agent Roles & Skills

### [Frontend Agent]
**Responsabilidad:** Materializar UISchemas en componentes React siguiendo el estilo Scandinavian (minimalista, funcional, accesible) usando Tailwind 4 y el Theme vía `@theme`.

**Skills Técnicas:** Ver @[frontend-skill.md]
- Experto en React 18 (hooks, concurrent mode, suspense).
- Dominio de Tailwind 4 (JIT, arbitrary values, layering).
- Implementación y mantenimiento del `ComponentRegistry` (`frontend/src/components/generative/core/ComponentRenderer.tsx`).
- Creación de componentes generativos en `frontend/src/components/generative/` (ej: `catalog/ProductCatalog.tsx`, `messages/SimpleMessage.tsx`).
- Uso de Zod para validación de props en componentes generativos (si aplica).
- Conexión con el backend vía agente de orquestación (no requiere conocimiento de LangGraph, solo del contrato UISchema).

**Archivos Clave:**
- `frontend/src/components/generative/core/ComponentRenderer.tsx`
- `frontend/src/types/ui-schema.ts`
- Cualquier componente bajo `frontend/src/components/generative/`

### [Backend Agent]
**Responsabilidad:** Experto en NestJS y LangGraph.js. Encargado de la lógica de grafos, definición de herramientas (Tools) y la integridad del `uiGeneratorNode`.

**Skills Técnicas:** Ver @[backend-skill.md]
- Arquitectura de NestJS (módulos, servicios, controladores).
- Diseño y compilación de grafos con LangGraph.js (StateGraph, nodos, edges).
- Creación de herramientas (Tools) para LangChain/LangGraph (ej: `get_inventory` en `pos-graph.builder.ts`).
- Manejo de estado del agente (`AgentState` en `backend/src/core/domain/`).
- Ingeniería de prompts para LLMs (sanitización, inyección de datos, manejo de errores).
- Uso de Zod para validación de salidas de LLM (ver `uiGeneratorNode` y `validateUISchema`).
- Integración con servicios externos (GeminiAdapterService, InventoryService).

**Archivos Clave:**
- `backend/src/application/orchestration/pos-graph.builder.ts`
- `backend/src/core/domain/ui-schema.schema.ts`
- `backend/src/core/domain/agent.interaction.dto.ts`
- `backend/src/infrastructure/ai/gemini-adapter.service.ts`
- `backend/src/infrastructure/inventory/inventory.service.ts`

### [QA Agent]
**Responsabilidad:** Encargado de la validación de contratos y prevención de regresiones mediante Prompt Regression Testing.

**Skills Técnicas:** Ver @[qa-skill.md]
- Diseño de tests de regresión para prompts (asegurando que cambios en el sistema no rompan la generación de UISchema válidos).
- Validación exhaustiva del esquema Zod contra salidas esperadas y borderline cases (alucinaciones, JSON malformado, etc.).
- Creación de suites de pruebas que simulan alucinaciones del LLM y verifican el manejo de errores en `uiGeneratorNode`.
- Automatización de pruebas de contrato entre backend y frontend (usando el esquema Zod como fuente de verdad).
- Monitoreo de LangSmith para detectar desviaciones en las salidas del LLM.

**Archivos Clave:**
- Tests unitarios para `validateUISchema` (backend).
- Tests de integración para `pos-graph.builder.ts` (simulando LLM y verificando nodos).
- Tests de componentes frontend que consumen UISchema inválidos.

### [Infra Agent]
**Responsabilidad:** Gestión del monorepo, observabilidad con LangSmith y consistencia de tipos entre paquetes.

**Skills Técnicas:** Ver @[infra-skill.md]
- Configuración de monorepo (Yarn Workspaces, nx, o similares - actual package.json en root).
- Sincronización de tipos entre paquetes (backend y frontend) usando `tsconfig.json` y referencias de proyecto.
- Configuración y mantenimiento de LangSmith para tracing de grafos LangGraph.
- Gestión de variables de entorno (`.env.example`) y secretos.
- Optimización de builds y despliegues (Vite para frontend, NestJS CLI para backend).
- Auditoría de dependencias y licencia.
- Configuración de linting (ESLint, Prettier) y formatting consistente.

**Archivos Clave:**
- Raíz: `package.json` (monorepo), `.yarnrc.yml`, `.gitignore`
- Backend: `backend/package.json`, `backend/tsconfig.json`
- Frontend: `frontend/package.json`, `frontend/tsconfig.json`
- Observabilidad: Configuración de LangSmith en `gemini-adapter.service.ts` o similar.

### [Doc Agent]
**Responsabilidad:** Mantenimiento de la documentación técnica y actualización de los "System Prompts" basada en nuevas funcionalidades.

**Skills Técnicas:**
- Escritura clara y concisa de documentación técnica (Markdown, JSDoc).
- Actualización de `AGENTS.md` y READMEs al cambiar especificaciones.
- Extracción y documentación de System Prompts usados en nodos de LangGraph (ej: `analystNode`, `uiGeneratorNode`).
- Vinculación de cambios en esquemas Zod con actualización de documentación de componentes.
- Mantenimiento de historial de cambios en prompts y su impacto en la generación de UI.
- Creación de diagramas de flujo para grafos LangGraph (actualizados cuando cambian nodos o edges).

**Archivos Clave:**
- Este archivo (`AGENTS.md`).
- Documentación en código (JSDoc en `pos-graph.builder.ts`, `ui-schema.schema.ts`).
- READMEs de paquetes (backend/README.md, frontend/README.md si existen).

---

## Spec-Driven Workflow

El proceso para añadir una nueva funcionalidad sigue estrictamente el enfoque SDD:

1. **Definir el Zod Schema (La Spec)**
   - El agente que inicia la feature (usualmente Backend o Frontend Agent) propone una extensión o modificación al esquema `UISchemaSchema` en `backend/src/core/domain/ui-schema.schema.ts`.
   - La especificación debe incluir:
     - Nuevos campos en `props` (con tipos Zod específicos si es posible, aunque actualmente es `z.any()` por flexibilidad).
     - Nuevos valores para el enum `status` si es necesario (actualmente fijo).
     - Ejemplos de uso válidos e inválidos.
   - **Importante:** Si se cambian los tipos de `props` a algo más específico que `z.any()`, se debe actualizar también la interfaz TypeScript en `frontend/src/types/ui-schema.ts` y los componentes que lo consuman.

2. **QA Agent valida el esquema**
   - El QA Agent escribe tests de regresión para el nuevo esquema:
     - Pruebas de validación positiva (objetos que deben pasar).
     - Pruebas de validación negativa (objetos que deben fallar y por qué).
     - Pruebas de manipulación de JSON (inyección, truncamiento, alucinaciones comunes).
   - Los tests deben pasar antes de continuar. El QA Agent aprueba la spec solo cuando la validación es robusta.

3. **Frontend y Backend Agents implementan en paralelo**
   - **Frontend Agent:**
     - Actualiza el `ComponentRegistry` si se introduce un nuevo tipo de componente.
     - Crea o actualiza el componente generativo correspondiente en `frontend/src/components/generative/`.
     - Asegura que el componente maneje correctamente los nuevos props y estados.
     - Actualiza los tests de componentes para cubrir la nueva funcionalidad.
   - **Backend Agent:**
     - Actualiza el `uiGeneratorNode` en `pos-graph.builder.ts` para que el LLM tenga conocimiento de los nuevos componentes/props (mediante inyección en el system prompt o ejemplos).
     - Si se requieren nuevas herramientas, las implementa y las integra en el grafo.
     - Asegura que los nodos anteriores del grafo (analyst, inventory) pasen correctamente el estado necesario.
     - Actualiza los tests de integración del grafo para cubrir el nuevo flujo.

4. **Integración y Verificación**
   - El QA Agent ejecuta pruebas de contrato end-to-end (simulando un request completo desde el usuario hasta la renderización en frontend).
   - El Infra Agent asegura que los tipos estén sincronizados y que el monorepo build correctamente.
   - El Doc Agent actualiza la documentación y los system prompts si es necesario.

---

## Prompt Engineering Standards

Para asegurar la resiliencia del sistema ante alucinaciones y variaciones del LLM, todos los prompts deben seguir estos estándares:

### 1. Sanitización de JSON
   - **Siempre** limpiar la respuesta del LLM antes de parsearla:
     ```typescript
     private cleanJsonContent(rawContent: string): string {
       return rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
     }
     ```
   - Nunca confiar en que el LLM devuelva JSON puro; asumir que puede envolverlo en markdown o texto adicional.

### 2. Manejo de Mensajes Multimodales
   - El contenido de los mensajes puede ser string o array de bloques (ej: de modelos multimodales). Usar el normalizador existente:
     ```typescript
     private normalizeMessageContent(content: unknown): string {
       if (typeof content === 'string') return content;
       if (Array.isArray(content)) {
         return content
           .map((c) => ('text' in c ? c.text : ''))
           .join('');
       }
       return String(content);
     }
     ```
   - Al construir prompts para el LLM, convertir siempre el historial a strings usando este normalizador.

### 3. Estructura de Prompts para Generación de UI
   - **System Message** debe incluir:
     - Rol claro y restricciones de componentes (ej: "Solo puedes usar estos componentes: ProductCatalog, SimpleMessage").
     - Datos de contexto disponibles (inventario, historial) o instrucciones para usar datos ficticios si no hay datos reales.
     - Ejemplo de respuesta válida (JSON sin markdown).
     - Instrucción explícita de **NO** añadir explicaciones, bloque de código markdown o texto extra.
     - Recordatorio de que el campo `status` es obligatorio y sus valores válidos.
   - **User Messages:** Historial de conversación normalizado (usando `normalizeMessageContent`).

### 4. Manejo de Errores en Prompts
   - Si el LLM no sigue el formato, el nodo debe:
     1. Limpiar el contenido (quitando markdown).
     2. Intentar parsear JSON.
     3. Si falla, generar un UISchema de error estándar:
        ```typescript
        uiSchema = {
          component: 'ErrorComponent',
          props: { message: 'Failed to generate or validate UI' },
          status: 'error',
        };
        ```
   - Nunca dejar que un error de parseo rompa el grafo; siempre devolver un `uiSchema` válido.

### 5. Inyección de Contexto Seguro
   - Al inyectar datos externos (ej: resultados de herramientas) en prompts:
     - Escapar adecuadamente para evitar inyección de prompts.
     - Formatear como texto plano legible (ej: JSON stringificado) dentro del prompt.
     - Nunca permitir que datos externos alteren la estructura del prompt mismo (ej: inyección de nuevas instrucciones).

### 6. Testing de Prompts (Responsabilidad QA Agent)
   - Cada cambio en un system prompt debe ir acompañado de:
     - Tests unitarios que verifiquen que el prompt produce respuestas que pasan la validación Zod para casos de uso típicos.
     - Tests de regresión que usen LangSmith o similares para comparar salidas históricas ante el nuevo prompt.
     - Tests adversativos que simulan alucinaciones comunes (JSON incompleto, campos extra, valores wrong enum).

### 7. Grounding & Zero-Hallucination Policy
- Todos los nodos de generación de UI deben aplicar "Grounding" estricto.
- **Regla:** `UI_Output = f(User_Intent, Tool_Data)`. 
- Si `Tool_Data` es null o vacío para una búsqueda específica, `UI_Output` DEBE ser un mensaje de error o aclaración, nunca una generación creativa de datos ficticios.

---

## Instrucción Final (Tono de Staff Engineer)

Este documento no es una especificación estática, sino un contrato vivo que evoluciona con el proyecto. Como Staff Engineer, su responsabilidad es:

- **Anclar las responsabilidades en la realidad del código:** Las referencias a archivos como `ui-schema.schema.ts`, `pos-graph.builder.ts` y `ComponentRenderer.tsx` no son arbitrarias; son los puntos de integración donde las definiciones de este documento se hacen realidad.
- **Ejercer el juicio técnico:** Cuando surjan ambigüedades entre este documento y la implementación, el código fuente es la autoridad última. Actualice este documento para reflejar la verdad del código, pero solo después de alcanzar consenso mediante el proceso SDD descrito.
- **Fomentar la autonomía con responsabilidad:** Cada agente debe ser experto en su dominio, pero todos deben respetar el contrato del Zod schema. Las desviaciones deben ser propuestas, discutidas y aprobadas mediante el workflow de Spec-Driven Development antes de implementarse.
- **Mantener la tensión creativa:** El equilibrio entre la flexibilidad del LLM y la rigidez del esquema es intencional. No busquen eliminar esa tensión; aprendan a gestionarla mediante pruebas de regresión y ingeniería de prompts meticulosa.
- **Ser el guardián de la consistencia:** El Infra y Doc Agents son particularmente responsables de asegurar que este documento sea fácilmente accesible, que los enlaces a los archivos sean correctos (usando rutas relativas desde la raíz del monorepo) y que cualquier nuevo agente pueda comprender el proyecto en menos de 30 minutos leyendo este archivo y los archivos clave referenciados.

El éxito de Adaptive POS como sistema de IA-native depende de la disciplina en seguir este enfoque de Spec-Driven Development. Que este documento sea su guía y su recordatorio de que la verdadera velocidad viene de la claridad, no de la ausencia de proceso.

---
*Última actualización: 2026-05-05* 
*Autor: Ing. Renny Luzardo*
