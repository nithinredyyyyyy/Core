const ORGANIZATION_ALIAS_MAP = {
  godlike: "godlikeesports",
  godlikeesports: "godlikeesports",
  heroxtremegodlike: "godlikeesports",
  heroxtremegodlikeesports: "godlikeesports",

  godsreign: "godsreign",
  gladiatorsesports: "gladiatorsesports",

  "8bitxcsesports": "8bit",
  "8bit": "8bit",

  aryanxtmggaming: "teamaryan",
  teamax: "teamaryan",
  teamaryan: "teamaryan",

  nsredforce: "nongshimredforce",
  nongshimredforce: "nongshimredforce",
  nongshimredforceesports: "nongshimredforce",

  thwxnonxesports: "nonxesports",
  nonxesports: "nonxesports",

  teamxspark: "revenantxspark",
  revenantesports: "revenantxspark",
  revenantxspark: "revenantxspark",

  orangutan: "orangutan",

  soul: "teamsoul",
  teamsoul: "teamsoul",

  truerippersxinfinix: "truerippers",
  infinixtruerippers: "truerippers",
  truerippers: "truerippers",

  dpluskia: "dplus",
  dplus: "dplus",

  mysterious4esports: "mysterious4",
  mysterious4: "mysterious4",

  madkings: "madkingsesports",
  madkingsesports: "madkingsesports",
  troytamilanesports: "troytamilianesports",
  troytamilans: "troytamilianesports",
  troytamilansesports: "troytamilianesports",
  troytamilianesports: "troytamilianesports",

  k9esports: "k9esports",
  cincinnatikids: "cincinnatikids",

  infernosquad: "risingesports",
  hailinfernosquad: "risingesports",
  risingesports: "risingesports",
  rse: "risingesports",
  rie: "risingesports",

  versatileesports: "teamversatile",
  teamversatile: "teamversatile",

  "4everxredxross": "teamredxross",
  "4everesports": "teamredxross",
  redxross: "teamredxross",
  teamredxross: "teamredxross",

  teaminsaneesports: "teaminsane",
  teaminsane: "teaminsane",

  loshermanos: "loshermanosesports",
  loshermanosesports: "loshermanosesports",

  learnfrompast: "learnfrompast",
  hadesh4k: "teamh4k",
  teamtamilas: "teamtamilas",
  teamtamillas: "teamtamilas",
  godscentesports: "godsentesports",
  godsentesports: "godsentesports",
  godsentlegions: "godsentlegions",
  reckoningesports: "reckoningesports",
  apexgaming: "teamapexgaming",
  teamapexgaming: "teamapexgaming",
  teamvanguard: "teamvanguard",
  t7xorionesports: "t7xorionesports",
  genxfmesports: "genxfmesports",
  genxfm: "genxfmesports",
  likithaesports: "likithaesports",
  rapidchaosesports: "rapidchaosesports",
  higgboson: "higgbosonesports",
  higgbosonesports: "higgbosonesports",
  esportsocial: "esportsocial",
  esportssocial: "esportsocial",
  quantumsparks: "quantumsparks",
  jaapiesports: "jaapiesports",
  teamdoxy: "teamdoxy",
  someonesdream: "someonesdream",
  zeroarkofficial: "zeroarkofficial",
  santaesp: "santaesports",
  santaesports: "santaesports",
  thundergodsxtortugagaming: "thundergodsxtortugagaming",
  thundergodstortugagaming: "thundergodsxtortugagaming",
  thundergodsesports: "thundergodsxtortugagaming",
  divinegaming: "divinegaming",
  blinkesports: "blinkesports",
  jaguaresports: "jaguaresports",
  windgodesports: "windgodesports",
  naqshesports: "naqshesports",
  m4xnaqshesports: "naqshesports",
  riotnationz: "riotnationz",
  riotnations: "riotnationz",
  hadxesports: "hadxesports",
  hadx: "hadxesports",
  lastadeesports: "lastadeesports",
  sevengodsesports: "7godsesports",
  "7godsesports": "7godsesports",
  auraxesports: "auraxesports",
  auraxesport: "auraxesports",
  aresesport: "aresesport",
  aresesports: "aresesport",
  oopsofficial: "oopsofficial",
};

