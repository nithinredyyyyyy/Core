import { usePlayerProfileData } from "@/components/players/hooks/usePlayerProfileData";

export function usePlayerProfileModel() {
  const {
    careerTeams,
    currentTournament,
    currentTournamentStageFocus,
    displayIgn,
    isLoading,
    error,
    resolved,
    resultYears,
    primaryStats,
    secondaryStats,
    teamLogo,
    teamLogoSurfaceTone,
    teamName,
    teamTag,
    playerPhoto,
  } = usePlayerProfileData();

  return {
    careerTeams,
    currentTournament,
    currentTournamentStageFocus,
    displayIgn,
    isLoading,
    error,
    playerPhoto,
    primaryStats,
    resolved,
    resultYears,
    secondaryStats,
    teamLogo,
    teamLogoSurfaceTone,
    teamName,
    teamTag,
  };
}
