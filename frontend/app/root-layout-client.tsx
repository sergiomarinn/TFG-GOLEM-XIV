"use client";

import { usePathname } from "next/navigation";
import { SideNav } from "@/components/sidenav";
import { Navbar } from "@/components/navbar";

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  return isAuthPage ? (
    <main className="min-h-screen">{children}</main>
  ) : (
    <div className="flex h-screen">
      <SideNav />
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="overflow-y-auto flex-1 min-w-0 pt-[105px] bg-slate-100 dark:bg-neutral-900">{children}</main>
      </div>
    </div>
  );
}