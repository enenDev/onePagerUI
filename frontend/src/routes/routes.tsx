import { Navigate } from "react-router-dom";

import { Home } from "../pages/Home";

import MainLayout from "../layouts/MainLayout";

const routes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={"/home"} replace />,
      },
      {
        path: "/home",
        element: <Home />,
      },
    ],
  },
  //   {
  //     path: ROUTES.LOGIN,
  //     element: <Login />,
  //   },
];

export default routes;
