import { StateGraph, END, CompiledStateGraph } from '@langchain/langgraph';
import { GeminiAdapterService } from '../../infrastructure/ai/gemini-adapter.service';
import { InventoryService } from '../../infrastructure/inventory/inventory.service';
import { AgentState, UISchema } from '../../core/domain';
import { validateUISchema } from '../../core/domain/ui-schema.schema';
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export class PosGraphBuilder {
  private graph: StateGraph<any>;

  constructor(
    private geminiAdapter: GeminiAdapterService,
    private inventoryService: InventoryService
  ) {
    this.graph = new StateGraph<AgentState>({
      channels: {
        messages: {
          reducer: (_: Array<{ role: string; content: string }>, y: Array<{ role: string; content: string }>) => y,
          default: () => [],
        },
        uiSchema: {
          reducer: (_: UISchema | undefined, y: UISchema | undefined) => y,
          default: () => undefined,
        },
        currentStep: {
          reducer: (_: string, y: string) => y,
          default: () => 'initial',
        },
      },
    });

    this.setupNodes();
    this.setupEdges();
  }

  /**
   * Safely normalize message content to string
   * Handles string, array of content blocks, or other types
   */
  private normalizeMessageContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((c) => ('text' in c ? c.text : ''))
        .join('');
    }
    return String(content);
  }

  /**
   * Clean JSON content by removing Markdown code blocks
   * Removes ```json, ``` and any surrounding whitespace
   */
  private cleanJsonContent(rawContent: string): string {
    // Remove ```json at the start and ``` at the end
    let cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleaned;
  }

  private setupNodes(): void {
    this.graph.addNode('analystNode', this.analystNode.bind(this));
    this.graph.addNode('inventoryToolNode', this.inventoryToolNode.bind(this));
    this.graph.addNode('uiGeneratorNode', this.uiGeneratorNode.bind(this));
  }

  private setupEdges(): void {
    this.graph.setEntryPoint('analystNode' as any);
    this.graph.addEdge('analystNode' as any, 'inventoryToolNode' as any);
    this.graph.addEdge('inventoryToolNode' as any, 'uiGeneratorNode' as any);
    this.graph.addEdge('uiGeneratorNode' as any, END);
  }

  /**
   * Tool function to query inventory
   * This will be called by the LLM when it needs product information
   */
  private getInventoryTool = tool(
    async (input: { query?: string }) => {
      const products = input.query
        ? this.inventoryService.searchProducts(input.query)
        : this.inventoryService.getAllProducts();

      return JSON.stringify(products);
    },
    {
      name: 'get_inventory',
      description: 'Get all products or search products by name from the inventory',
      schema: z.object({
        query: z.string().optional().describe('Search query for product names (optional)'),
      }),
    }
  );

  private async analystNode(state: AgentState): Promise<Partial<AgentState>> {
    const model = this.geminiAdapter.getModel();

    const systemPrompt = new SystemMessage(
      'You are a POS (Point of Sale) assistant. Analyze the user request and determine what action needs to be taken. If the user asks about products, stock, or inventory, use the get_inventory tool.'
    );

    const userMessages = state.messages.map(
      (msg) => new HumanMessage(this.normalizeMessageContent(msg.content))
    );

    const response = await model.invoke([systemPrompt, ...userMessages]);

    return {
      messages: [...state.messages, { role: 'assistant', content: this.normalizeMessageContent(response.content) }],
      currentStep: 'inventory_check',
    };
  }

  private async inventoryToolNode(state: AgentState): Promise<Partial<AgentState>> {
    // Check if the user is asking about inventory
    const lastMessage = state.messages[state.messages.length - 1];
    const lastContent = this.normalizeMessageContent(lastMessage.content).toLowerCase();

    if (lastContent.includes('producto') || lastContent.includes('stock') || lastContent.includes('inventario') || lastContent.includes('catalog')) {
      const products = this.inventoryService.getAllProducts();
      const inventoryInfo = `Productos disponibles: ${JSON.stringify(products)}`;

      return {
        messages: [
          ...state.messages,
          { role: 'assistant', content: inventoryInfo },
        ],
        currentStep: 'ui_generation',
      };
    }

    // No inventory query needed, proceed to UI generation
    return {
      messages: [...state.messages],
      currentStep: 'ui_generation',
    };
  }

  private async uiGeneratorNode(state: AgentState): Promise<Partial<AgentState>> {
    const model = this.geminiAdapter.getModel();

    // Check if inventory data is available in messages
    const inventoryData = state.messages.find((msg) =>
      this.normalizeMessageContent(msg.content).includes('Productos disponibles:')
    );

    // Check if inventory is empty
    let inventoryProducts: any[] = [];
    if (inventoryData) {
      try {
        const data = this.normalizeMessageContent(inventoryData.content);
        const jsonStart = data.indexOf('[');
        const jsonEnd = data.lastIndexOf(']') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonString = data.substring(jsonStart, jsonEnd);
          inventoryProducts = JSON.parse(jsonString);
        }
      } catch (e) {
        // If parsing fails, we'll have an empty inventory
        inventoryProducts = [];
      }
    }

    const systemPrompt = new SystemMessage(
      `Eres un generador de interfaces para un POS siguiendo estrictamente la política de "Zero-Hallucination". 
      Si el inventario está vacío, DEBES usar el componente SimpleMessage con un mensaje aclaratorio.
      Si hay productos en inventario, puedes usar ProductCatalog.

      Componentes permitidos:
      - ProductCatalog: { items: Array<{id: number, name: string, price: number, stock: number}> }
      - SimpleMessage: { text: string, type: "info" | "success" | "warning" }

      ${inventoryData && inventoryProducts.length > 0 
        ? `DATOS DE INVENTARIO DISPONIBLES: ${this.normalizeMessageContent(inventoryData.content)}. Usa estos datos reales para generar el ProductCatalog.` 
        : 'NO HAY DATOS DE INVENTARIO DISPONIBLES. Debes usar SimpleMessage para informar que no hay productos disponibles.'}

      EJEMPLO DE RESPUESTA VÁLIDA:
      { "component": "ProductCatalog", "props": { "items": [...] }, "status": "success" }
      o
      { "component": "SimpleMessage", "props": { "text": "No hay productos disponibles actualmente", "type": "info" }, "status": "success" }

      REGLA CRÍTICA: RESPONDE ÚNICAMENTE CON EL JSON, SIN EXPLICACIONES NI BLOQUES DE CÓDIGO DE MARKDOWN. 
      No uses backticks (\`\`). El campo status es obligatorio y debe ser "loading", "success" o "error".`
    );

    const userMessages = state.messages.map(
      (msg) => new HumanMessage(this.normalizeMessageContent(msg.content))
    );

    const response = await model.invoke([systemPrompt, ...userMessages]);
    const rawContent = this.normalizeMessageContent(response.content);
    const cleanedContent = this.cleanJsonContent(rawContent);

    let uiSchema: UISchema;
    try {
      const parsed = JSON.parse(cleanedContent);
      uiSchema = validateUISchema(parsed);
    } catch (error) {
      console.error('UI Schema validation error:', error);
      console.error('Raw content:', rawContent);
      console.error('Cleaned content:', cleanedContent);
      uiSchema = {
        component: 'ErrorComponent',
        props: { message: 'Failed to generate or validate UI' },
        status: 'error',
      };
    }

    return {
      uiSchema,
      currentStep: 'completed',
    };
  }

  public build(): any {
    return this.graph.compile();
  }

  public async invoke(input: AgentState): Promise<AgentState> {
    const compiledGraph = this.build();
    return (await compiledGraph.invoke(input)) as AgentState;
  }
}

