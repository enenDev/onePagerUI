import { Navigate } from "react-router-dom";

import { Home } from "../pages/Home";
import { CreateNationalOnePager } from "../pages/CreateNationalOnePager";
import MainLayout from "../layouts/MainLayout";

const routes = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "create/national",
        element: <CreateNationalOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Create New National One-Pager",
        },
      },
    ],
  },
];

export default routes;
