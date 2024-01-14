import axios from 'axios'
import { React, useState } from 'react'
import { Button, Dropdown } from 'flowbite-react';
import { ReactComponent as excel } from '../assets/archivo-excel.svg'


export const Modal2 = ({ setOpenModal }) => {

    const test = [
        'java',
        'python'
    ]
    const [selectedcurs, setSelectedcurs] = useState(test[0])

    const [filelist, setFile] = useState([])

    const [isDragOver, setIsDragOver] = useState(false);

    const [formData, setFormData] = useState({
        nom: '',
        descripcio: ''
    });

    const { nom, descripcio } = formData;
    const create = e => {
        e.preventDefault()
        const formDataToSend = new FormData();
        formDataToSend.append('nom', formData.nom);
        formDataToSend.append('idiomaP', selectedcurs);
        formDataToSend.append('descripcio', formData.descripcio);
        formDataToSend.append('id_curs', localStorage.getItem('curs_id'))
        filelist.forEach(files => {
            formDataToSend.append('files', files);

        })
        console.log(formDataToSend)
        axios
            .post('http://127.0.0.1:8000/cursos/practica', formDataToSend, {
                headers: {
                    'Authorization': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                    
                }
            })
            .then((response) => {
                setOpenModal(false)

            })
            .catch((error) => {
                console.error('Error al enviar la solicitud:', error);
            });

    }
    const onDrop = (e) => {
        e.preventDefault();

        const newFile = e.target.files[0]
        if (newFile) {
            const updatedList = [...filelist, newFile]
            setFile(updatedList)
        }
        setIsDragOver(false);
    };

    const onDrop2 = (e) => {
        e.preventDefault();

        const newFile = e.dataTransfer.files[0]
        if (newFile) {
            const updatedList = [...filelist, newFile]
            setFile(updatedList)
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

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    return (
        <div
            className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none bg-black bg-opacity-50 backdrop-blur-sm"
        >
            <div class="w-auto bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-slate-800 dark:border-gray-700">
                <div class="p-8 space-y-4 md:space-y-6 sm:p-8 grid grid-cols-2 gap-x-4 gap-y-2 ">
                    <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white col-span-2">
                        Creació Pràctica
                    </h1>
                    <div class="col-span-2 md:col-span-1 xl:col-span-1">
                        <label for="nom" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nom Pràctica</label>
                        <input variant="standard" type="email" value={nom} name='nom' onChange={e => onChange(e)} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required></input>

                    </div>
                    <div class="col-span-2 md:col-span-1 xl:col-span-1">
                        <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Idioma Programació</label>
                        <Dropdown size="lg" placement="bottom-start" renderTrigger={() =>
                            <button className="sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 bg-gray-700 border-gray-600  dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                type="button">{selectedcurs}</button>}>
                            {test.map((person) => (
                                <Dropdown.Item key={person} value={person} className='text-gray-300 hover:text-sky-500 border-gray-600 align-text-top p-1 w-auto' onClick={(e) => setSelectedcurs(person)}> {person}</Dropdown.Item>
                            ))
                            }
                        </Dropdown>
                    </div>
                    <div class="col-span-2">
                        <label for="descripcio" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripció</label>
                        <textarea value={descripcio} name='descripcio' onChange={e => onChange(e)}
                            class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required></textarea>
                    </div >
                    <div class="col-span-2">
                        <div
                            className={`border-dashed border-2 border-gray-300 rounded-md p-6 flex flex-col items-center ${isDragOver ? 'bg-sky-500 border-black' : ''} `}
                            onDrop={onDrop2}
                            onDragOver={onDragEnter}
                            onDragLeave={onDragLeave}
                        >
                            <div className="align-middle justify-items-center p-3 text-white">
                                <img src="" alt="" />
                                <p>Arrossega aquí els fitxers o </p>
                            </div>
                            <input className='text-transparent ml-40' type="file" value="" onChange={onDrop} />
                        </div>
                        {
                            filelist.length > 0 ? (
                                <div className="mt-7">
                                    <p className="mb-6 text-white">
                                        Ready to upload
                                    </p>
                                    {
                                        filelist.map((item, index) => (
                                            <div key={index} className="flex flex-auto relative bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300   rounded-xl p-4 mb-3">
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
                    </div>
                </div>
                <div className="flex items-center justify-end p-6 border-t border-solid border-sky-500 rounded-b">
                    <button
                        className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => setOpenModal(false)}
                    >
                        Tancar
                    </button>
                    <button
                        className="bg-sky-500 text-white active:bg-sky-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={create}
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
