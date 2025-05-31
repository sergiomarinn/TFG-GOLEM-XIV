'use client';

import { Practice } from '@/types/practice';
import { useState, useEffect, useMemo } from 'react';

// Mock data for events
const mockEvents = [
  { id: '1', title: 'Entrega Práctica 1', time: '10:00', day: 7, type: 'delivery' },
  { id: '2', title: 'Entrega Práctica 2', time: '13:30', day: 5, type: 'delivery' },
  { id: '3', title: 'Entrega Práctica 3', time: '14:15', day: 5, type: 'delivery' },
  { id: '4', title: 'Entrega Práctica 4', time: '16:45', day: 8, type: 'delivery' },
  { id: '5', title: 'Entrega Práctica 5', time: '18:20', day: 10, type: 'delivery' },
];

export const WeekCalendarDemo = ( { practices }: { practices: Practice[] } ) => {
  const events = useMemo(() => {
    return practices.map(practice => {
      const dueDate = new Date(practice.due_date);
      
      return {
        id: practice.id || `practice-${practice.name}`,
        title: practice.name,
        time: `${dueDate.getHours()}:${dueDate.getMinutes() < 10 ? '0' + dueDate.getMinutes() : dueDate.getMinutes()}`,
        day: dueDate.getDate(),
        month: dueDate.getMonth(),
        year: dueDate.getFullYear(),
        description: practice.description,
        status: practice.status || 'not_submitted'
      };
    });
  }, [practices]);

  // Get current date information
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute}`;
  
  // Get current day number and set as default selected
  const currentDate = now.getDate();
  const [selectedDay, setSelectedDay] = useState(currentDate);

	// Reactive time slots centered around current hour
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  
  // Generate time slots based on current hour
  useEffect(() => {
    const generateTimeSlots = () => {
      const slots = [];
      // Show 3 hours before current hour and 3 hours after (7 slots total)
      for (let i = -3; i <= 3; i++) {
        let hour = currentHour + i;
        
        // Handle hour overflow
        if (hour < 0) hour += 24;
        if (hour >= 24) hour -= 24;
        
        slots.push(`${hour}:00`);
      }
      return slots;
    };
    
    setTimeSlots(generateTimeSlots());
    
    // Set up interval to update time slots every minute
    const intervalId = setInterval(() => {
      const newNow = new Date();
      if (newNow.getHours() !== currentHour) {
        setTimeSlots(generateTimeSlots());
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [currentHour]);

  // Days array with Monday to Sunday in Catalan
  const weekDays = ['Dll', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];

	// State for week offset (0 = current week, -1 = previous week, 1 = next week)
	const [weekOffset, setWeekOffset] = useState(0);
  
  // Calculate the start of the current week (Monday)
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // Adjust for Sunday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff + (weekOffset * 7)); // Apply week offset
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        fullDate: new Date(date)
      });
    }
    
    return weekDays;
  };
  
  const daysOfWeek = getWeekDays();

	const getHourFromTimeString = (timeString: string) => {
    return parseInt(timeString.split(':')[0]);
  };

  // Get event status color class
  const getEventColorClass = (status: string) => {
    switch (status) {
      case 'not_submitted':
        return 'bg-red-100 border-red-500 border-[1.5px] text-red-800';
      case 'submitted':
        return 'bg-blue-100 border-blue-500 border-[1.5px] text-blue-800';
      case 'correcting':
        return 'bg-yellow-100 border-yellow-500 border-[1.5px] text-yellow-800';
      case 'corrected':
        return 'bg-green-100 border-green-500 border-[1.5px] text-green-800';
      case 'rejected':
        return 'bg-red-100 border-red-500 border-[1.5px] text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 border-[1.5px] text-gray-800';
    }
  };

  // Filter events for selected day and current week
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Primero verificamos que el evento esté en la semana actual según el offset
      const isInCurrentWeek = daysOfWeek.some(day => 
        day.day === event.day && 
        day.month === event.month && 
        day.year === event.year
      );
      
      // Luego verificamos si el día seleccionado coincide con el día del evento
      const isSelectedDayMatch = event.day === selectedDay;
      
      // También verificamos si el mes y año coinciden para el día seleccionado
      const selectedDayInfo = daysOfWeek.find(day => day.day === selectedDay);
      const isInSelectedMonthYear = selectedDayInfo && 
                                   event.month === selectedDayInfo.month && 
                                   event.year === selectedDayInfo.year;
      
      return isInCurrentWeek && isSelectedDayMatch && isInSelectedMonthYear;
    });
  }, [events, selectedDay, daysOfWeek]);

  // Function to navigate to previous/next week
	const navigateWeek = (direction: number) => {
    setWeekOffset(prev => prev + direction);
    
    // Adjust selected day to be in the visible week
    const newWeekDays = getWeekDays();
    if (!newWeekDays.some(dayInfo => dayInfo.day === selectedDay)) {
      setSelectedDay(newWeekDays[0].day);
    }
  };
  
  // Get current month name in Catalan
  const getMonthNameCatalan = (monthIndex: number) => {
    const monthsCatalan = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 
                           'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
    return monthsCatalan[monthIndex];
  };

	// Determine month and year to display
  // If the week spans multiple months, show the month with more days in the current view
  const getDisplayMonthYear = () => {
    const monthCounts: { [key: string]: number } = {};
    let maxMonth = daysOfWeek[0].month;
    let maxCount = 0;
    let yearToDisplay = daysOfWeek[0].year;
    
    daysOfWeek.forEach(dayInfo => {
      const month = dayInfo.month;
      monthCounts[month] = (monthCounts[month] || 0) + 1;
      
      if (monthCounts[month] > maxCount) {
        maxCount = monthCounts[month];
        maxMonth = month;
        yearToDisplay = dayInfo.year;
      }
    });
    
    return {
      month: getMonthNameCatalan(maxMonth),
      year: yearToDisplay
    };
  };
  
  const { month: displayMonth, year: displayYear } = getDisplayMonthYear();

	const formatHour = (timeString: string) => {
    const hour = parseInt(timeString.split(':')[0]);
    return `${hour < 10 ? '0' + hour : hour}:00`;
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Calendar Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="inline-block px-5 py-2 rounded-full border dark:border-default bg-white dark:bg-black text-lg text-default-800 font-medium">
				{displayMonth} {displayYear}
        </div>

        <div className="flex space-x-2">
          <button 
						className="p-3 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:bg-gray-50"
						onClick={() => navigateWeek(-1)}
            aria-label="Setmana anterior"
					>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
						className="p-3 rounded-full bg-black text-white shadow-sm hover:bg-gray-800"
						onClick={() => navigateWeek(1)}
            aria-label="Setmana següent"
					>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Days */}
			<div className="bg-white dark:bg-black rounded-3xl border-1.5 dark:border-default">
				<div className="grid grid-cols-7 pt-1.5 pb-1 px-1.5 border-b border-default-200">
					{weekDays.map((day, index) => {
						const dayInfo = daysOfWeek[index];
            const isCurrentDay = dayInfo.day === currentDate && 
                                 dayInfo.month === now.getMonth() && 
                                 dayInfo.year === now.getFullYear();
            const isSelectedDay = dayInfo.day === selectedDay;

            const hasDeliveries = events.some(event => 
              event.day === dayInfo.day && 
              event.month === dayInfo.month && 
              event.year === dayInfo.year
            );
						
						return (
							<div 
								key={`${day}-${index}`}
                role="button"
								className={`p-4 mx-0.5 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-colors ${
									isSelectedDay ? 'bg-default-900 text-default' : 
									isCurrentDay ? 'bg-default-100' : 'hover:bg-default-50'
								}`}
								onClick={() => setSelectedDay(dayInfo.day)}
							>
								<div className={`text-sm ${isSelectedDay ? 'text-default-300' : 'text-default-400'}`}>
									{day}
								</div>
								<div className={`text-2xl font-semibold ${isSelectedDay ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
									{dayInfo.day}
								</div>
                <div className="mt-1 flex gap-1">
                  {isCurrentDay && (
                    <div className="h-1 w-1.5 bg-blue-500 rounded-full"></div>
                  )}
                  {hasDeliveries && (
                    <div className="h-1 w-1.5 bg-red-500 rounded-full"></div>
                  )}
                </div>
							</div>
						);
					})}
				</div>

				{/* Events List */}
				<div className="pl-7 py-2 max-h-[420px] overflow-y-auto">
					{timeSlots.map((time) => {
						const formattedTime = formatHour(time);
						const hourValue = parseInt(time.split(':')[0]);
            
            // Find events that fall within this hour's time slot (HH:00 to HH:59)
            const eventsAtTime = filteredEvents.filter(event => {
              const eventHour = getHourFromTimeString(event.time);
              return eventHour === hourValue;
            });
						
						// Check if this is the current time slot
						const isCurrentTimeSlot = parseInt(time.split(':')[0]) === currentHour;
						
						if (eventsAtTime.length === 0) {
							return (
								<div key={time} className="flex relative py-4">
									<div className={`w-20 ${isCurrentTimeSlot ? 'text-black dark:text-white font-bold' : 'text-default-300'}`}>
										{formattedTime}
									</div>
									<div className="flex-1"></div>
									{isCurrentTimeSlot && (
										<div className="absolute left-16 right-4 h-px bg-red-500 top-1/2 transform -translate-y-1/2"></div>
									)}
								</div>
							);
						}
						
						// Get the color of the first event for the current time line
						let timeLineColor = 'bg-gray-300';
						if (isCurrentTimeSlot && eventsAtTime.length > 0) {
							const eventStatus = eventsAtTime[0].status;
							switch(eventStatus) {
                case 'not_submitted':
                case 'rejected':
                  timeLineColor = 'bg-red-500';
                  break;
                case 'submitted':
                  timeLineColor = 'bg-blue-500';
                  break;
                case 'correcting':
                  timeLineColor = 'bg-yellow-500';
                  break;
                case 'corrected':
                  timeLineColor = 'bg-green-500';
                  break;
                default:
                  timeLineColor = 'bg-gray-500';
                  break;
              }
						}
						
						return (
							<div key={time} className="flex items-center relative py-[7px]">
								<div className={`w-20 ${isCurrentTimeSlot ? 'text-black font-bold' : 'text-default-300'}`}>
									{formattedTime}
								</div>
								<div className="flex-1 flex flex-wrap gap-2">
									{eventsAtTime.map(event => (
										<div 
											key={event.id}
											className={`text-center px-4 py-2 z-10 rounded-xl border ${getEventColorClass(event.status)}`}
											style={{minWidth: '180px'}}
										>
											{event.title} <span className="text-xs ml-1 opacity-70">({event.time})</span>
										</div>
									))}
								</div>
								{isCurrentTimeSlot && (
									<div>
										<div className={`absolute left-16 right-4 rounded-full w-[3px] h-[10px] ${timeLineColor} top-1/2 transform -translate-y-1/2`}></div>
										<div className={`absolute left-16 right-4 h-[1.5px] ${timeLineColor} top-1/2 transform -translate-y-1/2`}></div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
    </div>
  );
}