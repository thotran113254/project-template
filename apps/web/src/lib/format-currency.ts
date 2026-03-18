/** Format number as Vietnamese Dong currency */
export function fmtVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}
