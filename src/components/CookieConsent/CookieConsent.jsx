import React, { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion } from "motion/react";
import { Cookie, X } from "lucide-react";
import Button from "./Button";
import { Switch } from "./Switch";
import { motionTokens } from "./motion-tokens";
import styles from "./cookie-consent.module.css";
const defaultCookieCategories = [
  { id: "necessary", label: "Strictly necessary", description: "Sign-in, security, and your cart. The site can't work without these.", required: true },
  { id: "preferences", label: "Preferences", description: "Remember your language, region, and display settings." },
  { id: "analytics", label: "Analytics", description: "Count visits and see which pages help, only in aggregate." },
  { id: "marketing", label: "Marketing", description: "Measure campaigns and show relevant ads on other sites." }
];
const defaultLabels = {
  message: "We use essential cookies to run this site. With your OK, we'd also use optional ones to remember settings and learn what helps.",
  customize: "Customize",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  save: "Save choices",
  preferencesTitle: "Cookie preferences",
  preferencesDescription: "Choose which optional cookies we can use. You can change this any time.",
  reopen: "Cookie preferences",
  alwaysOn: "Always on",
  close: "Close preferences"
};
function readCookieConsent(storageKey, version = "1") {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.value !== "object" || parsed.value === null || parsed.version !== version) return null;
    return { value: parsed.value, version: parsed.version, updatedAt: String(parsed.updatedAt ?? "") };
  } catch {
    return null;
  }
}
function writeCookieConsent(storageKey, stored) {
  try {
    if (stored) window.localStorage.setItem(storageKey, JSON.stringify(stored));
    else window.localStorage.removeItem(storageKey);
  } catch {
  }
}
const enter = [...motionTokens.ease.enter];
const standard = [...motionTokens.ease.standard];
const physical = (visualDuration, bounce) => {
  const root = 2 * Math.PI / (visualDuration * 1.2);
  return { type: "spring", stiffness: root * root, damping: 2 * (1 - bounce) * root, mass: 1 };
};
const GROW = physical(0.46, 0.14), SHRINK = physical(0.38, 0);
const BAR_MAX = 660, PANEL_MAX = 420, CHIP = 44, STACK_BELOW = 560;
const subscribe = () => () => {
};
function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
const faceVariants = {
  hidden: { opacity: 0, y: 10, filter: `blur(${motionTokens.blur.soft}px)` },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { y: physical(0.42, 0.08), opacity: { duration: 0.22, ease: enter, delay: 0.04 }, filter: { duration: 0.26, ease: enter, delay: 0.04 } } },
  gone: { opacity: 0, y: 4, filter: `blur(${motionTokens.blur.soft}px)`, transition: { duration: 0.12, ease: standard } }
};
const fadeVariants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.16 } }, gone: { opacity: 0, transition: { duration: 0.1 } } };
function Face({ id, width, side, reduced, focusOnMount, onSize, className, children, ...rest }) {
  const ref = useRef(null);
  const present = useIsPresent();
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !present) return;
    const report = () => onSize(id, node.offsetHeight);
    report();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [id, onSize, present]);
  useEffect(() => {
    if (!focusOnMount) return;
    ref.current?.querySelector("[data-autofocus]")?.focus({ preventScroll: true });
  }, [focusOnMount]);
  return /* @__PURE__ */ React.createElement(
    motion.div,
    {
      ...rest,
      ref,
      className: [styles.face, className].filter(Boolean).join(" "),
      style: { width },
      "data-face": id,
      "data-side": side,
      variants: reduced ? fadeVariants : faceVariants,
      initial: "hidden",
      animate: "shown",
      exit: "gone",
      inert: !present || void 0
    },
    children
  );
}
const CookieConsent = forwardRef(function CookieConsent2({
  categories = defaultCookieCategories,
  value,
  defaultValue = null,
  onChange,
  storageKey,
  version = "1",
  preferencesOpen,
  defaultPreferencesOpen = false,
  onPreferencesOpenChange,
  policy,
  position = "bottom",
  strategy = "fixed",
  showReopenButton = true,
  reopenSide,
  labels: labelOverrides,
  className
}, ref) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const reduced = !!useReducedMotion();
  const hydrated = useHydrated();
  const uid = useId();
  const titleId = `${uid}-title`, descriptionId = `${uid}-description`, messageId = `${uid}-message`;
  const [internal, setInternal] = useState(defaultValue);
  const [loaded, setLoaded] = useState(!storageKey || value !== void 0);
  useEffect(() => {
    if (loaded || !storageKey) return;
    const stored = readCookieConsent(storageKey, version);
    if (stored) setInternal(stored.value);
    setLoaded(true);
  }, [loaded, storageKey, version]);
  const consent = value !== void 0 ? value : internal;
  const decided = consent != null;
  const [panelInternal, setPanelInternal] = useState(defaultPreferencesOpen);
  const panelOpen = preferencesOpen ?? panelInternal;
  const setPanel = useCallback((next) => {
    if (preferencesOpen === void 0) setPanelInternal(next);
    onPreferencesOpenChange?.(next);
  }, [onPreferencesOpenChange, preferencesOpen]);
  const baseline = useCallback((from) => Object.fromEntries(categories.map((category) => [category.id, category.required ? true : from?.[category.id] ?? category.defaultEnabled ?? false])), [categories]);
  const [draft, setDraft] = useState(() => baseline(consent));
  const [focusTarget, setFocusTarget] = useState(null);
  const mode = !hydrated || !loaded ? null : panelOpen ? "panel" : !decided ? "bar" : showReopenButton ? "chip" : null;
  const openPanel = useCallback((focus = true) => {
    setDraft(baseline(consent));
    setFocusTarget(focus ? "panel" : null);
    setPanel(true);
  }, [baseline, consent, setPanel]);
  const closePanel = useCallback((focus = true) => {
    setFocusTarget(focus ? decided ? "chip" : "bar" : null);
    setPanel(false);
  }, [decided, setPanel]);
  const commit = useCallback((next, action) => {
    const updatedAt = /* @__PURE__ */ new Date();
    if (value === void 0) setInternal(next);
    if (storageKey) writeCookieConsent(storageKey, next ? { value: next, version, updatedAt: updatedAt.toISOString() } : null);
    onChange?.(next, { action, updatedAt });
  }, [onChange, storageKey, value, version]);
  const choose = (action) => {
    const next = action === "save" ? { ...draft } : Object.fromEntries(categories.map((category) => [category.id, category.required ? true : action === "accept-all"]));
    setFocusTarget(showReopenButton ? "chip" : null);
    commit(next, action);
    if (panelOpen) setPanel(false);
  };
  useImperativeHandle(ref, () => ({
    openPreferences: () => openPanel(true),
    closePreferences: () => closePanel(false),
    reset: () => {
      setPanel(false);
      setFocusTarget(null);
      commit(null, "reset");
    }
  }), [closePanel, commit, openPanel, setPanel]);
  const layerRef = useRef(null);
  const [layerWidth, setLayerWidth] = useState(0);
  useLayoutEffect(() => {
    const node = layerRef.current;
    if (!node) return;
    const read = () => setLayerWidth(node.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const align = position === "bottom-left" ? "left" : position === "bottom-right" ? "right" : "center";
  const chipSide = reopenSide ?? (align === "right" ? "right" : "left");
  const widths = { bar: Math.min(layerWidth, BAR_MAX), panel: Math.min(layerWidth, PANEL_MAX), chip: CHIP };
  const place = (width2, side) => side === "left" ? 0 : side === "right" ? layerWidth - width2 : (layerWidth - width2) / 2;
  const panelSide = decided && showReopenButton ? chipSide : align;
  const x = useMotionValue(0), width = useMotionValue(0), height = useMotionValue(0), radius = useMotionValue(22);
  const heights = useRef({ bar: 0, panel: 0, chip: CHIP });
  const shape = useRef({ w: 0, h: 0, ready: false });
  const [tick, setTick] = useState(0);
  const onSize = useCallback((id, h) => {
    if (heights.current[id] === h) return;
    heights.current[id] = h;
    setTick((count) => count + 1);
  }, []);
  useLayoutEffect(() => {
    if (!mode || !layerWidth) {
      shape.current.ready = false;
      return;
    }
    const w = widths[mode], h = mode === "chip" ? CHIP : heights.current[mode];
    if (!h) return;
    const next = { x: place(w, mode === "chip" ? chipSide : mode === "panel" ? panelSide : align), w, h, r: mode === "chip" ? CHIP / 2 : mode === "panel" ? 26 : 22 };
    if (!shape.current.ready || reduced) {
      x.jump(next.x);
      width.jump(next.w);
      height.jump(next.h);
      radius.jump(next.r);
      shape.current = { w: next.w, h: next.h, ready: true };
      return;
    }
    const transition = next.w * next.h >= shape.current.w * shape.current.h ? GROW : SHRINK;
    shape.current = { w: next.w, h: next.h, ready: true };
    animate(x, next.x, transition);
    animate(width, next.w, transition);
    animate(height, next.h, transition);
    animate(radius, next.r, transition);
  }, [mode, layerWidth, tick, reduced, align, chipSide, panelSide]);
  const onPanelKeyDown = (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    closePanel(true);
  };
  const policyLink = policy ? policy.href ? /* @__PURE__ */ React.createElement("a", { className: styles.policy, href: policy.href, onClick: policy.onClick }, policy.label) : /* @__PURE__ */ React.createElement("button", { type: "button", className: styles.policy, onClick: policy.onClick }, policy.label) : null;
  const optional = categories.filter((category) => !category.required);
  const allowedCount = optional.filter((category) => draft[category.id]).length;
  return /* @__PURE__ */ React.createElement("div", { ref: layerRef, className: [styles.layer, strategy === "absolute" ? styles.absolute : "", className].filter(Boolean).join(" "), "data-position": position }, /* @__PURE__ */ React.createElement(AnimatePresence, null, mode ? /* @__PURE__ */ React.createElement(
    motion.div,
    {
      key: "surface",
      className: styles.surface,
      style: { x, width, height, borderRadius: radius },
      initial: reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1, transition: reduced ? { duration: 0.16 } : { y: physical(0.5, 0.1), scale: physical(0.5, 0.1), opacity: { duration: 0.24, ease: enter } } },
      exit: reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18, ease: standard } }
    },
    /* @__PURE__ */ React.createElement(AnimatePresence, { initial: false }, mode === "bar" ? /* @__PURE__ */ React.createElement(
      Face,
      {
        key: "bar",
        id: "bar",
        width: widths.bar,
        side: align,
        reduced,
        onSize,
        focusOnMount: focusTarget === "bar",
        className: styles.bar,
        role: "dialog",
        "aria-modal": false,
        "aria-label": labels.preferencesTitle,
        "aria-describedby": messageId
      },
      /* @__PURE__ */ React.createElement("div", { className: styles.barInner, "data-stack": widths.bar < STACK_BELOW || void 0 }, /* @__PURE__ */ React.createElement("p", { id: messageId, className: styles.message }, labels.message, policyLink ? /* @__PURE__ */ React.createElement(React.Fragment, null, " ", policyLink) : null), /* @__PURE__ */ React.createElement("div", { className: styles.barActions }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "ghost", "data-autofocus": true, onClick: () => openPanel(true) }, labels.customize), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => choose("reject-all") }, labels.rejectAll), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => choose("accept-all") }, labels.acceptAll)))
    ) : null, mode === "panel" ? /* @__PURE__ */ React.createElement(
      Face,
      {
        key: "panel",
        id: "panel",
        width: widths.panel,
        side: panelSide,
        reduced,
        onSize,
        focusOnMount: focusTarget === "panel",
        className: styles.panel,
        role: "dialog",
        "aria-modal": false,
        "aria-labelledby": titleId,
        "aria-describedby": descriptionId,
        onKeyDown: onPanelKeyDown
      },
      /* @__PURE__ */ React.createElement("div", { className: styles.panelHead }, /* @__PURE__ */ React.createElement("h2", { id: titleId, className: styles.title, tabIndex: -1, "data-autofocus": true }, labels.preferencesTitle), /* @__PURE__ */ React.createElement("button", { type: "button", className: styles.iconButton, "aria-label": labels.close, onClick: () => closePanel(true) }, /* @__PURE__ */ React.createElement(X, { size: 16, strokeWidth: 1.75, "aria-hidden": "true" }))),
      /* @__PURE__ */ React.createElement("p", { id: descriptionId, className: styles.description }, labels.preferencesDescription, policyLink ? /* @__PURE__ */ React.createElement(React.Fragment, null, " ", policyLink) : null),
      /* @__PURE__ */ React.createElement("ul", { className: styles.list }, categories.map((category) => {
        const switchId = `${uid}-${category.id}`, hintId = `${switchId}-hint`;
        return /* @__PURE__ */ React.createElement("li", { key: category.id, className: styles.row }, /* @__PURE__ */ React.createElement("div", { className: styles.rowText }, /* @__PURE__ */ React.createElement("label", { htmlFor: category.required ? void 0 : switchId, className: styles.rowLabel }, category.label), category.description ? /* @__PURE__ */ React.createElement("p", { id: hintId, className: styles.rowHint }, category.description) : null), category.required ? /* @__PURE__ */ React.createElement("span", { className: styles.always }, labels.alwaysOn) : /* @__PURE__ */ React.createElement(
          Switch,
          {
            id: switchId,
            "aria-describedby": category.description ? hintId : void 0,
            checked: !!draft[category.id],
            onCheckedChange: (checked) => setDraft((current) => ({ ...current, [category.id]: checked }))
          }
        ));
      })),
      /* @__PURE__ */ React.createElement("div", { className: styles.panelActions }, /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => choose("reject-all") }, labels.rejectAll), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => choose("accept-all") }, labels.acceptAll), /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "primary", className: styles.save, onClick: () => choose("save"), "aria-describedby": `${uid}-count` }, labels.save), /* @__PURE__ */ React.createElement("span", { id: `${uid}-count`, className: styles.srOnly }, `${allowedCount} of ${optional.length} optional categories allowed`))
    ) : null, mode === "chip" ? /* @__PURE__ */ React.createElement(Face, { key: "chip", id: "chip", width: CHIP, side: chipSide, reduced, onSize, focusOnMount: focusTarget === "chip", className: styles.chipFace }, /* @__PURE__ */ React.createElement("button", { type: "button", className: styles.chip, "aria-label": labels.reopen, "aria-haspopup": "dialog", "data-autofocus": true, onClick: () => openPanel(true) }, /* @__PURE__ */ React.createElement(Cookie, { size: 20, strokeWidth: 1.75, "aria-hidden": "true" }))) : null)
  ) : null));
});
var cookie_consent_default = CookieConsent;
export {
  CookieConsent,
  cookie_consent_default as default,
  defaultCookieCategories,
  readCookieConsent
};
