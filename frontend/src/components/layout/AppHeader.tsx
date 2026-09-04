import { Link, useNavigate } from "react-router-dom";
import { HelpCircle, LogOut, UserRound } from "lucide-react";

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
import { userTypeLabel } from "@/redux/userSlice";
import { logout } from "@/services/authApi";
import perfectStoreLogo from "@/assets/Perfect_Store_Hero_Logo.svg";
import unileverBrandLogo from "@/assets/Unilever_Brand_Logo.svg";

function HeaderDivider() {
  return (
    <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-white/90" />
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const { name, email, initials, user_type } = useAppSelector(
    (state) => state.user.currentUser,
  );

  const handleLogout = () => {
    void logout().then(() => {
      navigate("/login");
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-hidden bg-primary">
      <PageContainer className="relative flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/home"
            className="flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Go to home"
          >
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
          </Link>
          <HeaderDivider />
          <p className="mt-[5px] font-semibold text-[#ffffff] text-[14px] tracking-[0.2px] whitespace-nowrap">
            CATEGORY ONE-PAGER APP
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
                  {userTypeLabel(user_type)}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem className="cursor-pointer gap-2">
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
