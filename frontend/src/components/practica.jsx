import { Sidebar } from './sidebar';
import axios from 'axios';
import fondo from '../assets/fondo.jpg';
import { React, useEffect, useState } from 'react';
import { useNotification } from './notificationContext'; // Importamos el hook del contexto
import { useNavigate } from 'react-router-dom';
import { ReactComponent as notificacion } from "../assets/tick.svg";

export const Practica = () => {
    const { newNotification } = useNotification(); // Obtenemos el estado de las notificaciones
    const [filelist, setFile] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [info, setInfo] = useState({});
    const [isCorrected, setIsCorrected] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = (e) => {
        e.preventDefault();
        const newFile = e.target.files[0];
        if (newFile) setFile([newFile]);
        setIsDragOver(false);
    };

    const onDrop2 = (e) => {
        e.preventDefault();
        const newFile = e.dataTransfer.files[0];
        if (newFile) setFile([newFile]);
        setIsDragOver(false);
    };

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
    };

    const create = (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append('id_practica', localStorage.getItem('practica_id'));
        filelist.forEach((files) => {
            formDataToSend.append('files', files);
        });

        axios
            .post('http://127.0.0.1:8000/cursos/upload', formDataToSend, {
                headers: {
                    Authorization: localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data',
                },
            })
            .then(() => {
                setIsProcessing(true);
                setFile([]);
            })
            .catch((error) => {
                console.error('Error al enviar la solicitud:', error);
            });
    };

    useEffect(() => {
        axios
            .get(`http://127.0.0.1:8000/cursos/practica/${localStorage.getItem('practica_id')}`, {
                headers: {
                    Authorization: localStorage.getItem('token'),
                },
            })
            .then((response) => {
                setInfo(response.data);
                setIsCorrected(response.data.corrected);
            })
            .catch((error) => {
                console.error('Error al obtener la práctica:', error);
            });
    }, []);

    useEffect(() => {
        if (newNotification) {
            setIsCorrected(true); 
            setIsProcessing(false);
        }
    }, [newNotification]);

    const handleCloseCorrectedMessage = () => {
        setIsCorrected(false); 
    };

    return (
        <div className="flex bg-zinc-100 h-fit">
            <Sidebar />
            <div className="flex-1">
                <img className="w-full h-32 object-cover md:w-full" src={fondo} alt="" />
                <div className="w-full flex flex-wrap h-16 bg-sky-500">
                    <div className="relative px-7 -top-10 items-center space-x-3">
                        <span className="self-center text-3xl font-semibold whitespace-nowrap text-white">
                            {info.nom}
                        </span>
                    </div>
                </div>

                {isCorrected ? (
                    <div className="flex justify-center items-center mt-24 space-y-6 flex-col">
                        <div className="flex items-center justify-center bg-green-100 p-6 rounded-lg shadow-md space-x-4 transform transition-transform duration-300">
                        <svg
                            className="w-12 h-12 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>

                            <p className="text-xl font-medium text-green-700 text-center">
                                La pràctica ha estat corregida. Si us plau, revisa els resultats.
                            </p>
                        </div>
                        <button
                            onClick={handleCloseCorrectedMessage}
                            className="px-6 py-3 text-white bg-sky-500 hover:bg-sky-700 font-medium rounded-lg shadow-md mt-4 w-full sm:w-auto"
                        >
                            Tancar
                        </button>
                    </div>
                ) : isProcessing ? (
                    <div className="flex justify-center items-center mt-24 space-y-6">
                        <div className="flex items-center justify-center bg-blue-100 p-6 rounded-lg shadow-md space-x-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-12 h-12 text-blue-600 animate-spin"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                    >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray="31.41592653589793"
                                        strokeDashoffset="7.854"
                                    />
                                </svg>
                            <p className="text-xl font-medium text-blue-700 text-center">
                                La pràctica s'està corregint. Si us plau, espera uns minuts.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse mt-5 ml-5">
                            {}
                            {}
                        </ol>
                        <div className="w-3/4 overflow-x-auto pt-4 border-slate-600 border-2 border-opacity-25 mt-5 ml-5 rounded-xl">
                            <div className="text-xl font-light font-sans relative px-7 text-black">
                                La pràctica s'ha d'entregar en format zip, la resolució no és automàtica i acaba en més o menys cinc minuts, així que torna a aquesta pàgina o deixa que acabi i veuràs els resultats.
                            </div>
                            <div className="text-xl font-light font-sans text-black relative px-7 pb-3">{info.descripcio}</div>
                        </div>
                        <div className="w-3/4 relative flex justify-center items-center flex-col pt-10 mt-5 ml-5 rounded-xl border-slate-600 border-2 border-opacity-25 pb-10">
                            <div
                                className={`border-dashed w-8/12 lg:w-5/12 border-2 border-sky-300 rounded-md p-6 flex flex-col items-center ${isDragOver ? 'bg-sky-500 border-black' : ''}`}
                                onDrop={onDrop2}
                                onDragOver={onDragEnter}
                                onDragLeave={onDragLeave}
                            >
                                <div className="align-middle justify-items-center p-3 text-black">
                                    <p>Arrossega aquí els fitxers o </p>
                                </div>
                                <input className="text-transparent ml-40" type="file" value="" onChange={onDrop} />
                            </div>
                            {filelist.length > 0 && (
                                <div className="mt-7 w-8/12 lg:w-5/12">
                                    {filelist.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-auto relative bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 rounded-xl p-4 mb-3"
                                        >
                                            <p className="text-white">{item.name}</p>
                                            <span
                                                className="bg-sky-500 rounded-full w-9 h-9 flex align-middle justify-center absolute cursor-pointer text-center text-2xl right-7"
                                                onClick={() => fileRemove(item)}
                                            >
                                                x
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {filelist.length > 0 && (
                                <button
                                    type="submit"
                                    onClick={create}
                                    className="w-2/12 absolute bottom-2 right-2 lg:bottom-5 lg:right-5 text-white font-medium rounded-lg text-sm px-5 py-2.5 bg-sky-500 hover:bg-sky-700"
                                >
                                    Enviar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
