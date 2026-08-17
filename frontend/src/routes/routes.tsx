import { Navigate } from "react-router-dom";

import { Home } from "../pages/Home";
import { CreateNationalOnePager } from "../pages/CreateNationalOnePager";
import { CreateRetailerOnePager } from "../pages/CreateRetailerOnePager";
import { EditOnePager } from "../pages/EditOnePager";
import { ViewOnePager } from "../pages/ViewOnePager";
import { PreviewNationalOnePager } from "../pages/PreviewNationalOnePager";
import { PreviewRetailerOnePager } from "../pages/PreviewRetailerOnePager";
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
        path: "edit/:pagerId",
        element: <EditOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Edit One-Pager",
        },
      },
      {
        path: "view/:pagerId",
        element: <ViewOnePager />,
        handle: {
          headerVariant: "simple",
          title: "View One-Pager",
        },
      },
      {
        path: "create/national",
        element: <CreateNationalOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Create New National One-Pager",
        },
      },
      {
        path: "create/national/preview",
        element: <PreviewNationalOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Preview National One-Pager",
        },
      },
      {
        path: "create/retailer",
        element: <CreateRetailerOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Build New Retailer One-Pager",
        },
      },
      {
        path: "create/retailer/preview",
        element: <PreviewRetailerOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Preview Retailer One-Pager",
        },
      },
    ],
  },
];

export default routes;
