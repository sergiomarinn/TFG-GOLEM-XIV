import { Sidebar } from './sidebar'
import axios from 'axios'
import fondo from '../assets/fondo.jpg'
import { React, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom';


export const Practica = () => {

    const [filelist, setFile] = useState([])

    const [isDragOver, setIsDragOver] = useState(false);

    const [info, setInfo] = useState({})


    const onDrop = (e) => {
        e.preventDefault();

        const newFile = e.target.files[0]
        if (newFile) {
            setFile([newFile])
        }
        setIsDragOver(false);
    };

    const onDrop2 = (e) => {
        e.preventDefault();

        const newFile = e.dataTransfer.files[0]
        if (newFile) {

            setFile([newFile])
        }
        setIsDragOver(false);
    }

    const onDragEnter = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = () => {
        setIsDragOver(false);
    };

    const fileRemove = (file) => {
        const updatedList = [...filelist];
        updatedList.splice(filelist.indexOf(file), 1);
        setFile(updatedList);
    }

    const create = e => {
        e.preventDefault()
        const formDataToSend = new FormData();
        formDataToSend.append('id_practica', localStorage.getItem('practica_id'))
        filelist.forEach(files => {
            formDataToSend.append('files', files);

        })
        console.log(formDataToSend)
        axios
            .post('http://127.0.0.1:8000/cursos/upload', formDataToSend, {
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                    
                }
            })
            .catch((error) => {
                console.error('Error al enviar la solicitud:', error);
            });
        setFile([]);

    }

    useEffect(() => {
        axios
            .get('http://127.0.0.1:8000/cursos/practica/' + localStorage.getItem('practica_id'), {
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            })
            .then((response) => {
                setInfo(response.data)

            })
            .catch((error) => {
            });

    }, [])

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
                </div>
                <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse mt-5 ml-5">
                    <li class="inline-flex items-center">
                        <a href="/main" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 ">
                            <svg class="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                            </svg>
                            Inici
                        </a>
                    </li>
                    <li>
                        <div class="flex items-center">
                            <svg class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4" />
                            </svg>
                            <a href="/assignatura" class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 ">{localStorage.getItem("curs_nom")}</a>
                        </div>
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

                    <div class=" text-xl font-light font-sans relative px-7  items-center space-x-3  text-black break-words whitespace-normal">La practica s'ha d'entregar en format zip, la resolucio no es automatica acaba en mes o menys cinc minuts, aixi que torna a aquesta pagina o deixa que acabi i veuras els resultats.</div>
                    <div class=" text-xl font-light font-sans  text-black relative px-7  items-center space-x-3 break-words whitespace-normal pb-3">{info.descripcio}</div>
                </div>

                <div class="w-3/4 relative flex justify-center items-center flex-col  pt-10 mt-5 ml-5 rounded-xl border-slate-600 border-2 border-opacity-25 pb-10">
                    <div
                        className={`border-dashed  w-8/12 lg:w-5/12 border-2 border-sky-300 rounded-md p-6 flex flex-col items-center ${isDragOver ? 'bg-sky-500 border-black' : ''} `}
                        onDrop={onDrop2}
                        onDragOver={onDragEnter}
                        onDragLeave={onDragLeave}
                    >
                        <div className="align-middle justify-items-center p-3 text-black">
                            <img src="" alt="" />
                            <p>Arrossega aqui els fichers o </p>
                        </div>
                        <input className='text-transparent ml-40' type="file" value="" onChange={onDrop} />
                    </div>
                    {
                        filelist.length > 0 ? (
                            <div className="mt-7 w-8/12 lg:w-5/12 ">
                                {
                                    filelist.map((item, index) => (
                                        <div key={index} className="flex flex-auto relative bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 rounded-xl p-4 mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="36" height="36" className='mr-2 fill-gray-700'><path d="M14,7V.46c.91,.35,1.75,.88,2.46,1.59l3.48,3.49c.71,.71,1.24,1.55,1.59,2.46h-6.54c-.55,0-1-.45-1-1Zm8,3.49v8.51c0,2.76-2.24,5-5,5H7c-2.76,0-5-2.24-5-5V5C2,2.24,4.24,0,7,0h4.51c.16,0,.32,.01,.49,.02V7c0,1.65,1.35,3,3,3h6.98c.01,.16,.02,.32,.02,.49Zm-8.7,6.51l1.97-2.36c.35-.42,.3-1.05-.13-1.41-.43-.35-1.05-.3-1.41,.13l-1.73,2.08-1.73-2.08c-.35-.42-.98-.48-1.41-.13-.42,.35-.48,.98-.13,1.41l1.97,2.36-1.97,2.36c-.35,.42-.3,1.05,.13,1.41,.19,.16,.41,.23,.64,.23,.29,0,.57-.12,.77-.36l1.73-2.08,1.73,2.08c.2,.24,.48,.36,.77,.36,.23,0,.45-.08,.64-.23,.42-.35,.48-.98,.13-1.41l-1.97-2.36Z" /></svg>
                                            <div className="flex flex-col  justify-center">
                                                <p className="text-white" >{item.name}</p>
                                            </div>
                                            <span className="bg-sky-500 rounded-full border-sky-900 w-9 h-9 flex align-middle justify-center absolute cursor-pointer text-center  text-2xl right-7" onClick={() => fileRemove(item)}>x</span>
                                        </div>

                                    ))
                                }
                            </div>

                        ) : null
                    }

                    {
                        filelist.length > 0 ? (

                            <button type="submit" onClick={create} variant="outlined" class=" w-2/12 absolute bottom-2 right-2 lg:bottom-5 lg:right-5  focus:ring-4 focus:outline-none text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-sky-500 hover:bg-sky-700 focus:ring-sky-800">Enviar</button>

                        ) : null
                    }
                </div>
            </div>
        </div>
    );
};
