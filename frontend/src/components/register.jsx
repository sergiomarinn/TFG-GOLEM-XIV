import axios from 'axios'
import { React, useState } from 'react'
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css";
import PasswordChecklist from "react-password-checklist"

import { useNavigate } from 'react-router-dom';

export const Register = () => {

    
    const [isValid, setIsValid] = useState(false)
    const navigate = useNavigate()
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

    const handleSubmit = e => {
        e.preventDefault();

        if (isValid) {
            const baseURL = 'http://127.0.0.1:8000/users/'
            axios.post(baseURL, formData)
                .then((response) => {
                    navigate("/")
                }).catch((response) => console.log(response));

        }

    }

    const backToLogin = e => {
        navigate("/")
    }

    return (
        <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
            <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-white">
            </a>
            <div class="w-auto ç rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0 bg-slate-800 border-gray-700">
                <div class="p-8 space-y-4 md:space-y-6 sm:p-8 grid grid-cols-2 gap-x-4 gap-y-2">
                    <h1 class="text-xl font-bold leading-tight tracking-tight  md:text-2xl text-white col-span-2 md:col-span-2 xl:col-span-2">
                        Registre
                    </h1>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="niub" class="block mb-2 text-sm font-medium text-white">NIUB</label>
                            <input type="email" value={niub} name='niub' onChange={e => onChange(e)} class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="NIUB999999999" required></input>
                            <p id="helper-text-explanation" class="mt-2 text-sm  text-gray-400">El niub està al carnet d'estudiant, si no en tens.<a href="http://www.ub.edu/carnet/ca/alumnat.html" class="font-medium  hover:underline text-blue-500"> Fes click aquí.</a></p>
                        </div>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="name" class="block mb-2 text-sm font-medium text-white">Nom</label>
                            <input type="email" value={nombre} name='nombre' onChange={e => onChange(e)} class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Albert" required></input>
                        </div >
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="apellido" class="block mb-2 text-sm font-medium text-white">Cognoms</label>
                            <input type="email" value={apellidos} name='apellidos' onChange={e => onChange(e)} class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Roca Perez" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-1 xl:col-span-1">
                            <label for="email" class="block mb-2 text-sm font-medium text-white">Email</label>
                            <input type="email" value={email} name='email' onChange={e => onChange(e)} class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="name@company.com" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-2 xl:col-span-2">
                            <label for="password" class="block mb-2 text-sm font-medium text-white">Contrasenya</label>
                            <input type="password" value={password} name='password' onChange={e => onChange(e)} placeholder="••••••••" class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" required></input>
                        </div>
                        <div class="col-span-2 md:col-span-2 xl:col-span-2">
                            <label for="password2" class="block mb-2 text-sm font-medium text-white">Confirmació</label>
                            <input type="password" value={password2} onChange={e => onChange(e)} name='password2' placeholder="Torna a escriure la contrasenya" class="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 " ></input>
                        </div>
                        <PasswordChecklist className="col-span-2 md:col-span-2 xl:col-span-2"
                            rules={["minLength", "specialChar", "number", "capital", "match"]}
                            minLength={8}
                            value={password}
                            valueAgain={password2}
                            invalidTextColor='white'
                            validTextColor='white'
                            onChange={(isValid) => setIsValid(isValid)}
                            messages={{
                                minLength: "La contrasenya té més de 8 caràcters.",
                                specialChar: "La contrasenya té caràcters especials.",
                                number: "La contrasenya té un número.",
                                capital: "La contrasenya té una lletra majúscula.",
                                match: "Les contrasenyes coincideixen.",
                            }}
                        />
                        <button type="submit" onClick={handleSubmit} variant="outlined" class="w-full col-span-2 md:col-span-2 xl:col-span-2 text-white focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-sky-600 hover:bg-sky-700 focus:ring-sky-800">Registrar-se</button>
                        <button type="submit" onClick={backToLogin} variant="outlined" class="w-full col-span-2 md:col-span-2 xl:col-span-2 text-white focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-5  py-2.5 text-center bg-sky-600 hover:bg-sky-700 focus:ring-sky-800">Tornar al Login</button>
                        <ToastContainer />
                </div>
            </div>
        </div>
    )
}