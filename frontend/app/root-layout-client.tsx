"use client";

import { usePathname } from "next/navigation";
import { SideNav } from "@/components/sidenav";
import { Navbar } from "@/components/navbar";
import { useEffect, useRef } from "react";
import { PageTransition } from '@/components/page-transition';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);
  
  return isAuthPage ? (
    <main className="min-h-screen">{children}</main>
  ) : (
    <div className="flex h-screen">
      <SideNav />
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main
          ref={mainRef}
          className="overflow-y-auto flex-1 min-w-0 pt-[105px] bg-slate-100 dark:bg-neutral-900"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}