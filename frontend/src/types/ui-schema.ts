export interface UISchema {
  component: string;
  props: Record<string, unknown>;
  status: 'loading' | 'success' | 'error';
}

export interface AgentState {
  messages: Array<{ role: string; content: string }>;
  uiSchema?: UISchema;
  currentStep: string;
}

export interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  stock: number;
}

export interface ProductCatalogProps {
  items: ProductItem[];
}

export interface SimpleMessageProps {
  text: string;
  type: 'info' | 'success' | 'warning';
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ShoppingCartProps {
  items: CartItem[];
  total: number;
  itemCount: number;
}
