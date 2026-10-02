import { format } from "date-fns";
import { getNewsCategoryLabel } from "@/lib/newsCategories";

export const CATEGORIES = [
  "tournament",
  "patch_update",
  "roster_change",
  "announcement",
  "general",
];

export const GAMES = [
  "BGMI",
  "Valorant",
  "CSGO",
  "Free Fire",
  "PUBG PC",
  "Apex Legends",
  "General",
];

export const PUBLICATION_STATES = ["draft", "published"];

export const VERIFICATION_STATES = ["needs_review", "verified", "unverified"];

export const PRIORITIES = ["breaking", "important", "routine"];

export const SOURCE_TYPES = ["rss", "json"];

export function formatAdminNewsDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, yyyy");
}

export function categoryLabel(category) {
  return getNewsCategoryLabel(category);
}

export const EMPTY_FORM = {
  title: "",
  summary: "",
  category: "general",
  game: "General",
  created_date: "",
  thumbnail_url: "",
  content: "",
  source_name: "",
  source_url: "",
  source_type: "manual",
  verification_status: "verified",
  publication_status: "published",
  priority: "routine",
};

const MANUAL_IMPORT_INITIAL_STATE = {
  url: "",
  sourceName: "",
  sourceType: "rss",
  category: "general",
  game: "BGMI",
  priority: "routine",
};

export const ADMIN_NEWS_INITIAL_STATE = {
  showForm: false,
  editing: null,
  manualImport: MANUAL_IMPORT_INITIAL_STATE,
  form: EMPTY_FORM,
};

export function adminNewsReducer(state, action) {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.payload };
    case "resetForm":
      return {
        ...state,
        showForm: false,
        editing: null,
        form: EMPTY_FORM,
      };
    default:
      return state;
  }
}
