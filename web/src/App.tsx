import { createRoutesFromElements, createBrowserRouter, RouterProvider, Route, redirect } from 'react-router-dom'
import React, { Suspense } from 'react'
import AuthRoute from './components/AuthRoute'
import Loading from './pages/Loading'
import NotFound from './pages/NotFound'

const Layout = React.lazy(() => import('@/Layout'))
const Login = React.lazy(() => import('@/pages/Login'))

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route errorElement={<NotFound />}>
        {/* <Route /> */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          loader={async () => {
            throw redirect('/knowledgeData')
          }}
        />

        <Route
          path="/*"
          element={
            <AuthRoute>
              <Layout />
            </AuthRoute>
          }
        />
      </Route>
    </>
  )
)
export default function App() {
  return (
    <div className="app">
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </div>
  )
}
