import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function MobileShell({ children }: Props) {
  return (
    <div className="max-w-[768px] mx-auto min-h-screen bg-ds-bg-secondary relative overflow-x-hidden">
      {children}
    </div>
  );
}
