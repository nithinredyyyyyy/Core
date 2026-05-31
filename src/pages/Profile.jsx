import React, { useMemo, useReducer, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Crosshair,
  ImagePlus,
  LogOut,
  Loader2,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCircle2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import FanBadgeEmblem from "@/components/fans/FanBadgeEmblem";
import FanPredictionHistory from "@/components/fans/FanPredictionHistory";
import { useToast } from "@/components/ui/use-toast";
import { normalizeBadgeName } from "@/lib/fanBadges";

function buildProfilePayload(session, profile, overrides = {}) {
  return {
    user_id: session.userId,
    display_name:
      overrides.display_name ?? profile?.display_name ?? session.displayName,
    favorite_team: overrides.favorite_team ?? profile?.favorite_team ?? "",
    profile_image: overrides.profile_image ?? profile?.profile_image ?? "",
    total_points: Number(overrides.total_points ?? profile?.total_points ?? 0),
    xp_points: Number(overrides.xp_points ?? profile?.xp_points ?? 0),
    login_streak: Number(
      overrides.login_streak ?? profile?.login_streak ?? 0,
    ),
    accuracy_percent: Number(
      overrides.accuracy_percent ?? profile?.accuracy_percent ?? 0,
    ),
    badge: overrides.badge ?? profile?.badge ?? "Rookie",
    rank_badge: overrides.rank_badge ?? profile?.rank_badge ?? "Rookie",
    badge_inventory:
      overrides.badge_inventory ?? profile?.badge_inventory ?? ["Rookie"],
    predictions_count: Number(
      overrides.predictions_count ?? profile?.predictions_count ?? 0,
    ),
    correct_predictions: Number(
      overrides.correct_predictions ?? profile?.correct_predictions ?? 0,
    ),
  };
}

function formatRankLabel(rank) {
  if (!rank) return "Unranked";
  return `#${rank}`;
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() || "").join("");
  return initials || "DR";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function prepareProfileImage(file) {
  if (!file) return "";
  if (!file.type?.startsWith("image/")) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5 MB.");
  }

  const sourceUrl = await readFileAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image."));
    img.src = sourceUrl;
  });

  const canvas = document.createElement("canvas");
  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not available.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function createProfileUiState(session) {
  return {
    session,
    displayNameDraft: session.displayName || "",
    favoriteTeamDraft: "",
    hasEditedDisplayName: false,
    isEditingDisplayName: false,
    hasEditedFavoriteTeam: false,
    isEditingFavoriteTeam: false,
  };
}

function profileUiReducer(state, action) {
  switch (action.type) {
    case "setSession":
      return {
        ...createProfileUiState(action.payload),
      };
    case "setDisplayNameDraft":
      return {
        ...state,
        displayNameDraft: action.payload,
        hasEditedDisplayName: true,
        isEditingDisplayName: true,
      };
    case "startDisplayNameEdit":
      return {
        ...state,
        displayNameDraft: action.payload,
        hasEditedDisplayName: false,
        isEditingDisplayName: true,
      };
    case "cancelDisplayNameEdit":
      return {
        ...state,
        displayNameDraft: action.payload,
        hasEditedDisplayName: false,
        isEditingDisplayName: false,
      };
    case "setFavoriteTeamDraft":
      return {
        ...state,
        favoriteTeamDraft: action.payload,
        hasEditedFavoriteTeam: true,
        isEditingFavoriteTeam: true,
      };
    case "startFavoriteTeamEdit":
      return {
        ...state,
        favoriteTeamDraft: action.payload,
        hasEditedFavoriteTeam: false,
        isEditingFavoriteTeam: true,
      };
    case "cancelFavoriteTeamEdit":
      return {
        ...state,
        favoriteTeamDraft: action.payload,
        hasEditedFavoriteTeam: false,
        isEditingFavoriteTeam: false,
      };
    case "clearSession":
      return createProfileUiState({
        userId: "",
        displayName: "",
        token: "",
      });
    default:
      return state;
  }
}

function ProfileStatCard({ label, value, hint, accent = "orange" }) {
  const accentClasses = {
    orange: "from-[#ff8f6d]/18 via-[#ff8f6d]/10 to-transparent text-[#c85f35]",
    blue: "from-[#7ec8ff]/20 via-[#7ec8ff]/10 to-transparent text-[#3b82c4]",
    gold: "from-[#ffd98d]/22 via-[#ffd98d]/10 to-transparent text-[#b98516]",
    rose: "from-[#ff8a98]/20 via-[#ff8a98]/10 to-transparent text-[#d04b62]",
  };

  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
      <div
        className={`type-kicker inline-flex rounded-full bg-gradient-to-r px-2.5 py-1 ${accentClasses[accent] || accentClasses.orange}`}
      >
        {label}
      </div>
      <p className="type-title-xl mt-4 text-[#11131a]">
        {value}
      </p>
      <p className="type-caption mt-2 text-[#5c6472]">{hint}</p>
    </div>
  );
}

