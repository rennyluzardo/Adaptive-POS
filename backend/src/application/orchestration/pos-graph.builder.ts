import { StateGraph, END, CompiledStateGraph } from '@langchain/langgraph';
import { GeminiAdapterService } from '../../infrastructure/ai/gemini-adapter.service';
import { InventoryService } from '../../infrastructure/inventory/inventory.service';
import { CartService } from '../../infrastructure/cart/cart.service';
import { AgentState, UISchema } from '../../core/domain';
import { validateUISchema } from '../../core/domain/ui-schema.schema';
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export class PosGraphBuilder {
  private graph: StateGraph<any>;

  constructor(
    private geminiAdapter: GeminiAdapterService,
    private inventoryService: InventoryService,
    private cartService: CartService
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
    this.graph.addNode('cartNode', this.cartNode.bind(this));
    this.graph.addNode('inventoryToolNode', this.inventoryToolNode.bind(this));
    this.graph.addNode('uiGeneratorNode', this.uiGeneratorNode.bind(this));
  }

  private setupEdges(): void {
    // Set the entry point to analystNode
    this.graph.setEntryPoint('analystNode' as any);
    
    // Add conditional edges based on intent
    this.graph.addConditionalEdges(
      'analystNode' as any,
      this.routeByIntent.bind(this),
      {
        cart: 'cartNode' as any,
        inventory: 'inventoryToolNode' as any,
        ui: 'uiGeneratorNode' as any
      }
    );
    
    // Add edges from cartNode and inventoryToolNode to uiGeneratorNode
    this.graph.addEdge('cartNode' as any, 'uiGeneratorNode' as any);
    this.graph.addEdge('inventoryToolNode' as any, 'uiGeneratorNode' as any);
    
    // Add edge from uiGeneratorNode to END
    this.graph.addEdge('uiGeneratorNode' as any, END);
  }

  /**
   * Conditional routing function based on user intent
   */
  private routeByIntent(state: AgentState): string {
    const userMessage = state.messages.find(msg => msg.role === 'user');
    const userContent = this.normalizeMessageContent(userMessage?.content || '').toLowerCase();

    // Check if user is asking about cart operations
    const cartKeywords = ['agregar', 'añadir', 'carrito', 'comprar', 'remover', 'quitar', 'limpiar', 'vaciar', 'ver', 'mostrar', 'qué llevo', 'total'];
    const isCartRequest = cartKeywords.some(keyword => userContent.includes(keyword));

    // Check if user is asking about inventory
    const inventoryKeywords = ['producto', 'productos', 'stock', 'inventario', 'catalog', 'muestrame', 'mostrar', 'lista'];
    const isInventoryRequest = inventoryKeywords.some(keyword => userContent.includes(keyword));

    if (isCartRequest) {
      return 'cart';
    } else if (isInventoryRequest) {
      return 'inventory';
    } else {
      return 'ui';
    }
  }

  /**
   * Tool function to handle cart actions
   * This will be called by the LLM when it needs to manipulate the shopping cart
   */
  private handleCartActionTool = tool(
    async (input: { action: string; productName?: string; quantity?: number }) => {
      const { action, productName, quantity = 1 } = input;

      switch (action) {
        case 'add':
          if (!productName) {
            return JSON.stringify({ success: false, message: 'Se requiere el nombre del producto para agregar al carrito' });
          }

          const products = this.inventoryService.searchProducts(productName);
          if (products.length === 0) {
            return JSON.stringify({ success: false, message: `Producto "${productName}" no encontrado` });
          }

          const product = products[0]; // Take first match
          const result = this.cartService.addToCart(product, quantity);
          return JSON.stringify(result);

        case 'remove':
          if (!productName) {
            return JSON.stringify({ success: false, message: 'Se requiere el nombre del producto para remover del carrito' });
          }

          const removeProducts = this.inventoryService.searchProducts(productName);
          if (removeProducts.length === 0) {
            return JSON.stringify({ success: false, message: `Producto "${productName}" no encontrado` });
          }

          const removeProduct = removeProducts[0];
          const removeResult = this.cartService.removeFromCart(removeProduct.id, quantity);
          return JSON.stringify(removeResult);

        case 'clear':
          const clearResult = this.cartService.clearCart();
          return JSON.stringify(clearResult);

        case 'view':
          const cart = this.cartService.getCart();
          return JSON.stringify({ success: true, cart });

        default:
          return JSON.stringify({ success: false, message: `Acción "${action}" no válida. Use: add, remove, clear, view` });
      }
    },
    {
      name: 'handle_cart_action',
      description: 'Handle shopping cart operations: add, remove, clear, or view cart',
      schema: z.object({
        action: z.enum(['add', 'remove', 'clear', 'view']).describe('Cart action to perform'),
        productName: z.string().optional().describe('Product name for add/remove actions'),
        quantity: z.number().optional().default(1).describe('Quantity for add/remove actions'),
      }),
    }
  );

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
    const userMessage = state.messages.find(msg => msg.role === 'user');
    const userContent = this.normalizeMessageContent(userMessage?.content || '').toLowerCase();

    // Check if user is asking about cart operations
    const cartKeywords = ['agregar', 'añadir', 'carrito', 'comprar', 'remover', 'quitar', 'limpiar', 'vaciar', 'ver', 'mostrar', 'qué llevo', 'total'];
    const isCartRequest = cartKeywords.some(keyword => userContent.includes(keyword));

    // Check if user is asking about inventory
    const inventoryKeywords = ['producto', 'productos', 'stock', 'inventario', 'catalog', 'muestrame', 'mostrar', 'lista'];
    const isInventoryRequest = inventoryKeywords.some(keyword => userContent.includes(keyword));

    // Return the state without modifying messages - let the specific nodes handle processing
    return {
      messages: state.messages,
      currentStep: 'routing',
    };
  }

  private async cartNode(state: AgentState): Promise<Partial<AgentState>> {
    // Extract user message and determine action
    const userMessage = state.messages.find(msg => msg.role === 'user');
    const userContent = this.normalizeMessageContent(userMessage?.content || '').toLowerCase();

    // Check if user is asking about cart operations
    const cartKeywords = ['agregar', 'añadir', 'carrito', 'comprar', 'remover', 'quitar', 'limpiar', 'vaciar', 'ver', 'mostrar', 'qué llevo', 'total'];
    const isCartRequest = cartKeywords.some(keyword => userContent.includes(keyword));

    // If not a cart request, skip processing and preserve existing state
    if (!isCartRequest) {
      return {
        messages: state.messages, // Don't spread - preserve the exact state
        currentStep: 'ui_generation',
      };
    }

    // Execute cart action directly
    const action = userContent.includes('agregar') || userContent.includes('agrega') || userContent.includes('añadir') || userContent.includes('comprar') ? 'add' : 
                 userContent.includes('remover') || userContent.includes('quitar') ? 'remove' :
                 userContent.includes('limpiar') || userContent.includes('vaciar') ? 'clear' : 'view';
    
    // Extract product name from user message
    let productName = '';
    if (action === 'add' || action === 'remove') {
      // Try to extract product name - more flexible patterns
      const patterns = [
        /(?:agrega|agregar|añadir|comprar)\s+(?:el\s+)?(.+?)(?:\s+al\s+carrito)?/i,
        /(?:remover|quitar)\s+(?:del\s+)?(.+?)(?:\s+del\s+carrito)?/i
      ];
      
      for (const pattern of patterns) {
        const match = userContent.match(pattern);
        if (match) {
          productName = match[1].trim();
          break;
        }
      }
    }

    if (action === 'add' && productName) {  
      const products = this.inventoryService.searchProducts(productName);
      
      if (products.length > 0) {
        const product = products[0];
        const result = this.cartService.addToCart(product, 1);
        const returnState = {
          messages: [
            ...state.messages,
            { role: 'assistant', content: result.message || '' },
            { role: 'tool', content: JSON.stringify(result) }
          ],
          currentStep: 'ui_generation',
        };
        return returnState;
      } else {
        // Product not found
        return {
          messages: [
            ...state.messages,
            { role: 'assistant', content: `No se encontró el producto "${productName}"` }
          ],
          currentStep: 'ui_generation',
        };
      }
    }

    if (action === 'view') {
      const cart = this.cartService.getCart();
      return {
        messages: [
          ...state.messages,
          { role: 'assistant', content: `Carrito actual: ${cart.itemCount} productos, total: $${cart.total.toFixed(2)}` },
          { role: 'tool', content: JSON.stringify({ success: true, cart }) }
        ],
        currentStep: 'ui_generation',
      };
    }

    if (action === 'remove' && productName) {
      const products = this.inventoryService.searchProducts(productName);
      if (products.length > 0) {
        const removeResult = this.cartService.removeFromCart(products[0].id, 1);
        return {
          messages: [
            ...state.messages,
            { role: 'assistant', content: removeResult.message || '' },
            { role: 'tool', content: JSON.stringify(removeResult) }
          ],
          currentStep: 'ui_generation',
        };
      }
    }

    if (action === 'clear') {
      const clearResult = this.cartService.clearCart();
      return {
        messages: [
          ...state.messages,
          { role: 'assistant', content: clearResult.message || 'Carrito vaciado' },
          { role: 'tool', content: JSON.stringify(clearResult) }
        ],
        currentStep: 'ui_generation',
      };
    }

    // Default case - view cart
    const cart = this.cartService.getCart();
    return {
      messages: [
        ...state.messages,
        { role: 'assistant', content: `Carrito actual: ${cart.itemCount} productos, total: $${cart.total.toFixed(2)}` },
        { role: 'tool', content: JSON.stringify({ success: true, cart }) }
      ],
      currentStep: 'ui_generation',
    };
  }

  private async inventoryToolNode(state: AgentState): Promise<Partial<AgentState>> {
    const userMessage = state.messages.find(msg => msg.role === 'user');
    const userContent = this.normalizeMessageContent(userMessage?.content || '').toLowerCase();
    
    // Check if user is asking about inventory
    const inventoryKeywords = ['producto', 'productos', 'stock', 'inventario', 'catalog', 'muestrame', 'mostrar', 'lista'];
    const isInventoryRequest = inventoryKeywords.some(keyword => userContent.includes(keyword));

    // If not an inventory request, skip processing and preserve existing state
    if (!isInventoryRequest) {
      return {
        messages: state.messages, // Don't spread - preserve the exact state
        currentStep: 'ui_generation',
      };
    }

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

    // Check if there's cart data in messages
    const cartData = state.messages.find((msg) => {
      const content = this.normalizeMessageContent(msg.content);
      
      // Check for tool messages with cart data (primary pattern from cartNode)
      if (msg.role === 'tool' && content.includes('"cart":')) {
        return true;
      }
      
      // Check for success messages with cart data
      if (content.includes('"success":true') && content.includes('"items":')) {
        return true;
      }
      
      // Check for cart data with itemCount
      if (content.includes('"cart":') && content.includes('"itemCount":')) {
        return true;
      }
      
      return false;
    });

    let cartItems: any[] = [];
    if (cartData) {
      try {
        const data = this.normalizeMessageContent(cartData.content);
        const parsed = JSON.parse(data);
        
        // Handle different cart data formats
        if (parsed.cart) {
          cartItems = parsed.cart.items || [];
        } else if (parsed.items) {
          // Direct items array (from some tool responses)
          cartItems = parsed.items;
        } else if (Array.isArray(parsed)) {
          // If the parsed data is directly an array of items
          cartItems = parsed;
        }
      } catch (e) {
        // If parsing fails, we'll have an empty cart
        cartItems = [];
      }
    }

    const systemPrompt = new SystemMessage(
      `Eres un generador de interfaces para un POS siguiendo estrictamente la política de "Zero-Hallucination". 
      Analiza el contexto y genera la interfaz apropiada:

      Componentes permitidos:
      - ProductCatalog: { items: Array<{id: number, name: string, price: number, stock: number}> }
      - ShoppingCart: { items: Array<{id: number, name: string, price: number, quantity: number, subtotal: number}>, total: number, itemCount: number }
      - SimpleMessage: { text: string, type: "info" | "success" | "warning" | "error" }

      ${cartItems.length > 0 
        ? `DATOS DE CARRITO DISPONIBLES: Hay ${cartItems.length} productos en el carrito. Si el usuario pregunta sobre el carrito, usa el componente ShoppingCart.`
        : ''}

      ${inventoryData && inventoryProducts.length > 0 
        ? `DATOS DE INVENTARIO DISPONIBLES: ${this.normalizeMessageContent(inventoryData.content)}. Usa estos datos reales para generar el ProductCatalog.` 
        : 'NO HAY DATOS DE INVENTARIO DISPONIBLES.'}

      REGLAS DE GENERACIÓN:
      - Si el usuario pregunta sobre "carrito", "qué llevo", "total", o similar: usa ShoppingCart
      - Si el usuario pregunta sobre productos o catálogo: usa ProductCatalog
      - Si hay error o mensaje informativo: usa SimpleMessage

      EJEMPLOS DE RESPUESTA VÁLIDA:
      { "component": "ShoppingCart", "props": { "items": [...], "total": 999.99, "itemCount": 3 }, "status": "success" }
      { "component": "ProductCatalog", "props": { "items": [...] }, "status": "success" }
      { "component": "SimpleMessage", "props": { "text": "No hay productos en el carrito", "type": "info" }, "status": "success" }

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

