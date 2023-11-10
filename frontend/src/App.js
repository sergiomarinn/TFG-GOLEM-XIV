import { Login } from './components/login';
import { Register } from './components/register';
import { createBrowserRouter, RouterProvider} from "react-router-dom"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  }
])

function App() {
  return (
    <body class="h-screen bg-sky-300 dark:bg-sky-900 ">
      <RouterProvider router={router}/>
    </body>
  )
}

export default App;
