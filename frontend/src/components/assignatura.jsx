import { Sidebar } from './sidebar'
import { Modal2 } from './modal2'
import axios from 'axios'
import fondo from '../assets/fondo.jpg'
import { React, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom';



export const Assignatura = () => {

    const [modalOpen, setModalOpen] = useState(false);
    const [cartas, setCartas] = useState([]);


    const Carta = ({ carta }) => (
        <div
            className="block relative rounded-xl hover:cursor-pointer bg-slate-800 h-52 col-span-1" onClick={(e) => goToPractica(carta, e)} >
            <a>
                <img
                    className="h-1/3 w-full rounded-t-xl object-cover md:w-full"
                    src={fondo}

                    alt="" />
            </a>
            <div className="p-6 ">
                <div className='grid grid-cols-1 md:grid-cols-3 ' >
                    <h5
                        className="mb-2 flex text-xl truncate col-span-2 font-medium leading-tight text-neutral-800 dark:text-neutral-50">
                        {carta.nom} 
                    </h5>
                    <h5 className="mb-2 md:right-0 flex text-xl col-span-1 justify-end font-medium leading-tight text-neutral-800 dark:text-neutral-50">
                        {carta.idiomaP} 
                    </h5>
                </div>
                
            </div>
        </div>

    );

    const goToPractica = (carta, e) => {
        e.preventDefault()
        localStorage.setItem("practica_id", carta.id)
        console.log(localStorage)
    }

    useEffect(() => {
        axios
            .get('http://127.0.0.1:8000/cursos/curs/' + localStorage.getItem('curs_id'), {
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            })
            .then((response) => {
                setCartas(response.data)

            })
            .catch((error) => {
                setCartas([])
            });
    }, [modalOpen])
    return (
        <div className='flex bg-zinc-100 h-auto'>
            <Sidebar />

            <div className="flex-1">
                <img
                    className=" w-full h-32 object-cover md:w-full"
                    src={fondo}
                    alt="" />
                <div class="w-full flex flex-wrap  h-16 bg-sky-500">
                    <div class="relative px-7 -top-10 items-center space-x-3">
                        <span class="self-center text-3xl font-semibold whitespace-nowrap text-white">Programacio 2</span>
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-24 sm:p-12 md:w-6/6 items-center">

                    <div className="md:w-4/6 md:ml-28">

                        <div className='grid grid-cols-1 xl:gap-x-0 gap-y-10 '>
                            {cartas.map((carta, index) => (
                                <Carta key={index} carta={carta} />
                            ))}
                        </div>
                    </div>

                </div>


            </div>

            <div class="group fixed bottom-5 right-5 p-2  flex items-end justify-end w-24 ">

                <div class="text-white shadow-xl flex items-center justify-center p-3 rounded-full bg-sky-500 z-50 absolute scale-125 md:scale-150"
                    onClick={() => {
                        setModalOpen(true);
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 group-hover:rotate-90  transition-all duration-[0.6s]">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            {modalOpen && <Modal2 setOpenModal={setModalOpen} />}
        </div>
    );
};