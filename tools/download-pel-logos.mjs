const teams = [
  { name: "weibo-gaming", url: "https://liquipedia.net/commons/images/thumb/4/48/Weibo_Gaming_full_lightmode.png/600px-Weibo_Gaming_full_lightmode.png" },
  { name: "thundertalk-gaming", url: "https://liquipedia.net/commons/images/thumb/f/fe/ThunderTalk_Gaming_logo.png/600px-ThunderTalk_Gaming_logo.png" },
  { name: "tianba", url: "https://liquipedia.net/commons/images/thumb/8/8b/Tianba_logo.png/600px-Tianba_logo.png" },
  { name: "all-gamers", url: "https://liquipedia.net/commons/images/thumb/c/c7/All_Gamers_logo.png/600px-All_Gamers_logo.png" },
  { name: "lgd-gaming", url: "https://liquipedia.net/commons/images/thumb/8/8a/LGD_Gaming_logo.png/600px-LGD_Gaming_logo.png" },
  { name: "jd-gaming", url: "https://liquipedia.net/commons/images/thumb/c/c4/JD_Gaming_allmode.png/600px-JD_Gaming_allmode.png" },
  { name: "nova-esports", url: "https://liquipedia.net/commons/images/thumb/0/0d/Nova_Esports_logo.png/600px-Nova_Esports_logo.png" },
  { name: "four-angry-men", url: "https://liquipedia.net/commons/images/thumb/0/09/Four_Angry_Men.png/600px-Four_Angry_Men.png" },
  { name: "regans-gaming", url: "https://liquipedia.net/commons/images/thumb/a/a0/Regans_Gaming_logo_2024.png/600px-Regans_Gaming_logo_2024.png" },
  { name: "kone-esport", url: "https://liquipedia.net/commons/images/thumb/4/4e/KONE_Esport_logo.png/600px-KONE_Esport_logo.png" },
  { name: "kuaishou-gaming", url: "https://liquipedia.net/commons/images/thumb/3/3f/KuaiShou_Gaming_Logo.png/600px-KuaiShou_Gaming_Logo.png" },
];

import { writeFileSync } from "fs";
import { join } from "path";

const outDir = "public/images/team-logos/light-theme";

for (const team of teams) {
  try {
    const resp = await fetch(team.url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!resp.ok) {
      console.warn(`Failed ${team.name}: ${resp.status} ${team.url}`);
      continue;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    const outPath = join(outDir, `${team.name}-light.png`);
    writeFileSync(outPath, buf);
    console.log(`Saved ${team.name}-light.png (${buf.length} bytes)`);
  } catch (e) {
    console.warn(`Error ${team.name}:`, e.message);
  }
}
console.log("Done.");
