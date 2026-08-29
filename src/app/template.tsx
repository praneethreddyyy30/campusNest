"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className={`animate-page-fade ${isHome ? "" : "pt-20 md:pt-24"}`}>
      {children}
    </div>
  );
}
