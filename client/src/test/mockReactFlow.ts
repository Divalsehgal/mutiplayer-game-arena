/**
 * jsdom lacks the layout APIs React Flow measures nodes with. Call once per
 * test file (e.g. in `beforeAll`) before rendering a <ReactFlow>.
 * Based on https://reactflow.dev/learn/advanced-use/testing
 */
export function mockReactFlow() {
  class ResizeObserver {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      const { offsetWidth: width, offsetHeight: height } = target as HTMLElement;
      const entry = { target, contentRect: { width, height } } as ResizeObserverEntry;
      this.callback([entry], this as unknown as globalThis.ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }

  class DOMMatrixReadOnly {
    m22: number;
    constructor(transform?: string) {
      const scale = transform?.match(/scale\(([\d.]+)\)/)?.[1];
      this.m22 = scale !== undefined ? Number(scale) : 1;
    }
  }

  globalThis.ResizeObserver = ResizeObserver as unknown as typeof globalThis.ResizeObserver;
  (globalThis as unknown as { DOMMatrixReadOnly: unknown }).DOMMatrixReadOnly = DOMMatrixReadOnly;

  Object.defineProperties(HTMLElement.prototype, {
    offsetHeight: {
      configurable: true,
      get() {
        return parseFloat(this.style.height) || 1;
      },
    },
    offsetWidth: {
      configurable: true,
      get() {
        return parseFloat(this.style.width) || 1;
      },
    },
  });

  (SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () =>
    ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect;
}
