import { Outlet } from "react-router-dom";

import { AppHeader } from "@/components/layout/AppHeader";
import { PageContainer } from "@/components/layout/PageContainer";

const MainLayout = () => {
  return (
    <div className="app-shell flex min-h-svh w-full flex-col">
      <AppHeader variant="list" />
      <main className="flex-1">
        <PageContainer className="py-6">
          <Outlet />
        </PageContainer>
      </main>
    </div>
  );
};

export default MainLayout;
