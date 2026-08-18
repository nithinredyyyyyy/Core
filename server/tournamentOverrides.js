const PMWC_2026_GROUP_A = "Group Stage - Group A";
const PMWC_2026_GROUP_B = "Group Stage - Group B";

export const BMPS_2026_PRIZE_BREAKDOWN = [
  ["1st", "GodLike Esports", "10,000,000", "PMWC"],
  ["2nd", "Divine Gaming", "6,000,000", "-"],
  ["3rd", "Victores Sumus", "4,000,000", "-"],
  ["4th", "Gods Reign", "3,000,000", "-"],
  ["5th", "Team Apex Gaming", "2,500,000", "-"],
  ["6th", "Orangutan", "1,800,000", "-"],
  ["7th", "Team Tamilas", "1,500,000", "-"],
  ["8th", "Vasista Esports", "1,450,000", "-"],
  ["9th", "Reckoning Esports", "1,000,000", "-"],
  ["10th", "Nebula Esports", "1,000,000", "-"],
  ["11th", "8Bit", "800,000", "-"],
  ["12th", "Genesis Esports", "800,000", "-"],
  ["13th", "Team SouL", "600,000", "-"],
  ["14th", "7Gods Esports", "600,000", "-"],
  ["15th", "Revenant XSpark", "500,000", "-"],
  ["16th", "Myth Official", "500,000", "-"],
  ["17th", "Autobotz Esports", "250,000", "-"],
  ["18th", "Rapid Chaos Esports", "250,000", "-"],
  ["19th", "Zero Ark Official", "250,000", "-"],
  ["20th", "WindGod Esports", "250,000", "-"],
  ["21st", "Lastade Esports", "200,000", "-"],
  ["22nd", "4TR Official", "200,000", "-"],
  ["23rd", "Higgboson Esports", "200,000", "-"],
  ["24th", "Meta Ninza", "200,000", "-"],
  ["25th", "True Rippers", "150,000", "-"],
  ["26th", "Welt Esports", "150,000", "-"],
  ["27th", "Wyld Fangs", "150,000", "-"],
  ["28th", "Team Aryan", "150,000", "-"],
  ["29th", "MYSTERIOUS 4", "150,000", "-"],
  ["30th", "Rising Esports", "150,000", "-"],
  ["31st", "Team Versatile", "150,000", "-"],
  ["32nd", "White Walkers", "150,000", "-"],
].map(([placement, team, inr, qualifiesTo]) => ({
  placement,
  team,
  inr,
  qualifiesTo,
}));

export const PMWC_2026_PRIZE_BREAKDOWN = [
  ["Grand Final", "1st", "500,000"],
  ["Grand Final", "2nd", "250,000"],
  ["Grand Final", "3rd", "150,000"],
  ["Grand Final", "4th", "120,000"],
  ["Grand Final", "5th", "100,000"],
  ["Grand Final", "6th", "90,000"],
  ["Grand Final", "7th", "80,000"],
  ["Grand Final", "8th", "70,000"],
  ["Grand Final", "9th", "60,000"],
  ["Grand Final", "10th", "55,000"],
  ["Grand Final", "11th", "50,000"],
  ["Grand Final", "12th", "45,000"],
  ["Grand Final", "13th", "40,000"],
  ["Grand Final", "14th", "35,000"],
  ["Grand Final", "15th", "30,000"],
  ["Grand Final", "16th", "25,000"],
  ["Survival Stage", "1st", "17,000"],
  ["Survival Stage", "2nd", "16,000"],
  ["Survival Stage", "3rd", "15,000"],
  ["Survival Stage", "4th", "14,000"],
  ["Survival Stage", "5th", "13,000"],
  ["Survival Stage", "6th", "12,000"],
  ["Survival Stage", "7th", "11,000"],
  ["Survival Stage", "8th", "10,000"],
  ["Survival Stage", "9th", "9,000"],
  ["Survival Stage", "10th", "8,000"],
  ["Survival Stage", "11th", "7,000"],
  ["Survival Stage", "12th", "6,000"],
  ["Survival Stage", "13th", "5,000"],
  ["Survival Stage", "14th", "4,000"],
  ["Survival Stage", "15th", "3,000"],
  ["Survival Stage", "16th", "2,000"],
  ["Group Stage (per group)", "1st", "71,000"],
  ["Group Stage (per group)", "2nd", "65,000"],
  ["Group Stage (per group)", "3rd", "60,000"],
  ["Group Stage (per group)", "4th", "57,500"],
  ["Group Stage (per group)", "5th", "55,000"],
  ["Group Stage (per group)", "6th", "29,000"],
  ["Group Stage (per group)", "7th", "28,000"],
  ["Group Stage (per group)", "8th", "27,000"],
  ["Group Stage (per group)", "9th", "26,000"],
  ["Group Stage (per group)", "10th", "25,000"],
  ["Group Stage (per group)", "11th", "24,000"],
  ["Group Stage (per group)", "12th", "23,000"],
  ["Group Stage (per group)", "13th", "22,000"],
  ["Group Stage (per group)", "14th", "21,000"],
  ["Group Stage (per group)", "15th", "20,500"],
  ["Group Stage (per group)", "16th", "20,000"],
].map(([stage, placement, usd]) => ({
  placement,
  team: "TBD",
  stage,
  usd,
}));

