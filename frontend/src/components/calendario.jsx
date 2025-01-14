import { Sidebar } from './sidebar'
import { React, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import esLocale from '@fullcalendar/core/locales/es-us';
import axios from 'axios'

export const Calendario = () => {
    const [events, setEvents] = useState([])
    const [storedToken, setStoredToken] = useState(localStorage.getItem('token')); 

    useEffect(() => {
        const fetchPracticas = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/cursos/practicas/usuario', {
                    headers: {
                      Authorization: storedToken,
                    },
                  })
                const practicas = response.data
                console.log("Practicas: ", practicas)

                const calendarEvents = practicas.map(practica => ({
                    title: practica.nom, 
                    start: practica.entrega, 
                    url: `/practica`, 
                    description: practica.descripcio 
                }))

                setEvents(calendarEvents)
            } catch (error) {
                console.error('Error al obtenir les pràctiques:', error)
            }
        }

        fetchPracticas()
    }, []) 

    return (
        <div className='flex sticky top-0 bg-zinc-100 h-screen w-full overflow-hidden '>
            <Sidebar />

            <div className="flex-1 p-16 ">
                <FullCalendar
                    locale={esLocale}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    events={events} 
                    height="100%"
                    eventClick={(info) => {
                        window.location.href = info.event.url
                    }}
                />
            </div>
        </div>
    )
};