import { Login } from './components/login';
import { Register } from './components/register';
import { Main} from './components/main';
import { Assignatura } from './components/assignatura';
import { Calendario } from './components/calendario';
import { Practica } from './components/practica';
import { createBrowserRouter, RouterProvider} from "react-router-dom"


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
    path : "/practica",
    element: <Practica />
  }
])

function App() {
  return (
    <div class=" bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200">
      <RouterProvider router={router}/>
    </div>
  )
}

export default App;
