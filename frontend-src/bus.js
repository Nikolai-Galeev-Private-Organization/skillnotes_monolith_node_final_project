import { writable } from "svelte/store";
export const noteUpdates = writable(0);
export function ping() {
  noteUpdates.update((n) => n + 1);
}
