'use client'

import Link from 'next/link';
import Image from 'next/image';
import LogoUB from "@/public/logo-ub.svg";
import LogoUBExtended from "@/public/logo-ub-extended.svg";
import LogoUBExtendedWhite from "@/public/logo-ub-extended-white.svg";
import { Button } from "@heroui/button";
import { redirect, usePathname } from 'next/navigation';
import clsx from 'clsx';
import { siteConfig } from "@/config/site";
import { ArrowLeftStartOnRectangleIcon, Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { logout } from '@/app/actions/auth';
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from 'next-themes';

export const SideNav = () => {
	const pathname = usePathname()
	const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const { theme } = useTheme();

	useEffect(() => {
    const saved = localStorage.getItem("sidenav-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);
	
	useEffect(() => {
    localStorage.setItem("sidenav-collapsed", String(isCollapsed));
  }, [isCollapsed]);

	return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 220 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden sm:flex flex-col justify-between px-4 py-5 transition-colors duration-300 ease-in-out"
    >
			{/* Toggle button */}
      <button
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        className={clsx(
          "absolute top-8 z-50 border rounded-full p-[0.16rem] active:scale-90 transform transition-all duration-300 ease-in-out",
          "text-primary bg-white hover:bg-default-100",
          "dark:bg-black dark:text-white dark:hover:bg-default-200 dark:border-default-300",
          isCollapsed ? "left-[69px]" : "left-52"
        )}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="size-4 translate-x-[0.8px]" />
        ) : (
          <ChevronLeftIcon className="size-4 -translate-x-[0.8px]" />
        )}
      </button>
			<div className="flex flex-col gap-2">
				<div className="relative h-[51px] mb-10">
					{/* Logo extendido (grande) */}
					<div
						className={clsx(
							"absolute top-0 left-2 origin-left transition-all ease-in-out",
							isCollapsed
								? "scale-x-0 opacity-0 duration-300"
								: "scale-x-100 opacity-100 duration-500"
						)}
					>
						<Image
							src={theme === "dark" ? LogoUBExtendedWhite : LogoUBExtended}
							alt="Logo UB Extended"
							width={160}
							height={32}
							className="block"
						/>
					</div>

					{/* Logo pequeño */}
					<Image
						src={LogoUB}
						alt="Logo UB"
						width={32}
						className={clsx(
							"absolute top-0 left-2 transition-all duration-300 ease-in-out transform",
							isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-90"
						)}
					/>
				</div>

				<span className={clsx(
					"uppercase text-[0.65rem] font-light text-default-500 tracking-wide transition-all duration-200 ease-in-out",
					isCollapsed ? "" : "pl-[1.45rem]")}
				>
					General
				</span>
				<nav className="flex flex-col items-start gap-2">
          {siteConfig.navItems.map(({ href, label, icon: Icon, iconFilled: IconFilled }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const ActiveIcon = isActive ? IconFilled : Icon;

            return (
              <Button
								aria-label={label}
                key={href}
                as={Link}
                href={href}
								isIconOnly={isCollapsed}
								color={isActive ? "primary" : "default"}
                variant={isActive ? "flat" : "light"}
                size="lg"
								radius="lg"
                className={clsx(
									"transition-all duration-300 ease-in-out relative",
									isCollapsed ? "w-12" : "w-full justify-start gap-2",
									isActive ? "text-black dark:text-white font-semibold" : "")}
              >
								<div className="flex items-center absolute">
                  {ActiveIcon && (
                    <ActiveIcon className={clsx(
                      "transition-size duration-400 ease-in-out",
                      isCollapsed ? "size-6 left-2" : "size-[1.25rem] left-7",
                      isActive ? "text-primary" : "")} />
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      key={`label-${label}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="origin-left whitespace-nowrap pl-7"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            );
          })}
        </nav>
			</div>

			{/* Bottom section */}
			<div className="flex flex-col gap-3">
				<span className={clsx(
					"uppercase text-[0.65rem] font-light text-default-500 tracking-wide transition-all duration-200 ease-in-out",
					isCollapsed ? "pl-[0.2rem]" : "pl-[1.45rem]")}
				>
					{ isCollapsed ? "Config" : "Configuracions" }
				</span>
				<div className="pl-1 flex flex-col items-start gap-1">
					<Button
            isIconOnly={isCollapsed}
            radius="lg"
            variant="light"
            startContent={<Cog6ToothIcon className="size-6" />}
            aria-label="Configuració"
          >
            <span className={clsx(
              "origin-left transition-all duration-150 ease-in-out whitespace-nowrap",
              isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
            )}>
              Configuració
            </span>
          </Button>
          <Button
            isIconOnly={isCollapsed}
            radius="lg"
            color="danger"
            variant="light"
            startContent={<ArrowLeftStartOnRectangleIcon className="size-6" />}
            aria-label="Tancar sessió"
            onPress={async () => {await logout(); redirect('/login');}}
          >
						<span className={clsx(
              "origin-left transition-all duration-150 ease-in-out whitespace-nowrap",
              isCollapsed ? "opacity-0 w-0 scale-0" : "opacity-100 w-auto scale-100"
            )}>
              Tancar sessió
            </span>
          </Button>
				</div>
			</div>
		</motion.aside>
	);
};