const ORGANIZATION_CANONICAL = {
  orangutan: { name: "Orangutan", tag: "OG" },
  teamaryan: { name: "Team Aryan", tag: "AX" },
  teamsoul: { name: "Team Soul", tag: "SOUL" },
  truerippers: { name: "True Rippers", tag: "TR" },
  dplus: { name: "Dplus", tag: "DK" },
  nonxesports: { name: "NoNx Esports", tag: "NONX" },
  nongshimredforce: { name: "Nongshim RedForce", tag: "NSR" },
  mysterious4: { name: "Mysterious 4", tag: "M4" },
  madkingsesports: { name: "Madkings Esports", tag: "MAD" },
  cincinnatikids: { name: "Cincinnati Kids", tag: "CK" },
  godlikeesports: { name: "GodLike Esports", tag: "GODL" },
  gladiatorsesports: { name: "Gladiators Esports", tag: "GDR" },
  godsreign: { name: "Gods Reign", tag: "GDR" },
  revenantxspark: { name: "Revenant XSpark", tag: "RNTX" },
  teamversatile: { name: "Team Versatile", tag: "TV" },
  teamredxross: { name: "Team RedXRoss", tag: "RRX" },
  teaminsane: { name: "Team Insane", tag: "INSANE" },
  loshermanosesports: { name: "Los Hermanos Esports", tag: "LHS" },
  risingesports: { name: "Rising Esports", tag: "RIE" },
  learnfrompast: { name: "Learn From Past", tag: "LEFP" },
  teamtamilas: { name: "Team Tamilas", tag: "TT" },
  godsentesports: { name: "Godsent Esports", tag: "GSE" },
  godsentlegions: { name: "Godsent Legions", tag: "GSL" },
  troytamilianesports: { name: "Troy Tamilian Esports", tag: "TTE" },
  reckoningesports: { name: "Reckoning Esports", tag: "RGE" },
  teamapexgaming: { name: "Team Apex Gaming", tag: "TAG" },
  teamvanguard: { name: "Team Vanguard", tag: "TVG" },
  t7xorionesports: { name: "T7xOrion Esports", tag: "T7O" },
  genxfmesports: { name: "GenXFM Esports", tag: "GFM" },
  likithaesports: { name: "Likitha Esports", tag: "LIK" },
  rapidchaosesports: { name: "Rapid Chaos Esports", tag: "RCE" },
  higgbosonesports: { name: "Higgboson Esports", tag: "HGB" },
  esportsocial: { name: "Esport Social", tag: "ES" },
  quantumsparks: { name: "Quantum Sparks", tag: "QS" },
  jaapiesports: { name: "Jaapi Esports", tag: "JE" },
  teamdoxy: { name: "Team Doxy", tag: "DOXY" },
  someonesdream: { name: "SomeOnes Dream", tag: "SOD" },
  zeroarkofficial: { name: "Zero Ark Official", tag: "ZAO" },
  santaesports: { name: "Santa Esports", tag: "SANTA" },
  thundergodsxtortugagaming: { name: "ThunderGods X Tortuga Gaming", tag: "TDR" },
  divinegaming: { name: "Divine Gaming", tag: "DIV" },
  blinkesports: { name: "Blink Esports", tag: "BLINK" },
  jaguaresports: { name: "Jaguar Esports", tag: "JAG" },
  windgodesports: { name: "WindGod Esports", tag: "WG" },
  naqshesports: { name: "Naqsh Esports", tag: "NQ" },
  riotnationz: { name: "Riot Nationz", tag: "RN" },
  hadxesports: { name: "HADX Esports", tag: "HADX" },
  lastadeesports: { name: "Lastade Esports", tag: "LST" },
  "7godsesports": { name: "7Gods Esports", tag: "7G" },
  auraxesports: { name: "Aura X Esports", tag: "AURAX" },
  aresesport: { name: "Ares Esport", tag: "ARES" },
  oopsofficial: { name: "Oops Official", tag: "OOPS" },
  teamh4k: { name: "Team H4K", tag: "H4K" },
  k9esports: { name: "K9 Esports", tag: "K9" },
  "8bit": { name: "8Bit", tag: "8BIT" },
};

export function normalizeOrganizationName(teamName) {
  const compact = (teamName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const withoutTitleSponsors = compact.replace(/^(iqoo|oneplus|heroxtreme|infinix)+/g, "");

  return ORGANIZATION_ALIAS_MAP[withoutTitleSponsors] || withoutTitleSponsors;
}

export function getOrganizationMeta(teamLike) {
  const rawName = typeof teamLike === "string" ? teamLike : teamLike?.name;
  const normalized = normalizeOrganizationName(rawName);
  const liveTag = typeof teamLike === "string" ? null : teamLike?.tag;

  const override = ORGANIZATION_CANONICAL[normalized];
  if (override) {
    return {
      key: normalized,
      name: override.name,
      tag: liveTag || override.tag,
    };
  }

  return {
    key: normalized || teamLike?.id || "unknown",
    name: rawName || "Unknown",
    tag: typeof teamLike === "string" ? "---" : teamLike?.tag || "---",
  };
}

const INACTIVE_ORGANIZATION_NAMES = [
  "Blind esports",
  "Gladiators esports",
  "Medal esports",
  "FS esports",
  "Big Brother esports",
  "Numen Esports",
  "GlitchXReborn",
  "TWM Gaming",
  "TWOB",
  "Team Limra",
  "Cincinnati Kids",
  "4Merical Esports",
  "Hydra",
  "Venom Gaming",
  "Eagle Owls",
  "Gods Omen",
  "Team Forever",
  "Raven Esports",
  "Team Together Esports",
  "MICI Esports",
  "Team Bliss",
  "Team Aaru",
  "Entity Gaming",
  "Growing Strong",
  "Global Esports",
  "OR Esports",
  "Midwave Esports",
  "4 Aggressive Man",
  "Team Eggy",
  "Hyderabad Hydras",
  "MOGO Esports",
  "Rivalry NRI",
  "Silly Esports",
  "Carnival Gaming",
  "Team Psyche",
  "Night Owls",
  "CS Esports",
  "Ignite Gaming",
  "H4K",
  "Hades H4K",
];

const HIDDEN_ORGANIZATION_NAMES = [
  "iQOO SouL",
  "Team SouL",
  "Team Soul",
];

const INACTIVE_ORGANIZATION_KEYS = new Set(
  INACTIVE_ORGANIZATION_NAMES
    .map((name) => normalizeOrganizationName(name))
    .filter((key) => key !== "teamredxross")
);

const HIDDEN_ORGANIZATION_KEYS = new Set(
  HIDDEN_ORGANIZATION_NAMES.map((name) => normalizeOrganizationName(name))
);

export function isOrganizationInactive(teamLike) {
  const rawName = typeof teamLike === "string" ? teamLike : teamLike?.name;
  return INACTIVE_ORGANIZATION_KEYS.has(normalizeOrganizationName(rawName));
}

export function isOrganizationHidden(teamLike) {
  const rawName = typeof teamLike === "string" ? teamLike : teamLike?.name;
  return HIDDEN_ORGANIZATION_KEYS.has(normalizeOrganizationName(rawName));
}
