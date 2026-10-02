import { Megaphone, UserCircle2, Trophy } from "lucide-react";

export const MINI_PREVIEW_ACCENT_CLASSES = {
  mint: "bg-brand-mint-mist text-brand-mint-deep",
  peach: "bg-brand-gold-melon text-brand-coral-cocoa",
  ink: "bg-brand-gray-100 text-brand-ink-pure",
};

export const LANDING_FEATURE_CARDS = [
  {
    icon: Trophy,
    title: "Tournament control",
    body:
      "Stages, boards, participants, prize flow, and schedule windows in one clean operational layer.",
  },
  {
    icon: Megaphone,
    title: "Community energy",
    body:
      "Retention-ready engagement features can live inside the product without turning the public site into a cluttered hub.",
  },
  {
    icon: UserCircle2,
    title: "Admin sign in",
    body:
      "Google admin sign-in keeps tournament, team, and standings controls in one clean route.",
  },
];
