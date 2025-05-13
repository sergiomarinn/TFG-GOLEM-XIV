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
    <div className="relative flex h-screen">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="overflow-y-auto flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}