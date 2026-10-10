/** On-screen keyboard height from the visual viewport (iOS WKWebView/Safari don't resize the layout viewport). */
export function keyboardInset(layoutHeight: number, visualHeight: number, visualOffsetTop: number): number {
  const inset = layoutHeight - visualHeight - visualOffsetTop;
  // Ignore small differences (browser chrome / rounding); only a real keyboard is reported
  return inset > 80 ? Math.round(inset) : 0;
}
