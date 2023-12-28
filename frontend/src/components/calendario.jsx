import { Sidebar } from './sidebar'
import { React, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import esLocale from '@fullcalendar/core/locales/es-us';




export const Calendario = () => {

    return (
        <div className='flex bg-zinc-100 h-screen w-full'>
            <Sidebar />

            <div className="flex-1 p-16 ">
                <FullCalendar
                    locale={esLocale}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="100%"
                />
            </div>
        </div>
    );
};