/**
 * Panel theme controller for X 大互动智能体.
 *
 * Follows the same CSS contract as the most-used open-source theme stacks:
 * - next-themes (site already uses it): resolved theme via data-theme + CSS variables
 * - theme-change (vanilla): data-set-theme / data-theme persistence helpers
 *
 * Scoped to the panel root only. Must not mutate document.documentElement on x.com.
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "xrcPanelTheme";
  const THEMES = ["system", "light", "dark"];
  const ATTRIBUTE = "data-theme";

  function storage() {
    try {
      return root.chrome?.storage?.local || null;
    } catch (error) {
      return null;
    }
  }

  function parseRgb(value) {
    const text = String(value || "").trim();
    const match = text.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (!match) return null;
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
    };
  }

  function luminance(rgb) {
    if (!rgb) return null;
    const channel = (value) => {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function systemThemeFromMedia() {
    try {
      return root.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  }

  function systemThemeFromHost() {
    try {
      const body = root.document?.body;
      if (!body) return null;
      const rgb = parseRgb(root.getComputedStyle(body).backgroundColor);
      const lum = luminance(rgb);
      if (lum == null) return null;
      return lum < 0.45 ? "dark" : "light";
    } catch (error) {
      return null;
    }
  }

  function resolveTheme(preference) {
    const pref = THEMES.includes(preference) ? preference : "system";
    if (pref !== "system") return pref;
    return systemThemeFromHost() || systemThemeFromMedia();
  }

  function nextPreference(current) {
    const index = THEMES.indexOf(current);
    return THEMES[(index + 1) % THEMES.length];
  }

  function labelFor(preference, resolved) {
    if (preference === "system") return resolved === "dark" ? "跟随 · 深色" : "跟随 · 浅色";
    return preference === "dark" ? "深色" : "浅色";
  }

  function applyToPanel(panel, preference, resolved) {
    if (!panel) return;
    panel.setAttribute(ATTRIBUTE, resolved);
    panel.dataset.xrcThemePreference = preference;
    panel.style.colorScheme = resolved;
    const toggle = panel.querySelector("[data-xrc-theme-toggle]");
    if (toggle) {
      toggle.dataset.theme = preference;
      toggle.dataset.resolved = resolved;
      toggle.setAttribute("aria-label", `外观：${labelFor(preference, resolved)}，点击切换`);
      toggle.title = `外观：${labelFor(preference, resolved)}（点击切换浅色 / 深色 / 跟随）`;
    }
  }

  async function readPreference() {
    const api = storage();
    if (!api?.get) return "system";
    try {
      const stored = await api.get(STORAGE_KEY);
      const value = stored?.[STORAGE_KEY];
      return THEMES.includes(value) ? value : "system";
    } catch (error) {
      return "system";
    }
  }

  async function writePreference(preference) {
    const api = storage();
    if (!api?.set) return;
    try {
      await api.set({ [STORAGE_KEY]: preference });
    } catch (error) {
      /* Keep the in-memory preference if storage is unavailable. */
    }
  }

  function bindSystemListeners(onChange) {
    const media = root.matchMedia?.("(prefers-color-scheme: dark)");
    if (media) {
      const handler = () => onChange();
      if (typeof media.addEventListener === "function") media.addEventListener("change", handler);
      else if (typeof media.addListener === "function") media.addListener(handler);
    }
    try {
      const observer = new MutationObserver(() => onChange());
      const target = root.document?.documentElement;
      if (target) {
        observer.observe(target, { attributes: true, attributeFilter: ["style", "class", "data-theme", "data-color-mode"] });
      }
      if (root.document?.body) {
        observer.observe(root.document.body, { attributes: true, attributeFilter: ["style", "class"] });
      }
    } catch (error) {
      /* Host theme observation is best-effort. */
    }
  }

  function createController(panel) {
    let preference = "system";
    let resolved = resolveTheme(preference);
    let ready = false;

    const sync = () => {
      resolved = resolveTheme(preference);
      applyToPanel(panel, preference, resolved);
    };

    const api = {
      storageKey: STORAGE_KEY,
      themes: THEMES.slice(),
      getPreference: () => preference,
      getResolved: () => resolved,
      async init() {
        preference = await readPreference();
        sync();
        ready = true;
        return api;
      },
      async setPreference(next) {
        preference = THEMES.includes(next) ? next : "system";
        sync();
        await writePreference(preference);
        return api;
      },
      async cycle() {
        return api.setPreference(nextPreference(preference));
      },
      refresh() {
        if (!ready && preference !== "system") return api;
        sync();
        return api;
      },
    };

    applyToPanel(panel, preference, resolved);
    bindSystemListeners(() => {
      if (preference === "system") sync();
    });
    return api;
  }

  root.XrcPanelTheme = {
    STORAGE_KEY,
    THEMES,
    ATTRIBUTE,
    resolveTheme,
    createController,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
