import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GOOGLE_CLIENT_ID, base44 } from "@/api/base44Client";
import { BrandMark } from "@/components/shared/BrandMark";
import { useToast } from "@/components/ui/use-toast";

function buildProfilePayload(session, overrides = {}) {
  return {
    user_id: session.userId,
    display_name: overrides.display_name ?? session.displayName,
    favorite_team: overrides.favorite_team ?? "",
    total_points: Number(overrides.total_points ?? 0),
    accuracy_percent: Number(overrides.accuracy_percent ?? 0),
    badge: overrides.badge ?? "Rookie",
    rank_badge: overrides.rank_badge ?? "Rookie",
    badge_inventory: overrides.badge_inventory ?? ["Rookie"],
    predictions_count: Number(overrides.predictions_count ?? 0),
    correct_predictions: Number(overrides.correct_predictions ?? 0),
  };
}

export default function SignIn() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const storedFan = useMemo(() => base44.fan.getStoredSession(), []);
  const [displayName, setDisplayName] = useState(storedFan.displayName || "");
  const [googleReady, setGoogleReady] = useState(false);
  const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

  const syncFanProfile = async ({ authUser = null, fallbackName = "" } = {}) => {
    const nextDisplayName =
      fallbackName ||
      authUser?.full_name ||
      authUser?.email?.split("@")[0] ||
      storedFan.displayName ||
      "StageCore Fan";
    const preferredUserId = authUser?.id || "";
    const fanSession = await base44.fan.createSession(
      nextDisplayName,
      preferredUserId,
    );
    const existingProfiles = await base44.entities.FanProfile.filter(
      { user_id: fanSession.userId },
      "-updated_date",
      1,
    );
    if (!existingProfiles[0]) {
      await base44.entities.FanProfile.create(
        buildProfilePayload(fanSession, {
          display_name: fanSession.displayName,
        }),
      );
    }
    return fanSession;
  };

  const localMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        throw new Error("Enter a display name to continue locally.");
      }
      await syncFanProfile({ fallbackName: trimmedName });
      return true;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["profile-fan-profile"] }),
        qc.invalidateQueries({ queryKey: ["profile-leaderboard"] }),
      ]);
      toast({
        title: "Profile ready",
        description: "Your local StageCore fan profile is active.",
      });
      navigate("/profile");
    },
    onError: (error) => {
      toast({
        title: "Could not continue",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential) => {
      const authSession = await base44.auth.signInWithGoogle(credential);
      await syncFanProfile({ authUser: authSession.user });
      return authSession;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["auth-me"] }),
        qc.invalidateQueries({ queryKey: ["profile-fan-profile"] }),
        qc.invalidateQueries({ queryKey: ["profile-leaderboard"] }),
      ]);
      toast({
        title: "Google sign-in complete",
        description:
          "Your StageCore profile is connected to your Google account.",
      });
      navigate("/profile");
    },
    onError: (error) => {
      toast({
        title: "Google sign-in failed",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!googleEnabled) return undefined;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            googleMutation.mutate(response.credential);
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
  }, [googleEnabled, googleMutation]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ef_0%,#f3eee6_100%)] px-4 py-8 text-[#11131a] sm:px-6">
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
        <div className="w-full max-w-[420px] rounded-[28px] border border-[#ece2d6] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,242,235,0.96))] px-6 py-7 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:px-7 sm:py-8">
          <div className="flex items-center justify-center">
            <div className="flex size-14 items-center justify-center rounded-[18px] border border-[#eee4d8] bg-white shadow-[0_12px_24px_rgba(17,19,26,0.05)]">
              <BrandMark concept="site" className="size-7 object-contain" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="type-kicker text-[#9c8368]">
              StageCore profile access
            </p>
            <h1 className="type-title-xl mt-3 text-[#11131a]">
              Welcome back to StageCore
            </h1>
            <p className="type-body-sm mt-3 text-[#6d7278]">
              Use Google for your full account, or continue with a local fan
              profile on this device.
            </p>
          </div>

          <div className="mt-6 rounded-[20px] border border-[#ebe2d6] bg-[#f6f5f3] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            {googleEnabled ? (
              <>
                <div id="stagecore-google-button" className="min-h-[44px]" />
                {!googleReady ? (
                  <p className="mt-2 text-center text-xs text-[#8f949c]">
                    Loading Google sign-in...
                  </p>
                ) : null}
              </>
            ) : (
              <div className="space-y-2 px-2">
                <p className="type-body-sm text-[#6d7278]">
                  Google sign-in is not available in this preview yet.
                </p>
                <p className="text-xs text-[#8f949c]">
                  You can still continue with a local profile below.
                </p>
              </div>
            )}
          </div>

          <div className="type-caption mt-5 flex items-center gap-3 text-[#8f949c]">
            <span className="h-px flex-1 bg-[#e6ddd2]" />
            Or continue with a local profile
            <span className="h-px flex-1 bg-[#e6ddd2]" />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="signin-display-name"
                className="type-nav mb-2 block text-[#2d3138]"
              >
                Display name
              </label>
              <input
                id="signin-display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter your display name"
                aria-label="Display name"
                className="h-12 w-full rounded-[18px] border border-[#e7ddd1] bg-white px-4 text-sm text-[#11131a] outline-none transition focus:border-[#11131a] focus:ring-2 focus:ring-[#11131a]/8"
              />
            </div>

            <button
              type="button"
              onClick={() => localMutation.mutate()}
              disabled={localMutation.isPending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#11131a] text-sm font-semibold text-white transition hover:bg-[#181c24] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {localMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Continue with local profile
                  <Sparkles className="size-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-1">
              <Link
                to="/app"
                className="type-nav text-[#6d7278] transition hover:text-[#11131a]"
              >
                Open desktop app without signing in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
