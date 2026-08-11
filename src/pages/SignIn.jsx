import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GOOGLE_CLIENT_ID, base44 } from "@/api/base44Client";
import { BrandMark } from "@/components/shared/BrandMark";
import { useToast } from "@/components/ui/use-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnTo = searchParams.get("returnTo") || "/";
  const returnTo = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") ? rawReturnTo : "/";
  const qc = useQueryClient();
  const { toast } = useToast();
  const [googleReady, setGoogleReady] = useState(false);
  const authConfigQuery = useQuery({
    queryKey: ["auth-config"],
    queryFn: () => base44.auth.config(),
    staleTime: 10 * 60 * 1000,
  });
  const runtimeGoogleClientId = String(
    authConfigQuery.data?.googleClientId || "",
  ).trim();
  const activeGoogleClientId = GOOGLE_CLIENT_ID || runtimeGoogleClientId;
  const googleEnabled = Boolean(activeGoogleClientId);

  const googleMutation = useMutation({
    mutationFn: async (credential) => {
      const authSession = await base44.auth.signInWithGoogle(credential);
      return authSession;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["auth-me"] }),
        qc.invalidateQueries({ queryKey: ["admin"] }),
      ]);
      toast({
        title: "Google sign-in complete",
        description: "Your admin access is now active.",
      });
      navigate(returnTo, { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Google sign-in failed",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const googleMutationRef = React.useRef(googleMutation);
  googleMutationRef.current = googleMutation;

  useEffect(() => {
    if (!googleEnabled) return undefined;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: activeGoogleClientId,
        callback: (response) => {
          if (response?.credential) {
            googleMutationRef.current.mutate(response.credential);
          }
        },
      });
      const target = document.getElementById("stagecore-google-button");
      if (target) {
        target.innerHTML = "";
        window.google.accounts.id.renderButton(target, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: 340,
        });
        setGoogleReady(true);
      }
    };

    const existingScript = document.querySelector(
      'script[data-stagecore-google="true"]',
    );
    if (existingScript) {
      initializeGoogle();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.stagecoreGoogle = "true";
    script.onload = initializeGoogle;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [activeGoogleClientId, googleEnabled]);

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(17,19,26,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(17,19,26,0.045) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1), rgba(0,0,0,0.24) 72%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1160px] items-center justify-center">
        <div className="w-full max-w-[420px] rounded-[32px] border border-border bg-card px-6 py-7 shadow-2xl backdrop-blur sm:px-7 sm:py-8">
          <div className="flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-[18px] border border-brand-border-ivory bg-white shadow-[0_12px_24px_rgba(17,19,26,0.05)]">
              <BrandMark concept="site" className="size-7 object-contain" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="type-kicker text-brand-taupe-deep">
              Admin access
            </p>
            <h1 className="type-title-xl mt-3 text-brand-ink">
              Welcome back to Core
            </h1>
            <p className="type-body-sm mt-3 text-brand-slate-soft">
              Sign in with Google to unlock the control room.
            </p>
          </div>

          <div className="mt-6 rounded-[20px] border border-brand-border-linen bg-brand-cream-sand p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            {googleEnabled ? (
              <>
                <div id="stagecore-google-button" className="min-h-[44px]" />
                {!googleReady ? (
                  <p className="mt-2 text-center text-xs text-brand-slate-mute">
                    Loading Google sign-in…
                  </p>
                ) : null}
              </>
            ) : (
              <div className="space-y-2 px-2">
                <p className="type-body-sm text-brand-slate-soft">
                  Google sign-in is not configured yet.
                </p>
                <p className="text-xs text-brand-slate-mute">
                  Add GOOGLE_CLIENT_ID in the backend environment, then redeploy.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center">
            <p className="text-xs leading-5 text-brand-slate-mute">
              {googleMutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Verifying your account…
                </span>
              ) : (
                "Only authorized admin accounts can access the control room."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
