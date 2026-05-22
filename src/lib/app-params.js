const isNode = typeof window === "undefined";
const safeImportMetaEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const storage = isNode
  ? {
      setItem() {},
      getItem() {
        return null;
      },
      removeItem() {},
    }
  : window.localStorage;

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {},
) => {
  if (isNode) {
    return defaultValue;
  }
  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  return null;
};

const getAppParams = () => {
  if (getAppParamValue("clear_access_token") === "true") {
    storage.removeItem("base44_access_token");
    storage.removeItem("token");
  }
  const currentHref = isNode ? "" : window.location.href;
  return {
    appId: getAppParamValue("app_id", {
      defaultValue: safeImportMetaEnv.VITE_BASE44_APP_ID,
    }),
    apiKey: getAppParamValue("api_key", {
      defaultValue: safeImportMetaEnv.VITE_BASE44_API_KEY,
    }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    fromUrl: getAppParamValue("from_url", { defaultValue: currentHref }),
    functionsVersion: getAppParamValue("functions_version", {
      defaultValue: safeImportMetaEnv.VITE_BASE44_FUNCTIONS_VERSION,
    }),
    appBaseUrl: getAppParamValue("app_base_url", {
      defaultValue: safeImportMetaEnv.VITE_BASE44_APP_BASE_URL,
    }),
  };
};

export const appParams = {
  ...getAppParams(),
};
