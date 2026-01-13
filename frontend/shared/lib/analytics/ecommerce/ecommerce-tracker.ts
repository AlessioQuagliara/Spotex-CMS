/**
 * Ecommerce Tracker
 * Enhanced ecommerce tracking per Google Analytics e altri provider
 */

import type {
  EcommerceProduct,
  EcommerceTransaction,
  EcommerceImpression,
  EcommercePromotion,
} from '../types';

export class EcommerceTracker {
  private cart: EcommerceProduct[] = [];
  private impressions: EcommerceImpression[] = [];

  /**
   * Track product impression
   */
  trackImpression(impression: EcommerceImpression): void {
    this.impressions.push(impression);
  }

  /**
   * Track multiple impressions
   */
  trackImpressions(impressions: EcommerceImpression[]): void {
    this.impressions.push(...impressions);
  }

  /**
   * Get all impressions
   */
  getImpressions(): EcommerceImpression[] {
    return [...this.impressions];
  }

  /**
   * Clear impressions
   */
  clearImpressions(): void {
    this.impressions = [];
  }

  /**
   * Track product click
   */
  trackProductClick(product: EcommerceProduct, list?: string): void {
    // Will be handled by analytics manager
  }

  /**
   * Track product detail view
   */
  trackProductDetail(product: EcommerceProduct): void {
    // Will be handled by analytics manager
  }

  /**
   * Add product to cart
   */
  addToCart(product: EcommerceProduct): void {
    const existingIndex = this.cart.findIndex((p) => p.id === product.id);

    if (existingIndex >= 0) {
      // Update quantity
      this.cart[existingIndex].quantity += product.quantity;
    } else {
      // Add new product
      this.cart.push({ ...product });
    }
  }

  /**
   * Remove product from cart
   */
  removeFromCart(productId: string, quantity?: number): EcommerceProduct | null {
    const index = this.cart.findIndex((p) => p.id === productId);

    if (index >= 0) {
      const product = this.cart[index];

      if (quantity && quantity < product.quantity) {
        // Decrease quantity
        product.quantity -= quantity;
        return { ...product, quantity };
      } else {
        // Remove completely
        return this.cart.splice(index, 1)[0];
      }
    }

    return null;
  }

  /**
   * Update cart item quantity
   */
  updateCartQuantity(productId: string, quantity: number): void {
    const product = this.cart.find((p) => p.id === productId);
    if (product) {
      product.quantity = quantity;
    }
  }

  /**
   * Get cart contents
   */
  getCart(): EcommerceProduct[] {
    return [...this.cart];
  }

  /**
   * Get cart total
   */
  getCartTotal(): number {
    return this.cart.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  }

  /**
   * Get cart item count
   */
  getCartItemCount(): number {
    return this.cart.reduce((count, product) => count + product.quantity, 0);
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    this.cart = [];
  }

  /**
   * Track checkout step
   */
  trackCheckoutStep(step: number, option?: string): void {
    // Will be handled by analytics manager
  }

  /**
   * Track purchase
   */
  trackPurchase(
    transactionId: string,
    revenue: number,
    options?: {
      tax?: number;
      shipping?: number;
      coupon?: string;
      currency?: string;
      affiliation?: string;
    }
  ): EcommerceTransaction {
    const transaction: EcommerceTransaction = {
      transactionId,
      revenue,
      items: [...this.cart],
      ...options,
    };

    // Clear cart after purchase
    this.clearCart();

    return transaction;
  }

  /**
   * Track refund
   */
  trackRefund(transactionId: string, items?: EcommerceProduct[]): void {
    // Will be handled by analytics manager
  }

  /**
   * Track promotion impression
   */
  trackPromotionImpression(promotion: EcommercePromotion): void {
    // Will be handled by analytics manager
  }

  /**
   * Track promotion click
   */
  trackPromotionClick(promotion: EcommercePromotion): void {
    // Will be handled by analytics manager
  }

  /**
   * Track add to wishlist
   */
  trackAddToWishlist(product: EcommerceProduct): void {
    // Will be handled by analytics manager
  }

  /**
   * Calculate metrics
   */
  getMetrics() {
    return {
      cartTotal: this.getCartTotal(),
      cartItemCount: this.getCartItemCount(),
      averageOrderValue: this.calculateAverageOrderValue(),
      cartProducts: this.getCart(),
    };
  }

  private calculateAverageOrderValue(): number {
    if (this.cart.length === 0) return 0;
    return this.getCartTotal() / this.cart.length;
  }

  /**
   * Create product from data
   */
  static createProduct(data: {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    category?: string;
    brand?: string;
    variant?: string;
    position?: number;
    list?: string;
    coupon?: string;
  }): EcommerceProduct {
    return {
      quantity: 1,
      ...data,
    };
  }

  /**
   * Create impression from data
   */
  static createImpression(data: {
    id: string;
    name: string;
    list: string;
    position?: number;
    brand?: string;
    category?: string;
    variant?: string;
    price?: number;
  }): EcommerceImpression {
    return data;
  }

  /**
   * Create promotion from data
   */
  static createPromotion(data: {
    id: string;
    name: string;
    creative?: string;
    position?: string;
  }): EcommercePromotion {
    return data;
  }
}

// Export singleton instance
export const ecommerceTracker = new EcommerceTracker();
