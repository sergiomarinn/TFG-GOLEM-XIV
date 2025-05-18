'use client'

import { useEffect, useState, useRef } from "react";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { User } from "@heroui/user";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon } from "@/components/icons";
import { getUserFromClient } from "@/app/lib/client-session";
import { User as UserType } from '@/app/lib/definitions';
import { NotificationPopover } from "@/components/notification-popover";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [lastScrollY, setLastScrollY] = useState(0);
  const [show, setShow] = useState(true);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Efecto para controlar la visibilidad al hacer scroll
  useEffect(() => {
    // Encontrar el elemento main que es hermano de la navbar
    mainContentRef.current = document.querySelector('div.flex-1.flex.flex-col.min-w-0 > main.overflow-y-auto');
    
    const scrollContainer = mainContentRef.current;
    
    if (!scrollContainer) return;
    
    const controlNavbar = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        // Si se hace scroll hacia abajo y ya se ha pasado la altura de la navbar, la ocultamos
        setShow(false);
      } else {
        // Si se hace scroll hacia arriba, mostramos la navbar
        setShow(true);
      }
      setLastScrollY(currentScrollY);
    };

    scrollContainer.addEventListener('scroll', controlNavbar);
    
    // Limpieza del evento
    return () => {
      scrollContainer.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  // Obtener datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserFromClient();
        if (userData) setUser(userData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  // Toggle para el menú móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const searchInput = (
    <Input
      aria-label="Cerca"
      size="lg"
      variant="bordered"
      placeholder="Cerca..."
      radius="full"
      className="w-full"
      classNames={{
        inputWrapper: [
          "border-1.5 border-default-300",
          "w-full",
          "bg-content1"
        ],
        input: [
          "w-full"
        ],
        base: "w-full"
      }}
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      endContent={
        <div className="flex items-center">
          <label className="sr-only" htmlFor="type">
            Tipus
          </label>
          <select
            className="outline-none border-0 bg-transparent text-default-400 text-small"
            id="type"
            name="type"
          >
            <option>Cursos</option>
            <option>Pràctiques</option>
          </select>
        </div>
      }
    />
  );

  return (
    <>
      <header 
        className={`absolute top-0 left-0 right-0 h-[90px] backdrop-blur-md bg-slate-100/70 dark:bg-neutral-900/70 z-40 transition-transform duration-300 ${
          show ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="h-full px-8 flex items-center justify-between">
          {/* Botón de menú móvil */}
          <button 
            className="sm:hidden p-2" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Tancar menu" : "Obrir menu"}
          >
            {isMenuOpen ? (
              <XMarkIcon className="size-6" />
            ) : (
              <Bars3Icon className="size-6" />
            )}
          </button>

          {/* Área de búsqueda - Desktop */}
          <div className="hidden sm:flex flex-1 max-w-lg">
            {searchInput}
          </div>

          {/* Área de búsqueda - Móvil */}
          <div className="sm:hidden flex-1 mx-2">
            {searchInput}
          </div>

          {/* Iconos y perfil de usuario */}
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <NotificationPopover />
            
            <div className="mx-1 w-[1.5px] h-[50px] bg-default-400/80 rounded-full" />
            
            <User
              avatarProps={{
                showFallback: true,
                name: user?.name?.[0],
                className: "text-lg"
              }}
              isFocusable={true}
              description={user?.email}
              name={`${user?.name || ''} ${user?.surnames || ''}`}
            />
          </div>
        </div>
      </header>

      {/* Menú móvil desplegable */}
      <div 
        className={`absolute top-[105px] left-0 right-0 bg-background z-30 shadow-lg transition-transform duration-300 sm:hidden ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full opacity-0'
        }`}
      >
        <nav className="px-4 py-4">
          <ul className="space-y-4">
            {siteConfig.navMenuItems.map((item, index) => (
              <li key={`${item}-${index}`}>
                <Link
                  color="foreground"
                  href={item.href}
                  size="lg"
                  className="block py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};