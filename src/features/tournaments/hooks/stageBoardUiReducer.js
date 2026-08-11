export function createStageBoardUiState(defaultStageName = "") {
  return {
    selectedStage: defaultStageName,
    selectedGroup: "overall",
    selectedStatisticsCategory: "eliminator",
    selectedStatisticsSubStage: "overall",
    openMobileMenu: null,
    tableSort: null,
  };
}

export function stageBoardUiReducer(state, action) {
  switch (action.type) {
    case "selectStage":
      if (typeof action.payload === "object" && action.payload !== null) {
        return {
          ...state,
          selectedStage: action.payload.stageName,
          selectedGroup: action.payload.selectedGroup || "overall",
          openMobileMenu: null,
        };
      }
      return {
        ...state,
        selectedStage: action.payload,
        selectedGroup: "overall",
        openMobileMenu: null,
      };
    case "selectGroup":
      return {
        ...state,
        selectedGroup: action.payload,
        openMobileMenu: null,
      };
    case "toggleMobileMenu":
      return {
        ...state,
        openMobileMenu: state.openMobileMenu === action.payload ? null : action.payload,
      };
    case "closeMobileMenu":
      return {
        ...state,
        openMobileMenu: null,
      };
    case "selectStatisticsCategory":
      return {
        ...state,
        selectedStatisticsCategory: action.payload,
        selectedStatisticsSubStage:
          action.payload === "eliminator" ? "overall" : state.selectedStatisticsSubStage,
      };
    case "selectStatisticsSubStage":
      return {
        ...state,
        selectedStatisticsSubStage: action.payload,
      };
    case "toggleTableSort": {
      const tableKey = action.payload?.tableKey;
      const field = action.payload?.field;
      if (!tableKey || !field) return state;
      const isSameField =
        state.tableSort?.tableKey === tableKey && state.tableSort?.field === field;
      return {
        ...state,
        tableSort: {
          tableKey,
          field,
          direction: isSameField && state.tableSort?.direction === "desc" ? "asc" : "desc",
        },
      };
    }
    default:
      return state;
  }
}
