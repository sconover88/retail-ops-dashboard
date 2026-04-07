import type { Sale } from "@/lib/types/database";

/**
 * Calculate total revenue from an array of sales
 */
export function calculateTotalRevenue(sales: Sale[]): number {
  return sales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
}

/**
 * Calculate average order value from an array of sales
 */
export function calculateAverageOrderValue(sales: Sale[]): number {
  if (sales.length === 0) return 0;
  return calculateTotalRevenue(sales) / sales.length;
}

/**
 * Calculate revenue change percentage between two periods
 */
export function calculateRevenueChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate inventory turnover rate
 * turnover = cost of goods sold / average inventory value
 */
export function calculateInventoryTurnover(
  totalSalesValue: number,
  averageInventoryValue: number
): number {
  if (averageInventoryValue === 0) return 0;
  return totalSalesValue / averageInventoryValue;
}

/**
 * Determine stock status based on quantity and reorder point
 */
export function getStockStatus(
  quantity: number,
  reorderPoint: number
): "in-stock" | "low-stock" | "out-of-stock" {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= reorderPoint) return "low-stock";
  return "in-stock";
}
