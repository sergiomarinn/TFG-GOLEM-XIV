import { Sidebar } from './sidebar';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import fondo from '../assets/fondo.jpg'; 
import {io} from 'socket.io-client';  
import { useNotification } from './notificationContext';  

export const Notificacion = () => {
  const [storedToken, setStoredToken] = useState(localStorage.getItem('token')); 
  const [practicasCorregidas, setPracticasCorregidas] = useState([]);
  const [error, setError] = useState(''); 
  const [newPractica, setNewPractica] = useState([]);
  const { newNotification, addNotification, clearNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [selectedPractica, setSelectedPractica] = useState(null); 



  const fetchPracticasCorregidas = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/cursos/practicas_corregidas', {
        headers: {
          Authorization: storedToken,
        },
      });
      console.log("Datos recibidos: ", response.data);
      setPracticasCorregidas(response.data);
      
    } catch (err) {
      setError('Error al cargar las prácticas corregidas');
      console.error(err);
    }
  };

  useEffect(() => {
    console.log(storedToken);
    clearNotification();
    fetchPracticasCorregidas(); 
    const socket = io("http://localhost:5000");
      socket.on('practice_corrected', (data) => {
        console.log('Notificación recibida:', data);
        setNewPractica(data);
        addNotification(data);  
      });
  }, [storedToken]);

  const CartaPractica = ({ practica, onClick }) => (
    <div className="flex rounded-lg hover:cursor-pointer bg-slate-800 w-full h-32"
    onClick={() => onClick(practica)}>
      
      <img
        className="h-full w-20 object-cover rounded-l-lg"  
        src={fondo}
        alt=""
      />
      <div className="flex flex-col justify-center p-4 w-4/5">  
        <h5 className="text-lg font-medium leading-tight text-neutral-50">
          Pràctica: {practica.nom}
        </h5>
        <p className="text-neutral-400 text-sm">
          <strong>Curs:</strong> {practica.curs}
        </p>
        <p className="text-neutral-400 text-sm">
          <strong>Descripció:</strong> {practica.descripcio}
        </p>
        <p className="text-neutral-400 text-sm">
          <strong>Idioma:</strong> {practica.idiomaP}
        </p>
      </div>
    </div>
  );
  
  const handlePracticaClick = (practica) => {
    setSelectedPractica(practica); 
    setIsModalOpen(true); 
    
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPractica(null);
  };
  
  const Modal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;
  
    // Acceso directo a las propiedades esperadas
    const correccion = data.correccion || {};
    let testResult = {};
    console.log("Corrección",correccion)
    console.log("Tipo Corrección",typeof(correccion))
    if (typeof correccion === 'string') {
      try {
        testResult = JSON.parse(correccion);
        console.log("JSON Parsed", testResult)
      } catch (e) {
        console.error("Error al parsear corrección:", e);
        testResult = {}; // En caso de error, asegurar que sea un objeto vacío
      }
    } else {
      testResult = correccion;
    }
    
    console.log("Test Result formatted", testResult)
    console.log("testResult:", testResult);
    console.log("Checks Execution:", testResult?.["Checks Execution"]);
    console.log("Function quants_1:", testResult?.["Checks Execution"]?.["Function quants_1 "]);
    console.log("Results:", testResult?.["Checks Execution"]?.["Function quants_1 "]?.["Results"]);
    console.log("First Result:", testResult?.["Checks Execution"]?.["Function quants_1 "]?.["Results"]?.[0]);
    const studentId = testResult["Student ID"] || "N/A";
    const checksInitialization = testResult["Checks Initialization"] || "N/A";
    const checksExecution = testResult["Checks Execution"] || "N/A";
    const function_quants = checksExecution["Function quants_1 "] || "N/A";
    const results = function_quants["Results"][0] || "N/A";
    const asserts = function_quants["LLM Asserts gpt-3.5-turbo"] || "N/A";
    const input = function_quants["LLM Asserts gpt-3.5-turbo"]["Input"] || "N/A";
    const model = function_quants["LLM Asserts gpt-3.5-turbo"]["Model"] || "N/A";
    const code = function_quants["LLM Asserts gpt-3.5-turbo"]["Submitted Code"] || "N/A";


    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="relative bg-white rounded-lg p-6 w-4/5 max-w-3xl overflow-y-auto max-h-[80vh] shadow-lg">
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-xl"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">Detalls de la Correcció</h2>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
            <p>
              <strong>ID de l'estudiant:</strong> {studentId}
            </p>
            <p>
              <strong>Inicialització de Comprovacions:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{checksInitialization}</pre>
            <p>
              <strong>Execució de Comprovacions Resultats:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{results}</pre>
            <p>
              <strong>Execució de Comprovacions LLM:</strong>
            </p>
            <p>
              <strong>Input:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{input}</pre>
            <p>
              <strong>Model:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{model}</pre>
            <p>
              <strong>Code:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">{code}</pre>
          </div>
        </div>
      </div>
    );

    /*const {
      studentId = "N/A",
      testDate = "N/A",
      language = "N/A",
      score = 0,
      totalQuestions = 0,
      correctAnswers = 0,
      incorrectAnswers = 0,
      timeTaken = "N/A",
      questions = [],
      feedback = { generalComments: "N/A", areasForImprovement: [], recommendedResources: [] },
    } = testResult.testResult || {};*/
    /*return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="relative bg-white rounded-lg p-6 w-4/5 max-w-3xl overflow-y-auto max-h-[80vh] shadow-lg">
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-xl"
            onClick={onClose}
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">Detalls de la Correcció</h2>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
            <p>
              <strong>ID de l'estudiant:</strong> {studentId}
            </p>
            <p>
              <strong>Data de la Prova:</strong>{" "}
              {testDate !== "N/A" ? new Date(testDate).toLocaleString() : "N/A"}
            </p>
            <p>
              <strong>Llenguatge:</strong> {language}
            </p>
            <p>
              <strong>Puntuació:</strong> {score}/{totalQuestions}
            </p>
            <p>
              <strong>Respostes Correctes:</strong> {correctAnswers}
            </p>
            <p>
              <strong>Respostes Incorrectes:</strong> {incorrectAnswers}
            </p>
            <p>
              <strong>Temps Requerit:</strong> {timeTaken}
            </p>
  
            <h3 className="mt-4 font-bold">Preguntes:</h3>
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <div key={index} className="border-t border-gray-300 mt-2 pt-2">
                  <p>
                    <strong>Pregunta {index + 1}:</strong> {q.question}
                  </p>
                  <p>
                    <strong>Resposta Correcte:</strong> {q.correctAnswer}
                  </p>
                  <p>
                    <strong>La teva Resposta:</strong> {q.userAnswer}
                  </p>
                  <p>
                    <strong>És Correcte:</strong> {q.isCorrect ? "Sí" : "No"}
                  </p>
                </div>
              ))
            ) : (
              <p>No hi ha preguntes disponibles.</p>
            )}
  
            <h3 className="mt-4 font-bold">Comentaris i Retroalimentació:</h3>
            <p>
              <strong>Comentaris Generals:</strong>{" "}
              {feedback.generalComments || "N/A"}
            </p>
            {feedback.areasForImprovement?.length > 0 && (
              <>
                <p>
                  <strong>Àreas de Millora:</strong>
                </p>
                <ul className="list-disc ml-6">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </>
            )}
            {feedback.recommendedResources?.length > 0 && (
              <>
                <p>
                  <strong>Recursos Recomenats:</strong>
                </p>
                <ul className="list-disc ml-6">
                  {feedback.recommendedResources.map((resource, index) => (
                    <li key={index}>{resource}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    );*/
  };
  
  
  
  

  return (
    <div className="flex bg-zinc-100 h-auto">
      <Sidebar/>
      <div className="flex-1 p-8 md:p-24 sm:p-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pràctiques corregides:</h1>
          <p className="text-gray-600 mt-2">
            Aquí pots trobar les pràctiques que han estat corregides, fes clic en una pràctica per veure els detalls de la correcció.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 xl:gap-x-4 gap-y-6">
          {practicasCorregidas.map((practica, index) => (
            <CartaPractica key={index} practica={practica} onClick={handlePracticaClick} />
          ))}
        </div>
      </div>
      <Modal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      data={selectedPractica}
    />
    </div>
  );
};


