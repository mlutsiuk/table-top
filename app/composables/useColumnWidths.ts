import { computed, onBeforeUnmount, ref } from 'vue'

/**
 * Column widths for a grid whose columns can be dragged.
 *
 * Kept out of the editor component because it is plumbing, not domain: the editor
 * knows what a field is, not how a pointer drag becomes a track size.
 *
 * Widths are held in pixels and turned into a `grid-template-columns` string, so
 * every row lines up with the header without a table element — rows need to hold
 * inputs and buttons, which `<td>` handles poorly.
 */
export function useColumnWidths(initial: number[], minWidth = 72) {
  const widths = ref([...initial])

  const template = computed(() =>
    `${widths.value.map(width => `${width}px`).join(' ')} auto`
  )

  let dragging: { index: number, startX: number, startWidth: number } | null = null

  function onMove(event: PointerEvent) {
    if (!dragging)
      return

    const next = dragging.startWidth + (event.clientX - dragging.startX)
    widths.value[dragging.index] = Math.max(minWidth, next)
  }

  function stop() {
    dragging = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
  }

  /** Called from a handle's `pointerdown`. */
  function startResize(index: number, event: PointerEvent) {
    dragging = { index, startX: event.clientX, startWidth: widths.value[index] ?? minWidth }

    // Listening on the window rather than the handle keeps the drag alive when the
    // pointer outruns a 4px target, which it always does.
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
  }

  onBeforeUnmount(stop)

  return { template, startResize }
}
