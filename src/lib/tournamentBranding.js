const TOURNAMENT_LOGOS = {
  "Battlegrounds Mobile India Series 2026": "/images/bgis-logo.png",
  "Battlegrounds Mobile India Series 2023": "/images/bgis-2023.png",
  "Battlegrounds Mobile India Series 2024": "/images/bgis-2024.png",
  "Battlegrounds Mobile India Series 2025": "/images/bgis-2025.png",
  "India - Korea Invitational": "/images/in-kr.png",
  "Battlegrounds Mobile India Showdown 2025": "/images/bmsd-2025.png",
  "Battlegrounds Mobile India International Cup 2025": "/images/bmic-2025.png",
  "Battlegrounds Mobile India Pro Series 2023": "/images/bmps-2023.png",
  "Battlegrounds Mobile India Pro Series 2024": "/images/bmps-2024.png",
  "Battlegrounds Mobile India Pro Series 2025": "/images/bmps-2025.png",
  "Battlegrounds Mobile India Pro Series 2026": "/images/bmps-2026.png",
};

export function getTournamentLogo(tournament) {
  if (!tournament?.name) return null;
  return TOURNAMENT_LOGOS[tournament.name] || null;
}