export const PMWC_2026_PARTICIPANTS = [
  // Group A (16 teams)
  [PMWC_2026_GROUP_A, "AG.AL International", "2026 PEL Points", "1st", ["Lyu", "仙崽", "FlowerH", "子枫", "司马光"]],
  [PMWC_2026_GROUP_A, "ThunderTalk Gaming", "2026 PEL Points", "3rd", ["Ajay", "Xing", "SiTing", "北陌", "清醒", "Jimmy"]],
  [PMWC_2026_GROUP_A, "XForce Rejects", "Africa Points", "1st", ["Reverb", "Shiva", "Baby", "Devil", "Kuza"]],
  [PMWC_2026_GROUP_A, "FURIA Esports", "Americas Points", "1st", ["Higor", "Silenceee", "Ayala", "Chieff"]],
  [PMWC_2026_GROUP_A, "Aurora Gaming", "EECA Points", "1st", ["DOK", "REFUS", "TOP", "Zyol", "EAST"]],
  [PMWC_2026_GROUP_A, "GOAT Team", "EECA Points", "2nd", ["AYATO", "FORCE", "Focus", "MOXXXYY", "SAYREX"]],
  [PMWC_2026_GROUP_A, "Kiwoom DRX", "Invited", "Invited", ["Qxzzz", "BINI", "Hoxy", "TRE", "Bigfafa"]],
  [PMWC_2026_GROUP_A, "Orangutan", "KIE Leaderboard", "1st", ["AKop", "WizzGOD", "Aaru", "Attanki"]],
  [PMWC_2026_GROUP_A, "AlUla Club Esports", "MENA Points", "1st", ["Quick", "KLAWSINHO", "Y4SR", "R3B", "Khattab"]],
  [PMWC_2026_GROUP_A, "Geekay Esports", "MENA Points", "4th", ["EZ4BADBOY", "KEVIN", "RAGNARoK", "SAFG", "Saleh Nasser Al-Qahtani"]],
  [PMWC_2026_GROUP_A, "Nigma Galaxy", "MENA Points", "2nd", ["4YDO", "LORD", "RAOUF", "SaTaN"]],
  [PMWC_2026_GROUP_A, "4thrives Esports", "South Asia Points", "1st", ["FALAK", "Huzaifa", "Nocki", "T24 OP"]],
  [PMWC_2026_GROUP_A, "RRQ RYU", "Southeast Asia Points", "3rd", ["Nerpehko", "GenFos", "Lapar", "Firen"]],
  [PMWC_2026_GROUP_A, "Team Flash", "Southeast Asia Points", "1st", ["Bowz", "Zhius", "Topz", "Win"]],
  [PMWC_2026_GROUP_A, "Gaming Stars Esports", "Türkiye Points", "2nd", ["Lation", "Mani4c", "Rolex20", "Yuseph", "Swash"]],
  [PMWC_2026_GROUP_A, "ULF Esports", "Türkiye Points", "1st", ["Kecth", "Scarface", "Eren7", "Soulless", "Calse"]],
  // Group B (16 teams)
  [PMWC_2026_GROUP_B, "Yangon Galacticos", "2025 PMWC Champion", "Invited", ["Smile", "Marnett", "Romeo", "SAYCLOUD"]],
  [PMWC_2026_GROUP_B, "Tianba", "2026 PEL Points", "2nd", ["Qzz", "Eagle", "Aching", "MiLu", "浅唱"]],
  [PMWC_2026_GROUP_B, "Alpha7 Esports", "Americas Points", "3rd", ["Carrilho", "Guizão", "Revo", "Obscure", "Nouthz"]],
  [PMWC_2026_GROUP_B, "Wolves Esports", "Americas Points", "2nd", ["SLONIK", "Baton", "Lmntrixxx", "NCSSRY"]],
  [PMWC_2026_GROUP_B, "GodLike Esports", "BMPS 2026", "1st", ["ADMINO", "Manya", "Spower", "Godz", "Saumay"]],
  [PMWC_2026_GROUP_B, "TT Project", "EECA Points", "3rd", ["NEOZ", "EFFYIS", "EFFECT", "ZERYCH"]],
  [PMWC_2026_GROUP_B, "DOPENESS", "Japan League", "1st", ["KenG", "Lufa", "MIT1KA", "SpiCa"]],
  [PMWC_2026_GROUP_B, "721 Esports", "MENA Points", "3rd", ["ALEKO", "MALIK", "Masko", "Rehan", "ZORO"]],
  [PMWC_2026_GROUP_B, "ETSH Esports", "MENA Points", "5th", ["Apkrino", "NASSER", "FAHiTA", "Speedoo"]],
  [PMWC_2026_GROUP_B, "Nongshim RedForce", "Pro Series Korea 2026", "1st", ["SOEZ", "XZY", "TIZ1", "HYUNBIN", "DokC"]],
  [PMWC_2026_GROUP_B, "Horaa Esports", "South Asia Points", "2nd", ["JiGGL3", "SkY", "NoFear", "SleepY"]],
  [PMWC_2026_GROUP_B, "Bigetron by Vitality", "Southeast Asia Points", "4th", ["Reizy", "FEDERALES", "Reyzak", "Axel", "V3xxy", "Ryzen"]],
  [PMWC_2026_GROUP_B, "eArena", "Southeast Asia Points", "2nd", ["MORMAN", "Jowker", "TernyK", "SchwepXz"]],
  [PMWC_2026_GROUP_B, "IDA Esports", "Türkiye Points", "4th", ["Rita", "Darkin", "Emre7", "Swajn"]],
  [PMWC_2026_GROUP_B, "S2G Esports", "Türkiye Points", "3rd", ["Solkay", "HamsiG", "Kamikaze", "Lost"]],
  [PMWC_2026_GROUP_B, "Hustler Crew", "Western Europe Points", "1st", ["AaZzMmm", "Loco", "KAL3Y", "JMSON"]],
].map(([phase, team, qualification, seed, players], index) => ({
  placement: index + 1,
  team,
  phase,
  qualification,
  seed,
  players,
}));

