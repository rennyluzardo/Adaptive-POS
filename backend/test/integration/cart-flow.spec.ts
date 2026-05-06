import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../src/infrastructure/inventory/inventory.service';
import { CartService } from '../../src/infrastructure/cart/cart.service';

describe('Cart Flow Integration Test', () => {
  let inventoryService: InventoryService;
  let cartService: CartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryService, CartService],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);
    cartService = module.get<CartService>(CartService);
  });

  describe('Complete cart flow simulation', () => {
    it('should handle adding Mouse and Laptop to cart with correct totals', () => {
      // Get Mouse product (stock: 50, price: 29.99)
      const mouseProduct = inventoryService.searchProducts('Mouse Inalámbrico Logitech')[0];
      expect(mouseProduct.name).toBe('Mouse Inalámbrico Logitech');
      expect(mouseProduct.price).toBe(29.99);
      expect(mouseProduct.stock).toBe(50);

      // Get Laptop product (stock: 15, price: 899.99)
      const laptopProduct = inventoryService.searchProducts('Laptop HP Pavilion')[0];
      expect(laptopProduct.name).toBe('Laptop HP Pavilion');
      expect(laptopProduct.price).toBe(899.99);
      expect(laptopProduct.stock).toBe(15);

      // Add Mouse to cart
      const mouseResult = cartService.addToCart(mouseProduct, 1);
      expect(mouseResult.success).toBe(true);
      expect(mouseResult.message).toContain('agregado(s) al carrito');

      // Add Laptop to cart
      const laptopResult = cartService.addToCart(laptopProduct, 1);
      expect(laptopResult.success).toBe(true);
      expect(laptopResult.message).toContain('agregado(s) al carrito');

      // Verify cart state
      const cart = cartService.getCart();
      expect(cart.items).toHaveLength(2);
      expect(cart.total).toBe(929.98); // 29.99 + 899.99
      expect(cart.itemCount).toBe(2);

      // Verify specific items are in cart
      const mouseItem = cart.items.find(item => item.name.includes('Mouse'));
      const laptopItem = cart.items.find(item => item.name.includes('Laptop'));

      expect(mouseItem).toBeDefined();
      expect(mouseItem?.price).toBe(29.99);
      expect(mouseItem?.quantity).toBe(1);
      expect(mouseItem?.subtotal).toBe(29.99);

      expect(laptopItem).toBeDefined();
      expect(laptopItem?.price).toBe(899.99);
      expect(laptopItem?.quantity).toBe(1);
      expect(laptopItem?.subtotal).toBe(899.99);
    });

    it('should handle stock validation during cart operations', () => {
      // Get Teclado Mecánico RGB which has stock: 0
      const keyboardProduct = inventoryService.searchProducts('Teclado Mecánico RGB')[0];
      expect(keyboardProduct.stock).toBe(0);

      // Try to add out-of-stock item
      const result = cartService.addToCart(keyboardProduct, 1);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No hay stock disponible');

      // Verify cart remains empty
      const cart = cartService.getCart();
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('should handle multiple quantities and stock limits', () => {
      // Get Monitor 27" 4K which has stock: 8
      const monitorProduct = inventoryService.searchProducts('Monitor 27" 4K')[0];
      expect(monitorProduct.stock).toBe(8);

      // Add 3 monitors
      const result1 = cartService.addToCart(monitorProduct, 3);
      expect(result1.success).toBe(true);

      // Try to add 6 more (would exceed stock of 8)
      const result2 = cartService.addToCart(monitorProduct, 6);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('No puedes agregar más de 8 unidades');

      // Verify cart has only 3 units
      const cart = cartService.getCart();
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].subtotal).toBe(1049.97); // 3 * 349.99
    });
  });

  describe('Cart state management', () => {
    it('should maintain cart state across operations', () => {
      // Add multiple items
      const mouse = inventoryService.searchProducts('Mouse')[0];
      const laptop = inventoryService.searchProducts('Laptop')[0];
      const headphones = inventoryService.searchProducts('Auriculares')[0];

      cartService.addToCart(mouse, 2);
      cartService.addToCart(laptop, 1);
      cartService.addToCart(headphones, 3);

      let cart = cartService.getCart();
      expect(cart.items).toHaveLength(3);
      expect(cart.itemCount).toBe(6);
      expect(cart.total).toBe(1449.94); // (2*29.99) + 899.99 + (3*149.99)

      // Remove some quantity
      cartService.removeFromCart(mouse.id, 1);
      cart = cartService.getCart();
      expect(cart.items).toHaveLength(3);
      expect(cart.itemCount).toBe(5);
      expect(cart.total).toBe(1419.95); // 1419.95 - 29.99

      // Remove entire item
      cartService.removeFromCart(headphones.id, 3);
      cart = cartService.getCart();
      expect(cart.items).toHaveLength(2);
      expect(cart.itemCount).toBe(2);
      expect(cart.total).toBe(959.97); // 1419.95 - (3*149.99)

      // Clear cart
      const clearResult = cartService.clearCart();
      expect(clearResult.success).toBe(true);
      cart = cartService.getCart();
      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
      expect(cart.itemCount).toBe(0);
    });
  });
});
