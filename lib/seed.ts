import { Mouse, Vote } from "./types";

/**
 * Starter roster. Every player starts in D / E-RANK with username = nick and
 * the manual starter password. The admin hands passwords out in-game and can
 * change them from the panel.
 */
export const STARTER_PASSWORD = "lalalalalala";

const DE_PLAYERS = [
  "Gracc",
  "Alwesh",
  "Blacklean",
  "Alp",
  "Kaanexe",
  "Kagn",
  "Evonmoss",
  "Sperfak",
  "Caps",
  "Aysunkimlik",
  "rekkles",
  "reflex",
  "globally",
  "kyle",
  "s1r",
  "aion",
  "Oforrrrrr",
  "saye",
  "denizovicov",
  "+valii",
  "malicar",
  "deepsea",
  "yestoprak",
  "fin_kalem",
  "fuunky",
  "divinapotentia",
  "judgetr",
  "queen-bella",
  "ryuaeth",
  "sufii",
  "sweetestpand",
  "virgaks",
];

export const SEED_MICE: Mouse[] = DE_PLAYERS.map((nick, i) => ({
  id: `p-${i + 1}`,
  nickname: nick,
  title: "",
  image_url: "",
  tier: "de",
  sort: i,
  username: nick,
  password: STARTER_PASSWORD,
  permissions: [],
  epoch: 0,
}));

/** No demo votes — the community casts real ones. */
export const SEED_VOTES: Vote[] = [];
