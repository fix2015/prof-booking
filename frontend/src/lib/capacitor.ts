/**
 * Thin re-export so pages don't depend on @capacitor/core being present at type-check
 * time in environments that never build the native shell.
 */
export { Capacitor } from "@capacitor/core";
