import axios from 'axios'
import { React, useState } from 'react'

import {useNavigate } from 'react-router-dom';

export const Modal = ({ setOpenModal }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre: '',
        apellidos: '',
        niub: '',
        password2: ''
    });
    const { email, password, apellidos, nombre, niub, password2 } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    return (
        <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black bg-opacity-50 backdrop-blur-sm"
        >
            <div class="w-auto bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-slate-800 dark:border-gray-700">
                <div class="p-8 space-y-4 md:space-y-6 sm:p-8 grid grid-cols-2 gap-x-4 gap-y-2">
                    <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white col-span-2 md:col-span-2 xl:col-span-2">
                        Registro
                    </h1>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="niub" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">NIUB</label>
                            <input type="email" value={niub} name='niub' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="NIUB999999999" required></input>
                            <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400">El niub esta al carnet de estudiant, si no el tens.<a href="http://www.ub.edu/carnet/ca/alumnat.html" class="font-medium text-blue-600 hover:underline dark:text-blue-500"> Fés click aqui</a>.</p>
                        </div>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
                            <input type="email" value={nombre} name='nombre' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Albert" required></input>
                        </div >
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="apellido" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Apellidos</label>
                            <input type="email" value={apellidos} name='apellidos' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Roca Perez" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                            <input type="email" value={email} name='email' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-2 xl:col-span-2">
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                            <input type="password" value={password} name='password' onChange={e => onChange(e)} placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-2 xl:col-span-2">
                            <label for="password2" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirmación</label>
                            <input type="password" value={password2} onChange={e => onChange(e)} name='password2' placeholder="Vuelve a escribir la contraseña" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 " ></input>
                        </div>
                        
                    {/*footer*/}
                    
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-sky-500 rounded-b">
                        <button
                            className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                            onClick={() => setOpenModal(false)}
                        >
                            Close
                        </button>
                        <button
                            className="bg-sky-500 text-white active:bg-sky-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            type="button"
                            onClick={() => setOpenModal(false)}
                        >
                            Save Changes
                        </button>
                    </div>
            </div>
        </div>
    );
}