function SectionShell({ eyebrow, title, children, aside }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#e8ddd0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,241,234,0.9))] shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-[#eadfce] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-kicker text-[#8c7763]">
              {eyebrow}
            </p>
            <h2 className="type-title-lg mt-2 text-[#11131a]">
              {title}
            </h2>
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

// eslint-disable-next-line
export default function Profile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const profileImageInputRef = useRef(null);
  const initialSession = useMemo(() => base44.fan.getStoredSession(), []);
  const [profileUiState, dispatchProfileUi] = useReducer(
    profileUiReducer,
    initialSession,
    createProfileUiState,
  );
  const {
    session,
    displayNameDraft,
    hasEditedDisplayName,
    isEditingDisplayName,
    favoriteTeamDraft,
    hasEditedFavoriteTeam,
    isEditingFavoriteTeam,
  } = profileUiState;

  const isJoined = Boolean(session.userId && session.token);

  const { data: teams = [] } = useQuery({
    queryKey: ["profile-teams"],
    queryFn: () => base44.entities.Team.list("name", 250),
    staleTime: 5 * 60 * 1000,
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["profile-fan-profile", session.userId],
    queryFn: () =>
      base44.entities.FanProfile.filter(
        { user_id: session.userId },
        "-updated_date",
        5,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery({
    queryKey: ["profile-fan-predictions", session.userId],
    queryFn: () =>
      base44.entities.FanPrediction.filter(
        { user_id: session.userId },
        "-prediction_date",
        25,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: votes = [] } = useQuery({
    queryKey: ["profile-fan-votes", session.userId],
    queryFn: () =>
      base44.entities.FanPollVote.filter(
        { user_id: session.userId },
        "-created_date",
        50,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["profile-follows", session.userId],
    queryFn: () =>
      base44.entities.FanFollowItem.filter(
        { user_id: session.userId },
        "-created_date",
        80,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: savedMatches = [] } = useQuery({
    queryKey: ["profile-saved-matches", session.userId],
    queryFn: () =>
      base44.entities.SavedMatch.filter(
        { user_id: session.userId },
        "-created_date",
        60,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: fantasySquads = [] } = useQuery({
    queryKey: ["profile-fantasy-squads", session.userId],
    queryFn: () =>
      base44.entities.FantasySquad.filter(
        { user_id: session.userId },
        "-created_date",
        30,
      ),
    enabled: Boolean(session.userId),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["profile-leaderboard"],
    queryFn: () => base44.entities.FanProfile.list("-total_points", 100),
    enabled: isJoined,
  });

  const localProfile = profiles[0] || null;
  const resolvedDisplayNameDraft = hasEditedDisplayName
    ? displayNameDraft
    : (session.displayName || displayNameDraft || "");
  const resolvedFavoriteTeamDraft = hasEditedFavoriteTeam
    ? favoriteTeamDraft
    : (localProfile?.favorite_team || favoriteTeamDraft || "");

  const profileMutation = useMutation({
    mutationFn: async (payload) => {
      if (localProfile?.id) {
        return base44.entities.FanProfile.update(localProfile.id, payload);
      }
      return base44.entities.FanProfile.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-fan-profile", session.userId] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["fan-profiles"] });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const nextName = resolvedDisplayNameDraft.trim() || "BGMI Fan";
      const nextSession = await base44.fan.createSession(nextName);
      const payload = buildProfilePayload(nextSession, null, {
        display_name: nextSession.displayName,
      });
      await base44.entities.FanProfile.create(payload);
      return nextSession;
    },
    onSuccess: (nextSession) => {
      dispatchProfileUi({ type: "setSession", payload: nextSession });
      qc.invalidateQueries({ queryKey: ["profile-fan-profile"] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
      toast({
        title: "Profile activated",
        description: "Your fan profile is ready for matchday.",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not start profile",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const updateDisplayNameMutation = useMutation({
    mutationFn: async () => {
      const nextName = resolvedDisplayNameDraft.trim();
      if (!nextName) throw new Error("Display name cannot be empty.");

      const nextSession = await base44.fan.createSession(nextName);
      const nextPayload = buildProfilePayload(nextSession, localProfile, {
        display_name: nextSession.displayName,
      });
      if (localProfile?.id) {
        await base44.entities.FanProfile.update(localProfile.id, nextPayload);
      } else {
        await base44.entities.FanProfile.create(nextPayload);
      }
      return nextSession;
    },
    onSuccess: (nextSession) => {
      dispatchProfileUi({ type: "setSession", payload: nextSession });
      qc.invalidateQueries({ queryKey: ["profile-fan-profile", nextSession.userId] });
      qc.invalidateQueries({ queryKey: ["topbar-profile-image", nextSession.userId] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
      toast({
        title: "Display name updated",
        description: "Your profile name is now live across the fan pages.",
      });
    },
    onError: (error) => {
      toast({
        title: "Name update failed",
        description: error?.message || "We could not save your display name.",
        variant: "destructive",
      });
    },
  });

  const updateFavoriteTeamMutation = useMutation({
    mutationFn: async (teamName) => {
      if (!session.userId) throw new Error("Join the profile first.");
      const payload = buildProfilePayload(session, localProfile, {
        favorite_team: teamName,
      });
      if (localProfile?.id) {
        return base44.entities.FanProfile.update(localProfile.id, payload);
      }
      return base44.entities.FanProfile.create(payload);
    },
    onSuccess: () => {
      dispatchProfileUi({
        type: "cancelFavoriteTeamEdit",
        payload: resolvedFavoriteTeamDraft,
      });
      qc.invalidateQueries({ queryKey: ["profile-fan-profile", session.userId] });
      qc.invalidateQueries({ queryKey: ["topbar-profile-image", session.userId] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
      toast({
        title: "Favorite team saved",
        description: "Your profile now follows the team you back most.",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not save favorite team",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (profileImage) => {
      if (!session.userId) throw new Error("Join the profile first.");
      const payload = buildProfilePayload(session, localProfile, {
        profile_image: profileImage,
      });
      if (localProfile?.id) {
        return base44.entities.FanProfile.update(localProfile.id, payload);
      }
      return base44.entities.FanProfile.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-fan-profile", session.userId] });
      qc.invalidateQueries({ queryKey: ["profile-leaderboard"] });
      qc.invalidateQueries({ queryKey: ["fan-profiles"] });
      toast({
        title: "Profile image updated",
        description: "Your profile photo is now saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not save profile image",
        description: error?.message || "Please try another image.",
        variant: "destructive",
      });
    },
  });

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const profileImage = await prepareProfileImage(file);
      updateProfileImageMutation.mutate(profileImage);
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error?.message || "Please try another image.",
        variant: "destructive",
      });
    }
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      base44.auth.logout();
      base44.fan.clearSession();
      return {
        userId: "",
        displayName: "",
        token: "",
      };
    },
    onSuccess: async (nextSession) => {
      dispatchProfileUi({ type: "setSession", payload: nextSession });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["auth-me"] }),
        qc.invalidateQueries({ queryKey: ["profile-fan-profile"] }),
        qc.invalidateQueries({ queryKey: ["profile-fan-predictions"] }),
        qc.invalidateQueries({ queryKey: ["profile-fan-votes"] }),
        qc.invalidateQueries({ queryKey: ["profile-leaderboard"] }),
      ]);
      toast({
        title: "Logged out",
        description: "Your profile session has been cleared from this device.",
      });
      navigate("/signin");
    },
  });
  const leaderboardRank = useMemo(() => {
    if (!session.userId) return null;
    const index = leaderboard.findIndex(
      (entry) => entry.user_id === session.userId,
    );
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, session.userId]);

  const profileName = session.displayName || resolvedDisplayNameDraft || "Fan identity";
  const profileBadge = normalizeBadgeName(localProfile?.badge || "Rookie");
  const rankBadge = normalizeBadgeName(localProfile?.rank_badge || profileBadge);
  const badgeInventory = Array.isArray(localProfile?.badge_inventory)
    ? [...new Set(localProfile.badge_inventory.map(normalizeBadgeName))]
    : profileBadge
      ? [profileBadge]
      : [];
  const totalPoints = Number(localProfile?.total_points || 0);
  const xpPoints = Number(localProfile?.xp_points || 0);
  const loginStreak = Number(localProfile?.login_streak || 0);
  const accuracy = Math.round(Number(localProfile?.accuracy_percent || 0));
  const correctPredictions = Number(localProfile?.correct_predictions || 0);
  const totalPredictions =
    Number(localProfile?.predictions_count || 0) || predictions.length;
  const pendingPredictions = predictions.filter(
    (entry) => entry.status !== "settled",
  ).length;
  const settledPredictions = predictions.filter(
    (entry) => entry.status === "settled",
  ).length;

  const profileMood = useMemo(() => {
    if (totalPoints >= 160) return "Legend status";
    if (totalPoints >= 95) return "Top bracket";
    if (totalPoints >= 35) return "Rising profile";
    return "Matchday starter";
  }, [totalPoints]);

  const favoriteOptions = useMemo(
    () =>
      teams
        .flatMap((team) => (team.name ? [team.name] : []))
        .toSorted((a, b) => a.localeCompare(b)),
    [teams],
  );

  const activitySummary = useMemo(
    () => [
      {
        label: "Fan badge",
        value: rankBadge,
        hint: "Current identity tier in the community ladder.",
      },
      {
        label: "Following",
        value: follows.length,
        hint: "Teams and players currently pinned to your profile.",
      },
      {
        label: "Fantasy squads",
        value: fantasySquads.length,
        hint: "Weekly fantasy entries saved to your account layer.",
      },
    ],
    [fantasySquads.length, follows.length, rankBadge],
  );

  const notifications = useMemo(() => {
    const items = [];

    if (leaderboardRank) {
      items.push({
        id: "rank",
        type: "rank",
        title: `You are ${formatRankLabel(leaderboardRank)} on the fan ladder`,
        body: "Your prediction accuracy and community activity are contributing to your live rank.",
        meta: "Leaderboard pulse",
      });
    }

    if (localProfile?.favorite_team) {
      items.push({
        id: "team",
        type: "team",
        title: `${localProfile.favorite_team} is locked as your featured team`,
        body: "This preference shapes your identity card and keeps your support visible.",
        meta: "Profile tuning",
      });
    }

    if (pendingPredictions > 0) {
      items.push({
        id: "prediction-pending",
        type: "prediction",
        title: `${pendingPredictions} live prediction window${
          pendingPredictions > 1 ? "s" : ""
        } still open`,
        body: "Slide into the fan hub before the next lock and finish your calls.",
        meta: "Prediction board",
      });
    }

    if (votes.length > 0) {
      items.push({
        id: "votes",
        type: "poll",
        title: `${votes.length} community vote${votes.length > 1 ? "s" : ""} recorded`,
        body: "Your poll decisions are now shaping the live fan sentiment panel.",
        meta: "Community pulse",
      });
    }

    if (savedMatches.length > 0) {
      items.push({
        id: "saved-matches",
        type: "match",
        title: `${savedMatches.length} saved match${
          savedMatches.length > 1 ? "es" : ""
        } ready to revisit`,
        body: "Your bookmarked match windows are waiting inside the fan layer.",
        meta: "Saved schedule",
      });
    }

    if (fantasySquads.length > 0) {
      items.push({
        id: "fantasy",
        type: "fantasy",
        title: `${fantasySquads.length} fantasy squad${
          fantasySquads.length > 1 ? "s" : ""
        } active`,
        body: "Captain multipliers and weekly ladders now stay linked to your profile.",
        meta: "Fantasy board",
      });
    }

    return items;
  }, [
    fantasySquads.length,
    leaderboardRank,
    localProfile?.favorite_team,
    pendingPredictions,
    savedMatches.length,
    votes.length,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
      {!isJoined ? (
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <SectionShell eyebrow="Join profile" title="Activate your BGMI fan profile">

            <p className="max-w-xl text-sm leading-7 text-[#5c6472]">
              Pick a display name and unlock your fan profile on this device.
              You&apos;ll be able to track predictions, poll activity, and your
              favorite team without going through a full sign-in flow first.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="profile-join-display-name" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#80705f]">
                  Display name
                </label>
                <input
                    id="profile-join-display-name"
                    value={resolvedDisplayNameDraft}
                    onChange={(event) =>
                      dispatchProfileUi({
                        type: "setDisplayNameDraft",
                        payload: event.target.value,
                      })
                    }
                  placeholder="Enter your display name"
                  aria-label="Display name"
                  className="mt-2 h-13 w-full rounded-[20px] border border-[#eadfce] bg-white px-4 text-sm text-[#11131a] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <button
                type="button"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="mt-[1.45rem] inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff8e6c,#ff645f)] px-6 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(255,100,95,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {joinMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Create profile
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[#6a6f78]">
                Want your full account instead?
              </span>
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 font-semibold text-[#11131a] transition hover:text-primary"
              >
                Sign in with Google
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </SectionShell>

          <SectionShell eyebrow="Benefits" title="What your profile unlocks">
            <div className="grid gap-4">
              {[
                {
                  icon: Trophy,
                  title: "Prediction history",
                  body: "Track your winner calls, top-three reads, and settled points from one premium history view.",
                },
                {
                  icon: Bell,
                  title: "Profile updates",
                  body: "See recent profile activity, saved picks, and active tournament touchpoints in one place.",
                },
                {
                  icon: Crosshair,
                  title: "Favorite team",
                  body: "Save your favorite team and keep your profile tied to the side you follow most.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
                      <item.icon className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#11131a]">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-6 text-[#5c6472]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <SectionShell
              eyebrow="Identity control"
              title="Tune your live profile"
              aside={
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ebdfcf] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                    <UserCircle2 className="size-3.5 text-primary" />
                    About
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ebdfcf] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                    <Bell className="size-3.5 text-primary" />
                    Alerts {notifications.length}
                  </div>
                </div>
              }
            >
              <div className="rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#ff8e6c,#ff645f)] text-lg font-black tracking-[0.06em] text-white shadow-[0_16px_32px_rgba(255,100,95,0.2)]">
                      {localProfile?.profile_image ? (
                        <img
                          src={localProfile.profile_image}
                          alt={`${profileName} profile`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          {getInitials(profileName)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                          Live profile
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            dispatchProfileUi({
                              type: "startDisplayNameEdit",
                              payload: profileName,
                            })
                          }
                          className="inline-flex size-7 items-center justify-center rounded-full border border-[#eadfce] bg-[#fffdfa] text-[#8a7866] transition hover:border-[#d8c8b4] hover:text-[#11131a]"
                          aria-label="Edit display name"
                        >
                          <PencilLine className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-[#11131a]">
                        {profileName}
                      </p>
                      <p className="mt-1 text-[12px] text-[#5c6472]">
                        {`${profileMood} | ${profileBadge} tier`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          ref={profileImageInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={handleProfileImageChange}
                        />
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          disabled={updateProfileImageMutation.isPending}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffdfa] px-3 text-xs font-semibold text-[#11131a] transition hover:border-[#d8c8b4] hover:bg-[#fbf7f1] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updateProfileImageMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="size-3.5 text-primary" />
                          )}
                          {localProfile?.profile_image ? "Change image" : "Upload image"}
                        </button>
                        {localProfile?.profile_image ? (
                          <button
                            type="button"
                            onClick={() => updateProfileImageMutation.mutate("")}
                            disabled={updateProfileImageMutation.isPending}
                            className="inline-flex h-9 items-center rounded-full border border-[#eadfce] bg-white px-3 text-xs font-semibold text-[#8a7866] transition hover:border-[#d8c8b4] hover:text-[#11131a] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] bg-[#f8f2ec] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                        Rank
                      </p>
                      <p className="mt-2 text-[1.45rem] font-black tracking-[-0.05em] text-[#11131a]">
                        {formatRankLabel(leaderboardRank)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[#f8f2ec] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                        Correct
                      </p>
                      <p className="mt-2 text-[1.45rem] font-black tracking-[-0.05em] text-[#11131a]">
                        {correctPredictions}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-[#f8f2ec] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                          Favorite team
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            dispatchProfileUi({
                              type: "startFavoriteTeamEdit",
                              payload: localProfile?.favorite_team || "",
                            })
                          }
                          className="inline-flex size-7 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[#8a7866] transition hover:border-[#d8c8b4] hover:text-[#11131a]"
                          aria-label="Edit favorite team"
                        >
                          <PencilLine className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 truncate text-[1rem] font-semibold tracking-[-0.03em] text-[#11131a]">
                        {localProfile?.favorite_team || "Unclaimed"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] bg-[#fff7ef] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a7866]">
                      Badges
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {badgeInventory.length > 0 ? (
                        badgeInventory.map((badge) => (
                          <div
                            key={badge}
                            className="rounded-[22px] border border-[#eadfce] bg-white px-3 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                          >
                            <FanBadgeEmblem badge={badge} compact />
                          </div>
                        ))
                      ) : (
                        <p className="col-span-full text-sm text-[#5c6472]">
                          Your badges will appear here as you stay active across predictions, follows, and fantasy entries.
                        </p>
                      )}
                    </div>
                  </div>
              </div>

              {isEditingDisplayName ? (
                <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                  <label htmlFor="profile-display-name" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#80705f]">
                    Edit display name
                  </label>
                  <input
                    id="profile-display-name"
                    value={resolvedDisplayNameDraft}
                    onChange={(event) =>
                      dispatchProfileUi({
                        type: "setDisplayNameDraft",
                        payload: event.target.value,
                      })
                    }
                    aria-label="Display name"
                    className="mt-2 h-13 w-full rounded-[20px] border border-[#eadfce] bg-white px-4 text-sm text-[#11131a] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => updateDisplayNameMutation.mutate()}
                      disabled={updateDisplayNameMutation.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#11131a] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1d26] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updateDisplayNameMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <PencilLine className="size-4" />
                      )}
                      Save name
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchProfileUi({
                          type: "cancelDisplayNameEdit",
                          payload: profileName,
                        })
                      }
                      disabled={updateDisplayNameMutation.isPending}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 text-sm font-semibold text-[#11131a] transition hover:border-[#d8c8b4] hover:bg-[#fbf7f1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {isEditingFavoriteTeam ? (
                <div className="mt-5 rounded-[24px] border border-[#eadfce] bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
                  <label htmlFor="profile-favorite-team" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#80705f]">
                    Choose favorite team
                  </label>
                  <select
                    id="profile-favorite-team"
                    value={resolvedFavoriteTeamDraft}
                    onChange={(event) =>
                      dispatchProfileUi({
                        type: "setFavoriteTeamDraft",
                        payload: event.target.value,
                      })
                    }
                    aria-label="Favorite team"
                    className="mt-2 h-13 w-full rounded-[20px] border border-[#eadfce] bg-white px-4 text-sm text-[#11131a] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Select your team</option>
                    {favoriteOptions.map((teamName) => (
                      <option key={teamName} value={teamName}>
                        {teamName}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateFavoriteTeamMutation.mutate(resolvedFavoriteTeamDraft)
                      }
                      disabled={updateFavoriteTeamMutation.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#11131a] px-4 text-sm font-semibold text-white transition hover:bg-[#1a1d26] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updateFavoriteTeamMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )}
                      Save team
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchProfileUi({
                          type: "cancelFavoriteTeamEdit",
                          payload: localProfile?.favorite_team || "",
                        })
                      }
                      disabled={updateFavoriteTeamMutation.isPending}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 text-sm font-semibold text-[#11131a] transition hover:border-[#d8c8b4] hover:bg-[#fbf7f1] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  Log out
                </button>
              </div>
            </SectionShell>

            <div className="grid gap-6">
              <SectionShell eyebrow="Performance" title="Your matchday numbers">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Trophy className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                        Predictions
                      </p>
                    </div>
                    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-[-0.06em] text-[#11131a]">
                      {totalPredictions}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#5c6472]">
                      {pendingPredictions} pending and {settledPredictions} settled.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Star className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                        Accuracy
                      </p>
                    </div>
                    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-[-0.06em] text-[#11131a]">
                      {accuracy}%
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#5c6472]">
                      {correctPredictions} correct outcomes locked into your profile.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                        XP + Streak
                      </p>
                    </div>
                    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-[-0.06em] text-[#11131a]">
                      {xpPoints}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#5c6472]">
                      {loginStreak} day streak and {rankBadge} tier active.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <ShieldCheck className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                        Follows
                      </p>
                    </div>
                    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-[-0.06em] text-[#11131a]">
                      {follows.length}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#5c6472]">
                      {follows.filter((entry) => entry.target_type === "team").length} teams and {follows.filter((entry) => entry.target_type === "player").length} players followed.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Bell className="size-4" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7866]">
                        Saved activity
                      </p>
                    </div>
                    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-[-0.06em] text-[#11131a]">
                      {savedMatches.length + fantasySquads.length}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#5c6472]">
                      {savedMatches.length} saved matches and {fantasySquads.length} fantasy squads.
                    </p>
                  </div>
                </div>
              </SectionShell>

            </div>
          </section>

          <section className="grid gap-6">
            <FanPredictionHistory predictions={predictions} />
          </section>
        </>
      )}

      {(profilesLoading || predictionsLoading) && isJoined ? (
        <div className="flex items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#d9ccbb] bg-[rgba(255,255,255,0.75)] p-4 text-sm text-[#5c6472]">
          <Loader2 className="size-4 animate-spin" />
          Syncing your latest profile details…
        </div>
      ) : null}
    </div>
  );
}
