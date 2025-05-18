'use client';

import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { useState, useEffect, useRef } from 'react';
import { practiceStatusOptions } from "@/types";
import { getMyPractices } from "@/app/actions/practice";
import { Practice } from "@/types/practice";
import { Link } from "@heroui/link";

export default function CalendariPage() {
  // Estado para las prácticas
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para la fecha actual
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado para la semana seleccionada
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Estado para el mes y año mostrados
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
  
  // Ref para el contenedor de scroll
  const timeGridRef = useRef(null);
  
  // Estado para la altura disponible
  const [availableHeight, setAvailableHeight] = useState(0);
  
  // Calcular el espacio disponible para el calendario
  useEffect(() => {
    const calculateHeight = () => {
      // Calculamos la altura disponible para el contenido scrolleable
      // Restamos el espacio ocupado por los elementos del encabezado
      const headerHeight = 160; // Altura aproximada del encabezado con margen
      const windowHeight = window.innerHeight;
      const contentHeight = windowHeight - headerHeight;
      setAvailableHeight(Math.max(400, contentHeight)); // Mínimo 400px
    };

    // Calcular al montar y cuando la ventana cambia de tamaño
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);
  
  // Cargar las prácticas al iniciar
  useEffect(() => {
    const loadPractices = async () => {
      try {
        const { data } = await getMyPractices();
        setPractices(data);
      } catch (error) {
        console.error("Error al cargar las prácticas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPractices();
  }, []);
  
  // Actualizar la hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Scroll a la hora actual cuando se carga el componente o cambia la semana
  useEffect(() => {
    if (timeGridRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Solo hacer scroll si la hora actual está en el rango visible (8-18)
      if (currentHour >= 8 && currentHour <= 18) {
        // Calcular la posición aproximada para el scroll
        const hourHeight = 80; // Altura de cada celda de hora
        const scrollPos = (currentHour - 8) * hourHeight - 100; // -100 para mostrar un poco del contexto anterior
        
        // Asegurar que no haga scroll negativo
        const scrollPosition = Math.max(0, scrollPos);
        timeGridRef.current.scrollTop = scrollPosition;
      }
    }
  }, [weekOffset, loading]);
  
  // Nombres de los meses en catalán
  const monthNames = [
    'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'
  ];
  
  // Nombres de los días en catalán
  const dayNames = ['DLL', 'DM', 'DC', 'DJ', 'DV', 'DS', 'DG'];
  
  // Función para obtener los días de la semana actual con el offset aplicado
  const getWeekDays = (offset = weekOffset) => {
    const today = new Date();
    today.setDate(today.getDate() + (offset * 7));
    
    // Obtener el lunes de esta semana
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    const monday = new Date(today);
    monday.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push({
        number: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        fullDate: date
      });
    }
    
    return weekDays;
  };
  
  const weekDays = getWeekDays();
  
  // Actualizar el mes y año mostrados al cargar el componente
  useEffect(() => {
    // Determinar el mes y año predominantes en la semana
    const monthCounts = {};
    let mostFrequentMonth = null;
    let maxCount = 0;
    
    weekDays.forEach(day => {
      const monthKey = `${day.month}-${day.year}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      
      if (monthCounts[monthKey] > maxCount) {
        maxCount = monthCounts[monthKey];
        mostFrequentMonth = { month: day.month, year: day.year };
      }
    });
    
    if (mostFrequentMonth) {
      setDisplayMonth(mostFrequentMonth.month);
      setDisplayYear(mostFrequentMonth.year);
    }
  }, [weekOffset]);
  
  // Función para navegar entre semanas
  const navigateWeek = (direction) => {
    setWeekOffset(prev => prev + direction);
  };
  
  // Función para obtener las horas del día
  const getHours = () => {
    const hours = [];
    // Incluir las 24 horas del día
    for (let i = 0; i < 24; i++) {
      hours.push(`${i}:00`);
    }
    return hours;
  };
  
  const dayHours = getHours();
  
  // Función para obtener las prácticas de un día específico
  const getDayPractices = (day, month, year) => {
    return practices.filter(practice => {
      const dueDate = new Date(practice.due_date);
      return dueDate.getDate() === day && 
             dueDate.getMonth() === month && 
             dueDate.getFullYear() === year;
    });
  };
  
  // Función para obtener prácticas por hora y día
  const getPracticesByHour = (hour, day, month, year) => {
    const hourNum = parseInt(hour.split(':')[0]);
    
    return practices.filter(practice => {
      const dueDate = new Date(practice.due_date);
      return dueDate.getHours() === hourNum && 
             dueDate.getDate() === day && 
             dueDate.getMonth() === month && 
             dueDate.getFullYear() === year;
    });
  };

  // Función para calcular la posición del marcador de hora actual
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Calcular la posición relativa dentro de la celda de hora
    const hourIndex = hour; // Ajuste según la hora de inicio (6:00)
    const minutePercentage = minute / 60;
    
    return {
      top: `calc(${hourIndex * 80}px + ${minutePercentage * 80}px)`, // Posición relativa a la hora
    };
  };
  
  const timePosition = getCurrentTimePosition();
  
  // Función para obtener la hora en formato legible de una fecha
  const getFormattedTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusName = (uid: string) =>
    practiceStatusOptions.find((option) => option.uid === uid)?.name || uid;
  
  // Función para hacer scroll a la hora actual
  const scrollToCurrentTime = () => {
    if (timeGridRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calcular la posición de scroll basada en la hora actual
      const hourHeight = 80;
      const scrollPos = currentHour * hourHeight - 100; // -100 para mostrar contexto
      
      // Asegurar que no se hace scroll negativo
      const scrollPosition = Math.max(0, scrollPos);
      
      // Hacer scroll suave
      timeGridRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Carregant...</div>;
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-1 overflow-hidden flex flex-col">
        <div className="rounded-3xl border-1 border-default-200 bg-content1 px-8 py-7 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center pb-5">
            <h1 className="text-3xl font-semibold">Calendari</h1>
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                radius="full"
                className="bg-default-200/70"
                onPress={scrollToCurrentTime}
              >
                Ara
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">
                  {monthNames[displayMonth]} {displayYear}
                </h2>
                <CalendarDaysIcon className="size-7 -translate-y-[1px]" />
              </div>
            </div>
          </div>

          {/* Cabecera con navegación y días de la semana */}
          <div className="flex border-b border-default-200">
            {/* Espacio vacío alineado con la columna de horas */}
            <div className="w-24 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <Button
                  className="bg-default-100"
                  variant="flat"
                  radius="full"
                  onPress={() => navigateWeek(-1)}
                  isIconOnly
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              </div>
            </div>
            
            {/* Contenedor de navegación y días */}
            <div className="flex-1 relative">
              {/* Días de la semana */}
              <div className="grid grid-cols-7">
                {weekDays.map((dayInfo, index) => {
                  const isToday = dayInfo.number === currentDate.getDate() && 
                                dayInfo.month === currentDate.getMonth() && 
                                dayInfo.year === currentDate.getFullYear();
                  
                  const events = getDayPractices(dayInfo.number, dayInfo.month, dayInfo.year);
                  const hasEvents = events.length > 0;
                  
                  return (
                    <div key={index}>
                      <div className="text-center py-3 px-1">
                        <div className={`text-2xl font-semibold inline-flex justify-center items-center w-10 h-10 rounded-full ${isToday ? 'bg-blue-500 text-white' : ''}`}>
                          {dayInfo.number}
                        </div>
                        <div className="text-xs text-default-400 mb-1">{dayNames[index]}</div>
                        {hasEvents && (
                          <div className="flex justify-center gap-1 mt-1">
                            {events.map((evt, idx) => (
                              <div 
                                key={idx}
                                className={`h-1 w-1 rounded-full ${
                                  evt.status === 'not_submitted' ? 'bg-red-500' :
                                  evt.status === 'submitted' ? 'bg-blue-500' :
                                  evt.status === 'correcting' ? 'bg-yellow-500' :
                                  evt.status === 'corrected' ? 'bg-green-500' :
                                  evt.status === 'rejected' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}
                              ></div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="w-24 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <Button
                  className="bg-default-100"
                  variant="flat"
                  radius="full"
                  onPress={() => navigateWeek(1)}
                  isIconOnly
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Contenedor con scroll para la rejilla de horas y eventos - AHORA USA LA ALTURA DISPONIBLE */}
          <ScrollShadow
            hideScrollBar
            ref={timeGridRef}
          >
            {/* Rejilla principal: Horas y Eventos */}
            <div className="flex min-h-full">
              {/* Columna de horas */}
              <div className="w-24 border-r border-default-200 bg-content1 sticky left-0 z-10">
                {dayHours.map((hour, index) => (
                  <div key={index} className="h-20 flex items-center justify-end pr-5 text-sm text-default-500/80">
                    {hour}
                  </div>
                ))}
              </div>
              
              {/* Columna de eventos */}
              <div className="flex-1 relative">
                {/* Rejilla de días y horas */}
                <div className="grid grid-cols-7">
                  {weekDays.map((dayInfo, dayIndex) => {
                    const isToday = dayInfo.number === currentDate.getDate() && 
                                  dayInfo.month === currentDate.getMonth() && 
                                  dayInfo.year === currentDate.getFullYear();
                    
                    return (
                      <div key={dayIndex} className={`border-r last:border-r-0 border-default-200 ${isToday ? '' : ''}`}>
                        {dayHours.map((hour, hourIndex) => {
                          const isLastHour = hourIndex === dayHours.length - 1;
                          const practices = getPracticesByHour(hour, dayInfo.number, dayInfo.month, dayInfo.year);
                          
                          return (
                            <div key={hourIndex} className={`h-20 relative border-default-100 ${isLastHour ? 'border-b-0' : ''}`}>
                              {practices.map((practice, practiceIndex) => {
                                // Determinar el color basado en el estado
                                let bgColor = 'bg-blue-50';
                                let textColor = 'text-blue-800';
                                let bgColorChip = 'bg-blue-100';
                                let textColorChip = 'text-blue-600';
                                let borderColor = 'border-primary-400';
                                
                                switch (practice.status) {
                                  case 'not_submitted':
                                    bgColor = 'bg-danger-50';
                                    textColor = 'text-danger-800';
                                    bgColorChip = 'bg-danger-100';
                                    textColorChip = 'text-danger-600';
                                    borderColor = 'border-danger-400';
                                    break;
                                  case 'submitted':
                                    bgColor = 'bg-primary-50';
                                    textColor = 'text-primary-800';
                                    bgColorChip = 'bg-primary-100';
                                    textColorChip = 'text-primary-600';
                                    borderColor = 'border-primary-400';
                                    break;
                                  case 'correcting':
                                    bgColor = 'bg-warning-50';
                                    textColor = 'text-warning-800';
                                    bgColorChip = 'bg-warning-100';
                                    textColorChip = 'text-warning-600';
                                    borderColor = 'border-warning-400';
                                    break;
                                  case 'corrected':
                                    bgColor = 'bg-success-50';
                                    textColor = 'text-success-800';
                                    bgColorChip = 'bg-success-100';
                                    textColorChip = 'text-success-600';
                                    borderColor = 'border-success-400';
                                    break;
                                  case 'rejected':
                                    bgColor = 'bg-danger-50';
                                    textColor = 'text-danger-800';
                                    bgColorChip = 'bg-danger-100';
                                    textColorChip = 'text-danger-600';
                                    borderColor = 'border-danger-400';
                                    break;
                                  default:
                                    bgColor = 'bg-default-50';
                                    textColor = 'text-default-800';
                                    bgColorChip = 'bg-default-100';
                                    textColorChip = 'text-default-600';
                                    borderColor = 'border-default-400';
                                }
                                
                                return (
                                  <Popover placement="right-start" key={practiceIndex}>
                                    <PopoverTrigger>
                                      <button 
                                        className={`absolute inset-x-1 top-1 p-3 rounded-xl ${bgColor} ${textColor} active:scale-95 transition-transform text-sm text-left shadow-sm`}
                                      >
                                        <div className="font-semibold line-clamp-2 leading-tight">{practice.name}</div>
                                        <div className="mt-1 text-xs">{getFormattedTime(practice.due_date)}</div>
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                      <div className="p-4">
                                        <div className="flex items-center gap-1 mb-4">
                                          <div className={`border-l-3 h-6 rounded-full ${borderColor}`}></div>
                                          <h3 className="pl-1 font-bold text-xl">{practice.name}</h3>
                                        </div>
                                        
                                        <p className="text-sm text-default-500 mb-1">Descripció</p>
                                        <p className="text-sm mb-2 line-clamp-5">{practice.description}</p>
                                        
                                        <div className="flex gap-2 mb-4">
                                          <div className="flex items-center gap-1 bg-default-100 px-2 py-1 rounded-lg">
                                            <span className="text-xs text-default-600 capitalize">{practice.programming_language}</span>
                                          </div>
                                          <div className={`flex items-center gap-1 ${bgColorChip} px-2 py-1 rounded-lg`}>
                                            <span className={`text-xs ${textColorChip}`}>{getStatusName(practice.status || "not_submitted")}</span>
                                          </div>
                                        </div>
                                        
                                        <p className="text-xs text-default-600 mb-4">
                                          Data límit: {new Date(practice.due_date).toLocaleDateString('ca-ES')}
                                        </p>
                                        
                                        <Button
                                          fullWidth
                                          as={Link}
                                          color="primary"
                                          href={`/practices/${practice.id}`}
                                        >
                                          Anar a la pràctica
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                
                {/* Indicador de hora actual */}
                {timePosition && (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: timePosition.top }}>
                    {weekDays.map((dayInfo, index) => {
                      const isToday = dayInfo.number === currentDate.getDate() && 
                                    dayInfo.month === currentDate.getMonth() && 
                                    dayInfo.year === currentDate.getFullYear();
                      
                      if (!isToday) return null;
                      
                      return (
                        <div 
                          key={`time-indicator-${index}`}
                          className="absolute z-10 pointer-events-none"
                          style={{ 
                            left: `calc(${index * (100/7)}%)`,
                            width: `calc(${100/7}%)`
                          }}
                        >
                          <div className="flex items-center">
                            <div className="bg-red-500 rounded-full w-2 h-2 -ml-[4px]"></div>
                            <div className="border-t border-1 border-red-500 flex-grow"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="w-24 border-l border-default-200" />
            </div>
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
}