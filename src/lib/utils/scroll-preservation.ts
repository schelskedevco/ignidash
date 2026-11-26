/**
 * Keeps the page from jumping when an update swaps in content of a different height
 * (switching result categories or tables, drilling into a seed, etc.).
 */
import { flushSync } from 'react-dom';

/**
 * Wraps a handler so the scroll position is the same before and after its state update.
 * Not a hook: call it inline, e.g. `onClick={withScrollPreservation(() => setTab(tab))}`.
 */
export function withScrollPreservation<TArgs extends unknown[]>(fn: (...args: TArgs) => void): (...args: TArgs) => void {
  return (...args) => {
    // MainArea's <main> scrolls the page at wide breakpoints; below them the window scrolls.
    const container = document.querySelector<HTMLElement>('[data-scroll-container]');
    const windowTop = window.scrollY;
    const containerTop = container?.scrollTop ?? 0;

    // Drop focus left behind by a mouse or touch click so the browser doesn't scroll back to it.
    // Keyboard focus (:focus-visible) is kept so keyboard and screen-reader users don't lose their place.
    const active = document.activeElement;
    if (active instanceof HTMLElement && !active.matches(':focus-visible')) active.blur();

    // Commit the DOM synchronously so the old position can be restored before the next paint.
    flushSync(() => fn(...args));

    // Restore both; whichever isn't scrolling at the current breakpoint is at 0 and stays there.
    // 'instant' overrides the global `scroll-behavior: smooth`.
    window.scrollTo({ top: windowTop, behavior: 'instant' });
    container?.scrollTo({ top: containerTop, behavior: 'instant' });
  };
}
