import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate, useMatches } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";

type RouteHandle = {
  headerVariant?: "list" | "simple";
  title?: string;
};

export type FormLayoutContext = {
  setBackHandler: (handler: (() => void) | null) => void;
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const [backHandler, setBackHandlerState] = useState<(() => void) | null>(
    null,
  );

  const setBackHandler = useCallback((handler: (() => void) | null) => {
    setBackHandlerState(() => handler);
  }, []);

  const handle = [...matches]
    .reverse()
    .find((match) => match.handle)?.handle as RouteHandle | undefined;

  const headerVariant = handle?.headerVariant ?? "list";
  const title = handle?.title;
  const isFormPage = headerVariant === "simple";
  const isCreatePage = location.pathname.startsWith("/create");

  return (
    <div className="app-shell flex min-h-svh w-full flex-col">
      <AppHeader
        variant={headerVariant}
        title={title}
        onBack={
          isFormPage
            ? () => {
                if (backHandler) {
                  backHandler();
                  return;
                }
                navigate("/home");
              }
            : undefined
        }
      />
      <main className="flex flex-1 flex-col">
        {isCreatePage ? (
          <Outlet context={{ setBackHandler } satisfies FormLayoutContext} />
        ) : (
          <PageContainer className="py-6">
            <Outlet context={{ setBackHandler } satisfies FormLayoutContext} />
          </PageContainer>
        )}
      </main>
    </div>
  );
};

export default MainLayout;
