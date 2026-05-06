import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../src/infrastructure/cart/cart.service';
import { InventoryService } from '../src/infrastructure/inventory/inventory.service';

describe('CartService - Stock Validation', () => {
  let cartService: CartService;
  let inventoryService: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, InventoryService],
    }).compile();

    cartService = module.get<CartService>(CartService);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('addToCart with stock validation', () => {
    it('should reject adding product with zero stock', () => {
      // Get the Teclado Mecánico RGB which has stock: 0
      const product = inventoryService.searchProducts('Teclado Mecánico RGB')[0];
      
      expect(product.stock).toBe(0);
      
      const result = cartService.addToCart(product, 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No hay stock disponible');
      expect(cartService.getCart().items).toHaveLength(0);
    });

    it('should reject adding more quantity than available stock', () => {
      // Get the Laptop HP Pavilion which has stock: 15
      const product = inventoryService.searchProducts('Laptop HP Pavilion')[0];
      
      expect(product.stock).toBe(15);
      
      const result = cartService.addToCart(product, 20); // More than available
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Stock insuficiente');
      expect(cartService.getCart().items).toHaveLength(0);
    });

    it('should allow adding product with sufficient stock', () => {
      // Get the Mouse Inalámbrico Logitech which has stock: 50
      const product = inventoryService.searchProducts('Mouse Inalámbrico Logitech')[0];
      
      expect(product.stock).toBe(50);
      
      const result = cartService.addToCart(product, 1);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('agregado(s) al carrito');
      expect(cartService.getCart().items).toHaveLength(1);
      expect(cartService.getCart().items[0].quantity).toBe(1);
    });

    it('should reject adding to existing item if it exceeds stock', () => {
      // Get the Monitor 27" 4K which has stock: 8
      const product = inventoryService.searchProducts('Monitor 27" 4K')[0];
      
      expect(product.stock).toBe(8);
      
      // Add 5 units first
      const firstResult = cartService.addToCart(product, 5);
      expect(firstResult.success).toBe(true);
      
      // Try to add 5 more (would exceed stock of 8)
      const secondResult = cartService.addToCart(product, 5);
      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toContain('No puedes agregar más de 8 unidades');
      
      // Verify cart still has only 5 units
      expect(cartService.getCart().items).toHaveLength(1);
      expect(cartService.getCart().items[0].quantity).toBe(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero quantity request', () => {
      const product = inventoryService.searchProducts('Laptop HP Pavilion')[0];
      
      const result = cartService.addToCart(product, 0);
      
      expect(result.success).toBe(true);
      expect(cartService.getCart().items).toHaveLength(0); // Should not add zero quantity
    });

    it('should handle negative quantity request', () => {
      const product = inventoryService.searchProducts('Laptop HP Pavilion')[0];
      
      const result = cartService.addToCart(product, -1);
      
      expect(result.success).toBe(true);
      expect(cartService.getCart().items).toHaveLength(0); // Should not add negative quantity
    });
  });
});
