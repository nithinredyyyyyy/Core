

export const GAMES = [
  "BGMI",
  "Valorant",
  "CSGO",
  "Free Fire",
  "PUBG PC",
  "Apex Legends",
];

export const ROLES = ["IGL", "Assaulter", "Filter", "Support"];

export const ADMIN_TEAMS_INITIAL_STATE = {
  showForm: false,
  editing: null,
  form: {},
  showPlayerForm: null,
  editingPlayer: null,
  playerForm: {},
};

export function adminTeamsReducer(state, action) {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "resetTeamForm":
      return {
        ...state,
        showForm: false,
        editing: null,
        form: {},
      };
    case "resetPlayerForm":
      return {
        ...state,
        showPlayerForm: null,
        editingPlayer: null,
        playerForm: {},
      };
    default:
      return state;
  }
}
