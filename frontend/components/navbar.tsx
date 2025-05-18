'use client'

import { useEffect, useState, useRef } from "react";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { User } from "@heroui/user";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/chip";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { SearchIcon } from "@/components/icons";
import { getUserFromClient } from "@/app/lib/client-session";
import { User as UserType } from '@/app/lib/definitions';
import { NotificationPopover } from "@/components/notification-popover";
import { Course } from "@/types/course";
import { Practice } from "@/types/practice";
import { searchCourses } from "@/app/actions/course";
import { searchPractices } from "@/app/actions/practice";
import { BookOpenIcon, DocumentIcon } from "@heroicons/react/24/solid";
import { Skeleton } from "@heroui/skeleton";

export const Navbar = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [isLoading, setIsLoading] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [show, setShow] = useState(true);
  const mainContentRef = useRef<HTMLElement | null>(null);
  
  // Estados para la funcionalidad de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Cursos");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    courses: Course[];
    practices: Practice[];
  }>({
    courses: [],
    practices: []
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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
        setIsLoading(true);
        const userData = await getUserFromClient();
        if (userData) setUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);
  
  // Función para manejar la búsqueda
  const handleSearch = async (query: string, type: string) => {
    if (!query.trim()) {
      setSearchResults({ courses: [], practices: [] });
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      // Realizar la búsqueda según el tipo seleccionado
      if (type === "Cursos") {
        const { data: courses } = await searchCourses(query);
        setSearchResults({ courses, practices: [] });
      } else if (type === "Pràctiques") {
        const { data: practices } = await searchPractices(query);
        setSearchResults({ courses: [], practices });
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      setSearchResults({ courses: [], practices: [] });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Función para manejar cambios en el input de búsqueda
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Implementar debounce para evitar múltiples búsquedas
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Si el query está vacío, ocultar resultados
    if (!query.trim()) {
      setShowResults(false);
      setSearchResults({ courses: [], practices: [] });
      return;
    }
    
    // Solo realizar búsqueda si hay al menos 2 caracteres
    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(query, searchType);
      }, 300);
    }
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setSearchType(newType);
    
    // Si ya hay una consulta, buscar inmediatamente con el nuevo tipo
    if (searchQuery.trim().length >= 2) {
      handleSearch(searchQuery, newType);
    }
  };
  
  // Efecto para cerrar el popover al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para navegar a un curso o práctica - CORREGIDA
  const navigateToItem = (item: Course | Practice, type: 'course' | 'practice') => {
    // Primero cerramos el popover
    setShowResults(false);
    setSearchQuery("");
    
    // Después navegamos usando router.push en lugar de redirect
    // Añadimos un pequeño retraso para permitir que la animación termine
    setTimeout(() => {
      router.push(`/${type}s/${item.id}`);
    }, 100);
  };
  
  // Función para manejar el envío del formulario de búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      handleSearch(searchQuery, searchType);
    }
  };

  // Renderiza el elemento de curso en resultados
  const renderCourseItem = (course: Course) => (
    <motion.div 
      key={course.id} 
      className="p-2 cursor-pointer hover:bg-default-100 rounded-lg transition-colors"
      onClick={() => navigateToItem(course, 'course')}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={`size-11 rounded-full p-2 bg-primary-500 flex items-center justify-center text-default-50`}>
          <BookOpenIcon className="size-6"/>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{course.name}</h4>
          <p className="text-xs text-default-500 truncate">{course.description}</p>
          <div className="flex gap-1 mt-1">
            <Chip size="sm" color="primary" variant="flat">{course.academic_year}</Chip>
            <Chip size="sm" color="primary" variant="flat" className="capitalize">{course.semester}</Chip>
          </div>
        </div>
      </div>
    </motion.div>
  );
  
  // Renderiza el elemento de práctica en resultados
  const renderPracticeItem = (practice: Practice) => (
    <motion.div 
      key={practice.id} 
      className="p-2 cursor-pointer hover:bg-default-100 rounded-lg transition-colors"
      onClick={() => navigateToItem(practice, 'practice')}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={`size-11 rounded-full p-2 bg-primary-500 flex items-center justify-center text-default-50`}>
          <DocumentIcon className="size-6"/>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{practice.name}</h4>
          <p className="text-xs text-default-500 truncate">{practice.description}</p>
          <div className="flex gap-1 mt-1">
            <Chip size="sm" variant="flat" color="primary" className="capitalize">{practice.programming_language}</Chip>
            <Chip size="sm" variant="flat" color="primary">{new Date(practice.due_date).toLocaleDateString()}</Chip>
            {practice.status && (
              <Chip 
                size="sm" 
                color={practice.status === 'submitted' ? 'success' : 'warning'} 
                variant="flat"
              >
                {practice.status}
              </Chip>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Toggle para el menú móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const searchInput = (
    <div className="relative w-full">
      <form onSubmit={handleSearchSubmit} className="w-full">
        <Input
          ref={searchInputRef}
          aria-label="Cerca"
          size="lg"
          variant="bordered"
          placeholder="Cerca..."
          radius="full"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) {
              setShowResults(true);
            }
          }}
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
            <div>
              {isSearching ? (
                <div className="size-4 border-1.5 border-t-transparent border-default-400 rounded-full animate-spin"></div>
              ) : 
              <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />}
            </div>
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
                value={searchType}
                onChange={handleSearchTypeChange}
              >
                <option>Cursos</option>
                <option>Pràctiques</option>
              </select>
            </div>
          }
        />
      </form>
      
      {/* Popover de resultados de búsqueda con animación */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            ref={popoverRef}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg shadow-lg bg-background border border-default-200 max-h-80 overflow-y-auto"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="p-2">
              {isSearching ? (
                <div className="flex items-center justify-center p-4">
                  <div className="size-8 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                  <span className="ml-3 text-sm">Cercant...</span>
                </div>
              ) : (
                <>
                  {searchType === "Cursos" && (
                    <>
                      {searchResults.courses.length > 0 ? (
                        <motion.div 
                          className="space-y-2"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                        >
                          <AnimatePresence>
                            {searchResults.courses.map(renderCourseItem)}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="text-center p-4 text-default-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          No s'han trobat cursos per a "{searchQuery}"
                        </motion.div>
                      )}
                    </>
                  )}
                  
                  {searchType === "Pràctiques" && (
                    <>
                      {searchResults.practices.length > 0 ? (
                        <motion.div 
                          className="space-y-2"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                        >
                          <AnimatePresence>
                            {searchResults.practices.map(renderPracticeItem)}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="text-center p-4 text-default-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          No s'han trobat pràctiques per a "{searchQuery}"
                        </motion.div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <motion.header 
        className="absolute top-0 left-0 right-0 h-[90px] backdrop-blur-md bg-slate-100/70 dark:bg-neutral-900/70 z-40"
        animate={{ 
          y: show ? 0 : -100 
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
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
            
            {isLoading ? (
              <div className="flex items-center w-40 gap-2">
                <div>
                  <Skeleton className="size-10 rounded-full" />
                </div>
                <div className="w-full space-y-1">
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </motion.header>

      {/* Menú móvil desplegable con animación */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="absolute top-[105px] left-0 right-0 bg-background z-30 shadow-lg sm:hidden"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="px-4 py-4">
              <ul className="space-y-4">
                {siteConfig.navMenuItems.map((item, index) => (
                  <motion.li 
                    key={`${item}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      color="foreground"
                      href={item.href}
                      size="lg"
                      className="block py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};