import { Injectable } from '@nestjs/common';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

/**
 * Inventory Service with in-memory persistence
 * Manages product stock for the POS system
 */
@Injectable()
export class InventoryService {
  private inventory: Map<number, Product> = new Map();

  constructor() {
    // Initialize with sample products
    this.initializeInventory();
  }

  private initializeInventory(): void {
    const sampleProducts: Product[] = [
      { id: 1, name: 'Laptop HP Pavilion', price: 899.99, stock: 15 },
      { id: 2, name: 'Mouse Inalámbrico Logitech', price: 29.99, stock: 50 },
      { id: 3, name: 'Teclado Mecánico RGB', price: 79.99, stock: 0 },
      { id: 4, name: 'Monitor 27" 4K', price: 349.99, stock: 8 },
      { id: 5, name: 'Auriculares Bluetooth Sony', price: 149.99, stock: 25 },
      { id: 6, name: 'Cámara Web HD', price: 59.99, stock: 12 },
    ];

    sampleProducts.forEach((product) => {
      this.inventory.set(product.id, product);
    });
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    return Array.from(this.inventory.values());
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Product | undefined {
    return this.inventory.get(id);
  }

  /**
   * Check if product is in stock
   */
  isInStock(id: number): boolean {
    const product = this.inventory.get(id);
    return product ? product.stock > 0 : false;
  }

  /**
   * Get stock count for a product
   */
  getStock(id: number): number {
    const product = this.inventory.get(id);
    return product ? product.stock : 0;
  }

  /**
   * Update stock for a product
   */
  updateStock(id: number, quantity: number): Product | undefined {
    const product = this.inventory.get(id);
    if (!product) return undefined;

    product.stock = Math.max(0, product.stock + quantity);
    this.inventory.set(id, product);
    return product;
  }

  /**
   * Search products by name
   */
  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.inventory.values()).filter((product) =>
      product.name.toLowerCase().includes(lowerQuery)
    );
  }
}
