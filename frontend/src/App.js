import { Login } from './components/login';
import { Register } from './components/register';
import { Main} from './components/main'
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
  }
])

function App() {
  return (
    <div class=" bg-gradient-to-b from-cyan-400 via-sky-300">
      <RouterProvider router={router}/>
    </div>
  )
}

export default App;
