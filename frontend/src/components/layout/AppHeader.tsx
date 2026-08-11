import { Link, useLocation } from "react-router-dom";
import { LogOut, Mail } from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setStatusTab } from "@/redux/landingSlice";
import {
  CURRENT_USER_EMAIL,
  CURRENT_USER_INITIALS,
  type StatusTab,
} from "@/types/onePager";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "drafts", label: "Drafts" },
  { id: "archive", label: "Archive" },
];

type AppHeaderProps = {
  variant?: "list" | "simple";
  title?: string;
  onBack?: () => void;
};

export function AppHeader({
  variant = "list",
  title,
  onBack,
}: AppHeaderProps) {
  const dispatch = useAppDispatch();
  const statusTab = useAppSelector((state) => state.landing.statusTab);
  const location = useLocation();
  const showStatusTabs = variant === "list" && location.pathname === "/home";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white">
      <PageContainer className="relative flex h-14 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/home"
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="One Pager home"
          >
            <img src="/logo.svg" alt="" className="size-8 object-contain" />
            <span className="text-base font-semibold text-foreground">
              One Pager
            </span>
          </Link>

          {variant === "simple" && (
            <div className="flex min-w-0 items-center gap-2">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onBack}
                  aria-label="Go back"
                >
                  <span className="text-lg leading-none">&lt;</span>
                </Button>
              )}
              {title && (
                <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
                  {title}
                </h1>
              )}
            </div>
          )}
        </div>

        {showStatusTabs && (
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-full bg-brand-soft p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => dispatch(setStatusTab(tab.id))}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  statusTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-primary hover:bg-white/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
