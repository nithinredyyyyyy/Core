const isProduction = process.env.NODE_ENV === "production";

function formatMessage(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  };
  return isProduction
    ? JSON.stringify(entry)
    : `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
}

export const logger = {
  info: (message, meta) => console.log(formatMessage("info", message, meta)),
  warn: (message, meta) => console.warn(formatMessage("warn", message, meta)),
  error: (message, meta) => console.error(formatMessage("error", message, meta)),
  debug: (message, meta) => {
    if (!isProduction) console.log(formatMessage("debug", message, meta));
  },
};
