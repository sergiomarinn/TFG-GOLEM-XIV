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
    <div class=" bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200">
      <RouterProvider router={router}/>
    </div>
  )
}

export default App;
