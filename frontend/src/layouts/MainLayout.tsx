import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate, useMatches } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";

type RouteHandle = {
  headerVariant?: "list" | "simple";
  title?: string;
};

export type FormLayoutContext = {
  setBackHandler: (handler: (() => void) | null) => void;
  setHeaderTitle: (title: string | null) => void;
};

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const [backHandler, setBackHandlerState] = useState<(() => void) | null>(
    null,
  );
  const [headerTitle, setHeaderTitleState] = useState<string | null>(null);

  const setBackHandler = useCallback((handler: (() => void) | null) => {
    setBackHandlerState(() => handler);
  }, []);

  const setHeaderTitle = useCallback((title: string | null) => {
    setHeaderTitleState(title);
  }, []);

  const handle = [...matches]
    .reverse()
    .find((match) => match.handle)?.handle as RouteHandle | undefined;

  const headerVariant = handle?.headerVariant ?? "list";
  const title = headerTitle ?? handle?.title;
  const isFormPage = headerVariant === "simple";
  const isFullBleedPage =
    location.pathname.startsWith("/create") ||
    location.pathname.startsWith("/edit") ||
    location.pathname.startsWith("/view") ||
    location.pathname.startsWith("/track");

  const handleBack = () => {
    if (backHandler) {
      backHandler();
      return;
    }
    navigate("/home");
  };

  return (
    <div className="app-shell flex min-h-svh w-full flex-col">
      <AppHeader />
      {isFormPage && title ? (
        <div className="border-b border-border bg-white">
          <PageContainer className="flex h-12 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              className="cursor-pointer text-foreground hover:bg-accent"
              aria-label="Go back"
            >
              <span className="text-lg leading-none">&lt;</span>
            </Button>
            <h1
              title={title}
              className="truncate text-sm font-semibold text-foreground md:text-base"
            >
              {title}
            </h1>
          </PageContainer>
        </div>
      ) : null}
      <main className="flex flex-1 flex-col">
        {isFullBleedPage ? (
          <Outlet
            context={
              { setBackHandler, setHeaderTitle } satisfies FormLayoutContext
            }
          />
        ) : (
          <PageContainer className="py-6">
            <Outlet
              context={
                { setBackHandler, setHeaderTitle } satisfies FormLayoutContext
              }
            />
          </PageContainer>
        )}
      </main>
    </div>
  );
};

export default MainLayout;
