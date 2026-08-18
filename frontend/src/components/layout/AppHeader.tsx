import { Link } from "react-router-dom";
import { LogOut, Mail } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENT_USER_EMAIL, CURRENT_USER_INITIALS } from "@/types/onePager";

function HeaderDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-7 w-px shrink-0 bg-white/90"
    />
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-primary">
      <PageContainer className="relative flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/home"
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="CATEGORY ONE-PAGER-APP home"
          >
            <img src="/logo.svg" alt="" className="size-8 object-contain" />
            <HeaderDivider />
            {/* TODO: Swap /logo-secondary.svg for the real second brand logo asset. */}
            <img
              src="/logo-secondary.svg"
              alt=""
              className="size-8 object-contain"
            />
            <HeaderDivider />
            <span className="truncate text-sm font-semibold tracking-wide text-primary-foreground md:text-base">
              CATEGORY ONE-PAGER-APP
            </span>
          </Link>
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
                  {CURRENT_USER_INITIALS}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 opacity-100">
              <Mail className="size-4 text-muted-foreground" />
              <span className="truncate">{CURRENT_USER_EMAIL}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2">
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageContainer>
    </header>
  );
}
