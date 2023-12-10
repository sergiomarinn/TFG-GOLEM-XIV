import { Sidebar } from './sidebar'
import {Modal } from './modal'
import axios from 'axios'
import { React, useState } from 'react'

import {useNavigate } from 'react-router-dom';



export const Main = () => {

    const [modalOpen, setModalOpen] = useState(false);

    const Carta = ({ carta }) => (
        <div
            className="block rounded-lg  bg-slate-800 h-auto max-w-sm " >
            <a href="#!">
                <img
                    className="h-1/3 w-full rounded-xl object-cover md:h-1/3 md:w-full"
                    src="https://tecdn.b-cdn.net/img/new/standard/nature/184.jpg"
                    alt="" />
            </a>
            <div className="p-6 h-fit">
                <h5
                    className="mb-2  text-xl font-medium leading-tight text-neutral-800 dark:text-neutral-50">
                    Card title
                </h5>
                <p className="mb-4 text-base text-neutral-600 dark:text-neutral-200">
                    Some quick example text to build on the card title and make up the
                    bulk of the card's content.
                </p>
            </div>
        </div>

    );



    const cartas = [
        { titulo: 'Carta 1', contenido: 'Contenido de la carta 1' },
        { titulo: 'Carta 2', contenido: 'Contenido de la carta 2' },
        { titulo: 'Carta 3', contenido: 'Contenido de la carta 3' },
        { titulo: 'Carta 3', contenido: 'Contenido de la carta 3' },
        { titulo: 'Carta 3', contenido: 'Contenido de la carta 3' },
        { titulo: 'Carta 3', contenido: 'Contenido de la carta 3' },
        { titulo: 'Carta 3', contenido: 'Contenido de la carta 3' }
    ];


    return (
        <div className='flex bg-zinc-100'>
            <Sidebar />
            <div className="flex-1 p-8 md:p-24 sm:p-12">

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {cartas.map((carta, index) => (
                        <Carta key={index} carta={carta} />
                    ))}
                </div>

            </div>
            <div class="group fixed bottom-5 right-5 p-2  flex items-end justify-end w-24 h-24 ">

                <div class="text-white shadow-xl flex items-center justify-center p-3 rounded-full bg-sky-500 z-50 absolute scale-125 md:scale-150" 
                 onClick={() => {
                    setModalOpen(true);
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 group-hover:rotate-90  transition-all duration-[0.6s]">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            {modalOpen && <Modal setOpenModal={setModalOpen} />}
        </div>
    );
};