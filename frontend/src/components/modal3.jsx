import axios from 'axios'
import { React, useState } from 'react'
import { Button, Dropdown } from 'flowbite-react';
import { ReactComponent as excel } from '../assets/archivo-excel.svg'


export const Modal3 = ({ setOpenModal }) => {

    const [formData, setFormData] = useState({
        niub: '',
        
    });

    const { nom, descripcio } = formData;

    const create = e => {
        e.preventDefault()
        const formDataToSend = new FormData();
        formDataToSend.append('niub', formData.niub);
        axios
            .post('http://127.0.0.1:8000/users/profesor', formDataToSend, {
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                    
                }
            })
            .then((response) => {
                console.log("correcte")

            })
            .catch((error) => {
                console.error('Error al enviar la solicitud:', error);
            });

    }

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    return (
        <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black bg-opacity-50 backdrop-blur-sm"
        >
            <div class="w-auto bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-slate-800 dark:border-gray-700">
                <div class="p-8 space-y-4 md:space-y-6 sm:p-8 grid grid-cols-2 gap-x-4 gap-y-2 ">
                    <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white col-span-2">
                        Donar rol Profesor
                    </h1>
                    <div class="col-span-2">
                        <label for="niub" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Niub Profesor</label>
                        <input variant="standard" type="email" value={nom} name='niub' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required></input>
                    </div>
                    <button
                        className="col-start-2 bg-sky-500 text-white active:bg-sky-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={create}
                    >
                        Guardar
                    </button>
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-sky-500 rounded-b">
                    <button
                        className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => setOpenModal(false)}
                    >
                        Tancar
                    </button>
                </div>
            </div>
        </div>
    );
}
