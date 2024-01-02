import { Sidebar } from './sidebar'
import { Modal2 } from './modal2'
import axios from 'axios'
import fondo from '../assets/fondo.jpg'
import { React, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom';



export const Assignatura = () => {

    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false);
    const [cartas, setCartas] = useState([]);
    const [info, setInfo] = useState({});


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
                        className="mb-2 flex text-xl truncate col-span-2 font-medium leading-tight text-neutral-50">
                        {carta.nom}
                    </h5>
                    <h5 className="mb-2 md:right-0 flex text-xl col-span-1 justify-end font-medium leading-tight text-neutral-50">
                        {carta.idiomaP}
                    </h5>
                </div>

            </div>
        </div>

    );

    const goToPractica = (carta, e) => {
        e.preventDefault()
        localStorage.setItem("practica_id", carta.id)
        localStorage.setItem("curs_nom", info.nom)
        navigate("/practica")
    }

    useEffect(() => {
        axios
            .get('http://127.0.0.1:8000/cursos/curs/practicas/' + localStorage.getItem('curs_id'), {
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

        axios
            .get('http://127.0.0.1:8000/cursos/curs/' + localStorage.getItem('curs_id'), {
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            })
            .then((response) => {
                setInfo(response.data)

            })
            .catch((error) => {
            });

    }, [modalOpen])
    return (
        <div className='flex bg-zinc-100 h-fit'>
            <Sidebar />

            <div className="flex-1">
                <img
                    className=" w-full h-32 object-cover md:w-full"
                    src={fondo}
                    alt="" />
                <div class="w-full flex flex-wrap  h-16 bg-sky-500">
                    <div class="relative px-7 -top-10 items-center space-x-3">
                        <span class="self-center text-3xl font-semibold whitespace-nowrap text-white">{info.nom}</span>
                    </div>
                </div><ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse mt-5 ml-5">
                    <li class="inline-flex items-center">
                        <a href="/main" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 ">
                            <svg class="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                            </svg>
                            Inici
                        </a>
                    </li>
                    <li aria-current="page">
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2">{info.nom}</span>
                        </div>
                    </li>
                </ol>
                <div class="w-3/4 overflow-x-auto pt-4 border-slate-600 border-2 border-opacity-25 mt-5 ml-5 rounded-xl">
                    <div class=" text-xl font-light font-sans  text-black relative px-7  items-center space-x-3 break-words whitespace-normal pb-3">{info.descripcio}</div>
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

            {
                localStorage.getItem('profesor') === "true" &&
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
            }
            {modalOpen && <Modal2 setOpenModal={setModalOpen} />}
        </div>
    );
};