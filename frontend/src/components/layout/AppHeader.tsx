import { Link, useLocation, useNavigate } from "react-router-dom";
import { HelpCircle, LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/redux/hooks";
import { profileRoleLabel } from "@/redux/userSlice";
import { logout } from "@/services/authApi";
import perfectStoreLogo from "@/assets/Perfect_Store_Hero_Logo.svg";
import unileverBrandLogo from "@/assets/Unilever_Brand_Logo.svg";
import { VITE_USER_HELP_URL } from "@/constants/constants";
import { clearPersistedFilters } from "@/lib/homeFilterStorage";

function HeaderDivider() {
  return (
    <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-white/90" />
  );
}

function HeaderBrand() {
  return (
    <>
      <img
        src={perfectStoreLogo}
        alt=""
        className="size-28 object-contain"
      />
      <HeaderDivider />
      {/* TODO: Swap /logo-secondary.svg for the real second brand logo asset. */}
      <img
        src={unileverBrandLogo}
        alt=""
        className="size-16 object-contain"
      />
    </>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const headerTitle = pathname.startsWith("/user-adoption")
    ? "CATEGORY ONE-PAGER ADOPTION DASHBOARD"
    : "CATEGORY ONE-PAGER APP";
  const userGuideURL = VITE_USER_HELP_URL?.trim() ?? "";
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { name, email, initials, isAnalyst, isAnalystOnly } = currentUser;
  const showDashboard = isAnalyst && !isAnalystOnly;
  const handleHelp = () => {
    open(userGuideURL);
  };

  const handleLogout = () => {
    // Always land on /login even if signOut fails; logout() already clears the
    // stored token, so the user is effectively signed out locally.
    void logout()
      .catch(() => {})
      .finally(() => {
        clearPersistedFilters();
        navigate("/login");
      });
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-hidden bg-primary">
      <PageContainer className="relative flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {isAnalystOnly ? (
            <div className="flex h-14 shrink-0 items-center gap-2">
              <HeaderBrand />
            </div>
          ) : (
            <Link
              to="/home"
              className="flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Go to home"
            >
              <HeaderBrand />
            </Link>
          )}
          <HeaderDivider />
          <p className="mt-[5px] min-w-0 truncate font-semibold text-[#ffffff] text-[14px] tracking-[0.2px]">
            {headerTitle}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="User menu"
            >
              <Avatar className="size-9">
                <AvatarFallback className="bg-avatar-bg text-sm font-semibold text-avatar-fg">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-0">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-foreground">
                      {name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 self-center bg-brand-soft text-primary hover:bg-brand-soft"
                >
                  {profileRoleLabel(currentUser)}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            {showDashboard ? (
              <>
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onClick={() => navigate("/user-adoption")}
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
              </>
            ) : null}
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={handleHelp}
            >
              <HelpCircle className="size-4 " />
              {/* <span className="truncate">Help</span> */}
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              className="cursor-pointer gap-2 rounded-none px-3 py-2.5"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageContainer>
    </header>
  );
}
