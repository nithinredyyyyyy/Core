import { usePlayerProfileData } from "@/components/players/hooks/usePlayerProfileData";

export function usePlayerProfileModel() {
  const {
    careerTeams,
    currentTournament,
    currentTournamentStageFocus,
    displayIgn,
    isLoading,
    resolved,
    resultYears,
    primaryStats,
    secondaryStats,
    searchParams,
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
