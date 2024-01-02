import { Sidebar } from './sidebar'
import { Modal } from './modal'
import axios from 'axios'
import fondo from '../assets/fondo.jpg'
import { React, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom';



export const Main = () => {

    const navigate = useNavigate()

    const [modalOpen, setModalOpen] = useState(false);
    const [cartas, setCartas] = useState([]);


    const Carta = ({ carta }) => (
        <div
            className="block rounded-lg hover:cursor-pointer bg-slate-800 h-64 max-w-sm" onClick={(e) => goToCurso(carta, e)} >
            <a>
                <img
                    className="h-1/3 w-full rounded-t-xl object-cover md:h-1/3 md:w-full"
                    src={fondo}
                    alt="" />
            </a>
            <div className="p-6 h-fit">
                <div className='grid grid-cols-1 md:grid-cols-3'>
                    <h5
                        className="mb-2 flex text-xl truncate col-span-2 font-medium leading-tight  text-neutral-50">
                        {carta.nom}
                    </h5>
                    <h5 className="mb-2 md:right-0 flex text-xl col-span-1 justify-end font-medium leading-tight  text-neutral-50">
                        {carta.curs}
                    </h5>
                </div>
            </div>
        </div>

    );

    const goToCurso = (carta, e) => {
        e.preventDefault()
        localStorage.setItem("curs_id", carta.id)
        console.log(localStorage)
        navigate("/assignatura")
    }

    useEffect(() => {
        axios
            .get('http://127.0.0.1:8000/cursos', {
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
            <div className="flex-1 p-8 md:p-24 sm:p-12">

                <div className='grid grid-cols-1 md:grid-cols-3 md:gap-x-4 xl:gap-x-4 gap-y-10'>
                    {cartas.map((carta, index) => (
                        <Carta key={index} carta={carta} />
                    ))}
                </div>

            </div>
            {
                localStorage.getItem('profesor') === "true" &&  (
                
                <div class="group fixed bottom-5 right-5 p-2  flex items-end justify-end w-24 h-24 ">

                    <div class="text-white shadow-xl flex items-center justify-center p-3 rounded-full bg-sky-500 z-50 absolute scale-125 md:scale-150"
                        onClick={() => {
                            setModalOpen(true);
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 group-hover:rotate-90  transition-all duration-[0.6s]">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div> )

            }
            {modalOpen && <Modal setOpenModal={setModalOpen} />}
        </div>
    );
};