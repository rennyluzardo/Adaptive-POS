import { Injectable } from '@nestjs/common';
import { Product } from '../inventory/inventory.service';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartAction {
  type: 'add' | 'remove' | 'clear';
  productId?: number;
  quantity?: number;
}

/**
 * Cart Service for managing temporary shopping cart state
 * Handles cart operations with stock validation
 */
@Injectable()
export class CartService {
  private cart: CartState = {
    items: [],
    total: 0,
    itemCount: 0,
  };

  /**
   * Get current cart state
   */
  getCart(): CartState {
    return { ...this.cart };
  }

  /**
   * Add product to cart with stock validation
   */
  addToCart(product: Product, quantity: number = 1): { success: boolean; message?: string; cart?: CartState } {
    if (product.stock <= 0) {
      return {
        success: false,
        message: `No hay stock disponible para ${product.name}`,
      };
    }

    if (quantity > product.stock) {
      return {
        success: false,
        message: `Stock insuficiente. Solo hay ${product.stock} unidades disponibles de ${product.name}`,
      };
    }

    const existingItemIndex = this.cart.items.findIndex(item => item.id === product.id);

    if (existingItemIndex >= 0) {
      const existingItem = this.cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return {
          success: false,
          message: `No puedes agregar más de ${product.stock} unidades de ${product.name}`,
        };
      }

      this.cart.items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        subtotal: newQuantity * product.price,
      };
    } else {
      this.cart.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        subtotal: quantity * product.price,
      });
    }

    this.recalculateTotals();

    return {
      success: true,
      message: `${quantity} ${product.name}(s) agregado(s) al carrito`,
      cart: this.getCart(),
    };
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: number, quantity: number = 1): { success: boolean; message?: string; cart?: CartState } {
    const itemIndex = this.cart.items.findIndex(item => item.id === productId);

    if (itemIndex === -1) {
      return {
        success: false,
        message: 'El producto no está en el carrito',
      };
    }

    const item = this.cart.items[itemIndex];

    if (quantity >= item.quantity) {
      this.cart.items.splice(itemIndex, 1);
    } else {
      this.cart.items[itemIndex] = {
        ...item,
        quantity: item.quantity - quantity,
        subtotal: (item.quantity - quantity) * item.price,
      };
    }

    this.recalculateTotals();

    return {
      success: true,
      message: `${quantity} unidad(es) eliminada(s) del carrito`,
      cart: this.getCart(),
    };
  }

  /**
   * Clear entire cart
   */
  clearCart(): { success: boolean; message: string; cart: CartState } {
    this.cart = {
      items: [],
      total: 0,
      itemCount: 0,
    };

    return {
      success: true,
      message: 'Carrito vaciado correctamente',
      cart: this.getCart(),
    };
  }

  /**
   * Recalculate cart totals
   */
  private recalculateTotals(): void {
    this.cart.total = this.cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.cart.itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    return this.cart.itemCount;
  }

  /**
   * Get cart total
   */
  getTotal(): number {
    return this.cart.total;
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this.cart.items.length === 0;
  }
}