function normalizePlacement(value) {
  const number = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(number) ? number : 999;
}

export function applyTournamentReadOverrides(tournament) {
  if (!tournament?.name) return tournament;

  if (tournament.name === "PUBG Mobile World Cup 2026") {
    const pmwcStages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          if (!Array.isArray(stage.standings)) return stage;
          
          let groupCounters = {};
          
          return {
            ...stage,
            standings: stage.standings.map((entry) => {
              let pos = normalizePlacement(entry.placement);
              let outcome = entry.outcome || entry.progression_status || null;
              
              if (stage.name === "Group Stage") {
                const participant = PMWC_2026_PARTICIPANTS.find(p => p.team === entry.team || p.team === entry.fullTeam);
                const group = participant ? participant.phase : "Unknown";
                groupCounters[group] = (groupCounters[group] || 0) + 1;
                pos = groupCounters[group];
                
                if (pos >= 1 && pos <= 5) outcome = "Advances to Grand Finals";
                else if (pos >= 6 && pos <= 13) outcome = "Advances to Survival Stage";
                else if (pos >= 14) outcome = "Eliminated";

                return { ...entry, outcome, progression_status: outcome, group: group.replace("Group Stage - ", ""), grp: group.replace("Group Stage - ", "") };
              } else if (stage.name === "Survival Stage") {
                if (pos >= 1 && pos <= 6) outcome = "Advances to Grand Finals";
                else if (pos >= 7) outcome = "Eliminated";
              } else if (stage.name === "Grand Finals") {
                if (pos === 1) outcome = "Champion";
                else if (pos === 2) outcome = "Runner-up";
                else if (pos === 3) outcome = "3rd Place";
              }
              
              return { ...entry, outcome, progression_status: outcome };
            }),
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,025,000",
      banner_url: "/images/pubg-mobile-world-cup-2026.webp",
      participants: PMWC_2026_PARTICIPANTS,
      max_teams: 32,
      stages: pmwcStages,
    };
  }

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
    const stages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          return {
            ...stage,
            status: "completed",
            standings:
              stage?.name === "Grand Finals" && Array.isArray(stage.standings)
                ? stage.standings.map((entry) =>
                    normalizePlacement(entry?.placement) === 1
                      ? { ...entry, team: "GodLike Esports", fullTeam: "GodLike Esports" }
                      : entry,
                  )
                : stage.standings,
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      status: "completed",
      prize_pool: "₹40,000,000 INR (≃ $424,041 USD)",
      prize_breakdown: BMPS_2026_PRIZE_BREAKDOWN,
      stages,
    };
  }

  return tournament;
}
