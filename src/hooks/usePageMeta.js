import { useEffect } from "react";

const SITE_NAME = "Core";
const SITE_URL = "https://coreesports.gg";
const DEFAULT_IMAGE = `${SITE_URL}/images/core-logo.png`;

function setMetaTag(attr, key, content) {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

/**
 * Applies per-route title, description, canonical URL, and Open Graph metadata.
 * Pass `null` values to fall back to the site defaults.
 */
export function usePageMeta({ title, description, path = "", image, type = "website" } = {}) {
  useEffect(() => {
    const pageTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · BGMI Esports Hub`;
    const pageDescription =
      description ||
      "Core is a BGMI esports hub for tournaments, teams, schedules, standings, and news.";
    const canonical = `${SITE_URL}${path || window.location.pathname}`;
    const socialImage = image || DEFAULT_IMAGE;

    document.title = pageTitle;
    setMetaTag("name", "description", pageDescription);
    setMetaTag("property", "og:title", pageTitle);
    setMetaTag("property", "og:description", pageDescription);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:image", socialImage);
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", pageTitle);
    setMetaTag("name", "twitter:description", pageDescription);
    setMetaTag("name", "twitter:image", socialImage);
    setCanonical(canonical);
  }, [title, description, path, image, type]);
}
