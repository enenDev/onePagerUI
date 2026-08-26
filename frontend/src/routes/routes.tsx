import { Navigate } from "react-router-dom";

import { RequireUserCreateAccess } from "../components/auth/RequireUserCreateAccess";
import { Home } from "../pages/Home";
import { CreateNationalOnePager } from "../pages/CreateNationalOnePager";
import { CreateRetailerOnePager } from "../pages/CreateRetailerOnePager";
import { EditOnePager } from "../pages/EditOnePager";
import { ViewOnePager } from "../pages/ViewOnePager";
import { TrackOnePager } from "../pages/TrackOnePager";
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
        path: "track/:pagerId",
        element: <TrackOnePager />,
        handle: {
          headerVariant: "simple",
          title: "Track One-Pager",
        },
      },
      {
        path: "create/national",
        element: (
          <RequireUserCreateAccess kind="national">
            <CreateNationalOnePager />
          </RequireUserCreateAccess>
        ),
        handle: {
          headerVariant: "simple",
          title: "Create New National One-Pager",
        },
      },
      {
        path: "create/national/preview",
        element: (
          <RequireUserCreateAccess kind="national">
            <PreviewNationalOnePager />
          </RequireUserCreateAccess>
        ),
        handle: {
          headerVariant: "simple",
          title: "Preview National One-Pager",
        },
      },
      {
        path: "create/retailer",
        element: (
          <RequireUserCreateAccess kind="retailer">
            <CreateRetailerOnePager />
          </RequireUserCreateAccess>
        ),
        handle: {
          headerVariant: "simple",
          title: "Build New Retailer One-Pager",
        },
      },
      {
        path: "create/retailer/preview",
        element: (
          <RequireUserCreateAccess kind="retailer">
            <PreviewRetailerOnePager />
          </RequireUserCreateAccess>
        ),
        handle: {
          headerVariant: "simple",
          title: "Preview Retailer One-Pager",
        },
      },
    ],
  },
];

export default routes;
