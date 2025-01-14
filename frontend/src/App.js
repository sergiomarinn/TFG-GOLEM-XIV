import { Login } from './components/login';
import { Register } from './components/register';
import { Main} from './components/main';
import { Assignatura } from './components/assignatura';
import { Calendario } from './components/calendario';
import { Practica } from './components/practica';
import { Notificacion } from './components/notificaciones';
import { createBrowserRouter, RouterProvider} from "react-router-dom"
import { NotificationProvider } from './components/notificationContext.js';
import { Sidebar } from 'flowbite-react';
import 'font-awesome/css/font-awesome.min.css';



const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/main",
    element: <Main />
  },
  {
    path : "/assignatura",
    element: <Assignatura />
  },
  {
    path : "/calendario",
    element: <Calendario />
  },
  {
    path : "/notificaciones",
    element: <Notificacion />
  },
  {
    path : "/practica",
    element: <Practica />
  }
])

function App() {
  return (
    <NotificationProvider>
      <div className="flex">
        <Sidebar />  
        <div className="flex-1">
          <RouterProvider router={router} />  
        </div>
      </div>
    </NotificationProvider>
  );
}

export default App;
