import * as React from "react";

type ToastVariant = "default" | "destructive" | "success";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let count = 0;
function genId() {
  return String(++count);
}

type ToastDispatch = React.Dispatch<React.SetStateAction<ToastItem[]>>;
let globalDispatch: ToastDispatch | null = null;

export function setToastDispatch(dispatch: ToastDispatch) {
  globalDispatch = dispatch;
}

export function toast(item: Omit<ToastItem, "id">) {
  if (!globalDispatch) return;
  const id = genId();
  globalDispatch((prev) => [...prev, { id, ...item }]);
  setTimeout(() => {
    globalDispatch?.((prev) => prev.filter((t) => t.id !== id));
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    setToastDispatch(setToasts);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, dismiss };
}
