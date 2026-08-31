import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loginWithSso } from "@/services/authApi";
import perfectStoreLogo from "@/assets/Perfect_Store_Hero_Logo.svg?raw";
import unileverBrandLogo from "@/assets/Unilever_Brand_Logo.svg";

export const Login = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const accessInstructionsUrl =
    import.meta.env.VITE_ACCESS_INSTRUCTIONS_URL?.trim() ?? "";
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSso = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithSso();
      navigate("/home");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col bg-primary">
      <img
        src={unileverBrandLogo}
        alt="Unilever"
        className="absolute top-6 left-6 h-7 w-auto object-contain md:top-8 md:left-8"
      />

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-[400px] rounded-xl bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
          <div
            role="img"
            aria-label="Perfect Store"
            className="mx-auto flex h-10 w-fit justify-center text-primary [&_svg]:h-10 [&_svg]:w-auto"
            dangerouslySetInnerHTML={{
              __html: perfectStoreLogo.replaceAll(
                'fill="white"',
                'fill="currentColor"',
              ),
            }}
          />

          <h1 className="mt-8 text-3xl font-bold text-foreground">Welcome!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login to access Category One-Pager App
          </p>

          <Button
            type="button"
            className="mt-8 h-11 w-full cursor-pointer rounded-lg text-base font-semibold"
            onClick={() => void handleSso()}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Logging in…
              </>
            ) : (
              "Login with SSO"
            )}
          </Button>

          {error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="mt-6 cursor-pointer text-sm text-primary underline underline-offset-2 hover:text-primary/80"
            onClick={() => setHelpOpen(true)}
          >
            Unable to login?
          </button>
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(calc(100%-2rem),22rem)] gap-8 rounded-xl px-8 py-10 text-center sm:max-w-[22rem]"
        >
          <DialogHeader className="items-center gap-6">
            <DialogTitle className="text-center text-base font-semibold text-foreground">
              Need help logging in?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              If you&apos;re unable to log in using SSO, follow the steps in the
              link below to request or regain access.
            </DialogDescription>
          </DialogHeader>
          {/* TODO: Set VITE_ACCESS_INSTRUCTIONS_URL in frontend/.env.
              Keep the modal copy and "View access instructions →" label. */}
          {accessInstructionsUrl ? (
            <a
              href={accessInstructionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto cursor-pointer text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              View access instructions →
            </a>
          ) : (
            <button
              type="button"
              className="mx-auto cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              View access instructions →
            </button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
