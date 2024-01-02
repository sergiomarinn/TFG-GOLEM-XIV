import axios from 'axios'
import { React, useState } from 'react'

import {useNavigate } from 'react-router-dom';


export const Login = () => {

    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const {username, password} = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = e => {
        e.preventDefault();

        const baseURL = 'http://127.0.0.1:8000/users/login'
        axios.post(baseURL,formData,{
            headers: {
                "Authorization" : localStorage.getItem('token')

           }})
            .then((response) => {
                console.log(response)
                localStorage.setItem('token', response.data.token_type + " " + response.data.access_token)
                localStorage.setItem('alumne', response.data.is_alumne)
                localStorage.setItem('profesor', response.data.is_profesor)
                localStorage.setItem('admin', response.data.is_admin)
                navigate("/main")

            }).catch((response) => console.log(response));
    }
    return (
        <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
            <a href="#" class="flex items-center mb-6 text-2xl font-semibold text-white">
            </a>
            <div class="w-full  rounded-lg shadow border md:mt-0 sm:max-w-md xl:p-0 bg-slate-800 border-gray-700">
                <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                    <h1 class="text-xl font-bold leading-tight tracking-tight md:text-2xl text-white">
                        Login
                    </h1>
                    <form class="space-y-4 md:space-y-6" action="#">
                        <div>
                            <label for="username" class="block mb-2 text-sm font-medium text-white">Niub o Email</label>
                            <input type="username" value={username} onChange={e => onChange(e)} name="username" id="email" class=" sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="NIUB999999999 / name@company.com" required=""></input>
                        </div>
                        <div>
                            <label for="password" class="block mb-2 text-sm font-medium text-white">Contraseña</label>
                            <input type="password" name="password" value={password} onChange={e => onChange(e)} id="password" placeholder="••••••••" class=" sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" required=""></input>
                        </div>
                        <button type="submit" onClick={handleSubmit} variant="outlined" class="w-full  focus:ring-4 focus:outline-none  font-medium rounded-lg text-sm px-5 py-2.5 text-center text-white bg-sky-600 hover:bg-sky-700 focus:ring-sky-800">Sign in</button>
                        <p class="text-sm text-white">
                            No tienes cuenta? <a href="/register" class="font-medium  hover:underline text-white">Sign up</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

