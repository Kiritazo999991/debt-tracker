/* ============================================================
   ДолгКонтроль — frontend application
   ============================================================ */
(() => {
  "use strict";

  /* ---------------------------------------------------------- constants */
  const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MONTHS_FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const WEEKDAYS_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

  const COLORS = ["#7c5cff", "#22d3ee", "#f59e0b", "#f472b6", "#34d399", "#60a5fa", "#fb7185"];

  const TYPES = {
    credit: { label: "Кредит", icon: "card" },
    mortgage: { label: "Ипотека", icon: "home" },
    installment: { label: "Рассрочка", icon: "bag" },
    card: { label: "Кредитная карта", icon: "card" },
    loan: { label: "Займ", icon: "coins" },
    other: { label: "Другое", icon: "wallet" },
  };

  const TYPE_COLORS = {
    mortgage: "#8b5cf6",
    credit: "#60a5fa",
    installment: "#f59e0b",
    card: "#f472b6",
    loan: "#34d399",
    other: "#94a3b8",
  };

  const INCOME_KINDS = {
    salary: { label: "Зарплата", color: "#34d399" },
    advance: { label: "Аванс", color: "#22d3ee" },
    other: { label: "Другой доход", color: "#a78bfa" },
  };

  const ICONS = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1.5"/><rect width="7" height="5" x="14" y="3" rx="1.5"/><rect width="7" height="9" x="14" y="12" rx="1.5"/><rect width="7" height="5" x="3" y="16" rx="1.5"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    settings: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    sparkles: '<path d="m12 3-1.9 5.8L4 10.7l6.1 1.9L12 18.4l1.9-5.8L20 10.7l-6.1-1.9L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
    income: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10h.01M18 14h.01"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  };

  /* ---------------------------------------------------------- state */
  const state = {
    route: "dashboard",
    settings: { currency: "₽", theme: "dark" },
    info: null,
    summary: null,
    debts: [],
    analytics: null,
    historyAll: null,
    historyDebts: [],
    month: currentMonthKey(),
    debtFilters: { q: "", status: "active", sort: "next" },
    historyFilters: { q: "", debtId: "all", year: "all" },
    incomes: null,
    incomePlan: null,
    backups: [],
    backupMeta: { dir: "", keep: 5 },
    detailDebt: null,
    detailDebtId: null,
  };

  let pageCharts = [];
  let modalCharts = [];
  let confirmResolver = null;
  let sidebarRequest = 0;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /* ---------------------------------------------------------- utils */
  function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, (character) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  const esc = escapeHtml;

  function toNumber(value, fallback = 0) {
    const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function fmtMoney(value, options = {}) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    const formatter = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: options.cents ? 2 : 0,
      maximumFractionDigits: options.cents ? 2 : 0,
    });
    return `${formatter.format(number)} ${state.settings.currency || "₽"}`;
  }

  function axisMoney(value) {
    const number = Number(value) || 0;
    const sign = number < 0 ? "−" : "";
    const abs = Math.abs(number);
    if (abs >= 1e6) {
      return `${sign}${(abs / 1e6).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн`;
    }
    if (abs >= 1e3) {
      return `${sign}${Math.round(abs / 1e3).toLocaleString("ru-RU")} тыс`;
    }
    return `${sign}${Math.round(abs)}`;
  }

  function parseISO(value) {
    if (!value) return null;
    const parts = String(value).slice(0, 10).split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function localISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function todayISO() {
    return localISO(new Date());
  }

  function currentMonthKey() {
    return todayISO().slice(0, 7);
  }

  function addMonthsKey(key, delta) {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function addMonthsDate(source, months) {
    const year = source.getFullYear() + Math.floor((source.getMonth() + months) / 12);
    const month = ((source.getMonth() + months) % 12 + 12) % 12;
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(source.getDate(), lastDay));
  }

  function fmtDate(value, options = {}) {
    const date = parseISO(value);
    if (!date) return "—";
    const includeYear = options.year !== false;
    return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}${includeYear ? ` ${date.getFullYear()}` : ""}`;
  }

  function fmtDateShort(value) {
    return fmtDate(value, { year: false });
  }

  function fmtDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return `${fmtDate(value)} · ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function fmtBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${size} Б`;
  }

  function fmtMonthFull(key) {
    if (!key) return "—";
    const [year, month] = key.split("-").map(Number);
    return `${MONTHS_FULL[month - 1] || ""} ${year}`;
  }

  function monthShort(key) {
    if (!key) return "";
    const [year, month] = key.split("-").map(Number);
    return `${MONTHS_SHORT[month - 1] || ""} ${String(year).slice(2)}`;
  }

  function monthYearShort(value) {
    const date = parseISO(value);
    if (!date) return "—";
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  }

  function capitalize(value) {
    const text = String(value || "");
    return text ? text[0].toUpperCase() + text.slice(1) : text;
  }

  function plural(number, forms) {
    const abs = Math.abs(Number(number)) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    if (last === 1) return forms[0];
    return forms[2];
  }

  function daysLeftText(days) {
    if (days === 0) return "сегодня";
    if (days === 1) return "завтра";
    if (days > 1) return `через ${days} ${plural(days, ["день", "дня", "дней"])}`;
    if (days === -1) return "просрочен вчера";
    return `просрочен на ${Math.abs(days)} ${plural(Math.abs(days), ["день", "дня", "дней"])}`;
  }

  function withAlpha(hex, alpha) {
    const value = String(hex || "").replace("#", "");
    const normalized = value.length === 3
      ? value.split("").map((character) => character + character).join("")
      : value;
    if (normalized.length !== 6) return `rgba(139, 92, 246, ${alpha})`;
    const red = parseInt(normalized.slice(0, 2), 16);
    const green = parseInt(normalized.slice(2, 4), 16);
    const blue = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function icon(name, size = 18) {
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  function fillIcons(root = document) {
    $$("[data-icon]", root).forEach((element) => {
      if (element.querySelector("svg")) return;
      const size = Number(element.dataset.iconSize) || 18;
      element.innerHTML = icon(element.dataset.icon, size);
    });
  }

  function typeMeta(type) {
    return TYPES[type] || TYPES.other;
  }

  /* ---------------------------------------------------------- api & theme */
  async function api(path, options = {}) {
    const config = { method: options.method || "GET", headers: {} };
    if (options.body !== undefined) {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(options.body);
    }
    const response = await fetch(path, config);
    let payload = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    } else {
      payload = await response.text().catch(() => "");
    }
    if (!response.ok) {
      const message = payload && payload.error ? payload.error : `Ошибка запроса (${response.status})`;
      throw new Error(message);
    }
    return payload;
  }

  function nativeApi() {
    return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
  }

  function chartTheme() {
    const styles = getComputedStyle(document.documentElement);
    return {
      text: styles.getPropertyValue("--muted").trim() || "#9aa4b8",
      grid: styles.getPropertyValue("--chart-grid").trim() || "rgba(255,255,255,.055)",
      planned: styles.getPropertyValue("--chart-planned").trim() || "rgba(148,163,184,.22)",
    };
  }

  function configureCharts() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.font.family = "'Segoe UI Variable Text', 'Segoe UI', Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = chartTheme().text;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.animation.duration = 550;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(10, 13, 21, 0.96)";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255, 255, 255, 0.12)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.titleColor = "#f1f4fb";
    Chart.defaults.plugins.tooltip.bodyColor = "#c8d0e0";
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.plugins.tooltip.usePointStyle = true;
    Chart.defaults.plugins.tooltip.boxWidth = 7;
    Chart.defaults.plugins.tooltip.boxHeight = 7;
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";
    state.settings.theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    try { localStorage.setItem("debt-theme", nextTheme); } catch (error) {}
    const themeIcon = $("#theme-icon");
    if (themeIcon) themeIcon.innerHTML = icon(nextTheme === "dark" ? "sun" : "moon");
    if (window.pywebview?.api?.set_titlebar) {
      Promise.resolve(window.pywebview.api.set_titlebar(nextTheme)).catch(() => {});
    }
    configureCharts();
    if (options.sync !== false) {
      api("/api/settings", { method: "PUT", body: { theme: nextTheme } }).catch(() => {});
    }
  }

  async function toggleTheme() {
    const nextTheme = state.settings.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    await loadRoute(state.route);
  }

  /* ---------------------------------------------------------- charts */
  function areaGradient(context, from, to) {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return from;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    return gradient;
  }

  function makeChart(canvasId, config, target = "page") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return null;
    try {
      const chart = new Chart(canvas, config);
      (target === "modal" ? modalCharts : pageCharts).push(chart);
      return chart;
    } catch (error) {
      console.error("Chart error", error);
      return null;
    }
  }

  function disposePageCharts() {
    pageCharts.forEach((chart) => chart.destroy());
    pageCharts = [];
  }

  function disposeModalCharts() {
    modalCharts.forEach((chart) => chart.destroy());
    modalCharts = [];
  }

  function createBalanceChart(canvasId, series, target = "page") {
    if (!Array.isArray(series) || series.length < 2) return null;
    const theme = chartTheme();
    const labels = series.map((point) => monthShort(point.month));
    return makeChart(canvasId, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: series.map((point) => point.total),
          borderColor: "#8b5cf6",
          borderWidth: 2.4,
          fill: true,
          tension: 0.34,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#8b5cf6",
          backgroundColor: (context) => areaGradient(context, "rgba(139, 92, 246, 0.4)", "rgba(139, 92, 246, 0)"),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => fmtMonthFull(series[items[0].dataIndex].month),
              label: (item) => `  Остаток: ${fmtMoney(item.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: theme.text, maxTicksLimit: 8, maxRotation: 0, autoSkip: true, font: { size: 10.5 } },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: theme.grid, drawTicks: false },
            ticks: { color: theme.text, padding: 8, maxTicksLimit: 6, callback: axisMoney, font: { size: 10.5 } },
          },
        },
      },
    }, target);
  }

  function createStructureChart(canvasId, items, target = "page") {
    if (!Array.isArray(items) || !items.length) return null;
    const total = items.reduce((sum, item) => sum + Number(item.remaining || 0), 0);
    return makeChart(canvasId, {
      type: "doughnut",
      data: {
        labels: items.map((item) => item.title),
        datasets: [{
          data: items.map((item) => item.remaining),
          backgroundColor: items.map((item) => item.color),
          borderWidth: 0,
          hoverOffset: 7,
          spacing: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const percent = total > 0 ? ((item.parsed / total) * 100).toFixed(1) : "0";
                return ` ${fmtMoney(item.parsed)} · ${percent}%`;
              },
            },
          },
        },
      },
    }, target);
  }

  function createTypeChart(canvasId, items, target = "page") {
    if (!Array.isArray(items) || !items.length) return null;
    const total = items.reduce((sum, item) => sum + Number(item.remaining || 0), 0);
    return makeChart(canvasId, {
      type: "doughnut",
      data: {
        labels: items.map((item) => item.label),
        datasets: [{
          data: items.map((item) => item.remaining),
          backgroundColor: items.map((item) => TYPE_COLORS[item.type] || "#94a3b8"),
          borderWidth: 0,
          hoverOffset: 7,
          spacing: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const percent = total > 0 ? ((item.parsed / total) * 100).toFixed(1) : "0";
                return ` ${fmtMoney(item.parsed)} · ${percent}%`;
              },
            },
          },
        },
      },
    }, target);
  }

  function createFlowChart(canvasId, flow, target = "page") {
    if (!Array.isArray(flow) || !flow.length) return null;
    const theme = chartTheme();
    return makeChart(canvasId, {
      type: "bar",
      data: {
        labels: flow.map((point) => monthShort(point.month)),
        datasets: [
          {
            label: "План",
            data: flow.map((point) => point.planned),
            backgroundColor: theme.planned,
            borderRadius: 7,
            borderSkipped: false,
            maxBarThickness: 26,
          },
          {
            label: "Оплачено",
            data: flow.map((point) => point.paid),
            backgroundColor: "#34d399",
            borderRadius: 7,
            borderSkipped: false,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              color: theme.text,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 14,
              font: { size: 10.5 },
            },
          },
          tooltip: {
            callbacks: {
              title: (items) => fmtMonthFull(flow[items[0].dataIndex].month),
              label: (item) => ` ${item.dataset.label}: ${fmtMoney(item.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: theme.text, maxTicksLimit: 13, maxRotation: 0, autoSkip: true, font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: theme.grid, drawTicks: false },
            ticks: { color: theme.text, padding: 8, maxTicksLimit: 5, callback: axisMoney, font: { size: 10 } },
          },
        },
      },
    }, target);
  }

  function createDebtChart(canvasId, debt) {
    const rows = debt.payments || [];
    if (!rows.length) return null;
    const theme = chartTheme();
    return makeChart(canvasId, {
      type: "bar",
      data: {
        labels: rows.map((row) => fmtDateShort(row.due_date)),
        datasets: [
          {
            type: "bar",
            label: "Платёж",
            data: rows.map((row) => row.amount),
            backgroundColor: rows.map((row) => row.status === "paid" ? withAlpha(debt.color, 0.95) : withAlpha(debt.color, 0.36)),
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 10,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Остаток",
            data: rows.map((row) => row.balance_after),
            borderColor: "#22d3ee",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.3,
            fill: false,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              color: theme.text,
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 12,
              font: { size: 10.5 },
            },
          },
          tooltip: {
            callbacks: {
              title: (items) => fmtDate(rows[items[0].dataIndex].due_date),
              label: (item) => {
                const label = item.datasetIndex === 0 ? "Платёж" : "Остаток";
                return ` ${label}: ${fmtMoney(item.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: theme.text, maxTicksLimit: 10, maxRotation: 0, autoSkip: true, font: { size: 9.5 } },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: theme.grid, drawTicks: false },
            ticks: { color: theme.text, padding: 6, maxTicksLimit: 5, callback: axisMoney, font: { size: 9.5 } },
          },
          y1: {
            position: "right",
            beginAtZero: true,
            border: { display: false },
            grid: { display: false },
            ticks: { display: false },
          },
        },
      },
    }, "modal");
  }

  /* ---------------------------------------------------------- shared html */
  function pageHead(title, subtitle, actions = "") {
    return `<div class="page-head">
      <div><h1 class="page-title">${title}</h1><p class="page-sub">${subtitle}</p></div>
      <div class="page-actions">${actions}</div>
    </div>`;
  }

  function emptyState(options) {
    const { iconName = "wallet", title, text, actions = "", compact = false, danger = false } = options;
    return `<div class="empty-state ${compact ? "compact" : ""}">
      <div class="empty-art ${danger ? "danger" : ""}">${icon(iconName, compact ? 22 : 30)}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${actions ? `<div class="empty-actions">${actions}</div>` : ""}
    </div>`;
  }

  function skeletonHtml() {
    return `<div class="view-inner skeleton-page">
      <div class="sk sk-title"></div>
      <div class="sk sk-sub"></div>
      <div class="sk-grid"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div>
      <div class="sk sk-chart"></div>
      <div class="sk sk-row"></div>
      <div class="sk sk-row"></div>
    </div>`;
  }

  function errorHtml(message) {
    return `<div class="view-inner">${emptyState({
      iconName: "alert",
      title: "Не удалось загрузить данные",
      text: esc(message || "Проверьте, что приложение запущено, и попробуйте снова."),
      danger: true,
      actions: `<button class="btn btn-primary" data-action="retry">${icon("refresh")}Повторить</button>`,
    })}</div>`;
  }

  /* ---------------------------------------------------------- sidebar & routing */
  function updateSidebar(summary) {
    if (!summary) return;
    const total = Number(summary.total_remaining || 0);
    const principal = Number(summary.total_principal || 0);
    const progress = principal > 0 ? Math.min(100, Math.max(0, ((principal - total) / principal) * 100)) : 0;
    const totalElement = $("#side-total");
    const progressElement = $("#side-progress");
    const subElement = $("#side-sub");
    if (totalElement) totalElement.textContent = fmtMoney(total);
    if (progressElement) progressElement.style.width = `${progress}%`;
    if (subElement) {
      if (summary.active_count) {
        subElement.textContent = `${summary.active_count} ${plural(summary.active_count, ["активный долг", "активных долга", "активных долгов"])} · выплачено ${progress.toFixed(0)}%`;
      } else {
        subElement.textContent = "Нет активных долгов";
      }
    }
    updateIncomeBell(summary.income);
  }

  function updateIncomeBell(income) {
    const bell = $("#income-bell");
    const dot = $("#income-bell-dot");
    if (!bell || !dot) return;
    const reminders = (income && income.reminders) || {};
    const today = reminders.today || [];
    const missed = reminders.missed || [];
    const primary = today[0] || missed[0] || null;
    dot.hidden = !primary;
    bell.classList.toggle("has-reminder", Boolean(primary));
    if (primary) bell.dataset.source = primary.source_id || "";
    else delete bell.dataset.source;
    const label = primary
      ? (today.length
        ? `Сегодня ожидается поступление: ${today.map((item) => item.name).join(", ")}`
        : `Не отмечено поступление: ${missed[0].name}`)
      : "Доходы и поступления";
    bell.title = label;
    bell.setAttribute("aria-label", label);
  }

  async function refreshSidebar() {
    const requestId = ++sidebarRequest;
    try {
      const summary = await api("/api/summary");
      if (requestId !== sidebarRequest) return;
      state.summary = summary;
      updateSidebar(summary);
    } catch (error) {
      /* silent */
    }
  }

  function routeFromHash() {
    const raw = location.hash.replace(/^#\/?/, "").split("?")[0];
    return ["dashboard", "debts", "incomes", "schedule", "history", "analytics", "settings"].includes(raw) ? raw : "dashboard";
  }

  async function navigate() {
    state.route = routeFromHash();
    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.route === state.route));
    if (!location.hash) history.replaceState(null, "", "#/dashboard");
    await loadRoute(state.route);
    refreshSidebar();
  }

  async function loadRoute(route) {
    disposePageCharts();
    const view = $("#view");
    if (!view) return;
    view.innerHTML = skeletonHtml();
    try {
      if (route === "dashboard") await loadDashboard();
      else if (route === "debts") await loadDebts();
      else if (route === "incomes") await loadIncomes();
      else if (route === "schedule") await loadSchedule();
      else if (route === "history") await loadHistory();
      else if (route === "analytics") await loadAnalytics();
      else if (route === "settings") await loadSettings();
      fillIcons(view);
      refreshSidebar();
    } catch (error) {
      view.innerHTML = errorHtml(error.message);
      fillIcons(view);
    }
  }

  function setView(html) {
    const view = $("#view");
    view.innerHTML = `<div class="view-inner">${html}</div>`;
  }

  /* ---------------------------------------------------------- dashboard */
  async function loadDashboard() {
    const [summary, analytics] = await Promise.all([api("/api/summary"), api("/api/analytics")]);
    state.summary = summary;
    state.analytics = analytics;
    updateSidebar(summary);

    if (!summary.active_count && !summary.closed_count) {
      setView(`${pageHead("Обзор", "Локальный трекер долгов и графика платежей", `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`)}${onboardingHtml()}`);
      maybePromptIncome(summary.income);
      return;
    }

    if (!summary.active_count) {
      setView(`${pageHead("Обзор", "Активных долгов нет — все обязательства закрыты", `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`)}
        ${incomeReminderBannerHtml(summary.income)}
        <section class="card">${emptyState({
          iconName: "checkCircle",
          title: "Все долги закрыты",
          text: "Отличная работа. Если появится новый кредит или рассрочка — добавьте его, и приложение снова построит график.",
          actions: `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button><a class="btn btn-ghost" href="#/debts">${icon("wallet")}Закрытые долги</a>`,
        })}</section>`);
      maybePromptIncome(summary.income);
      return;
    }

    setView(dashboardHtml(summary, analytics));
    renderDashboardCharts(summary, analytics);
    maybePromptIncome(summary.income);
  }

  function onboardingHtml() {
    return `<section class="card">${emptyState({
      iconName: "wallet",
      title: "Начните вести учёт долгов",
      text: "Добавьте кредит, ипотеку или рассрочку — приложение построит график платежей, посчитает переплату и покажет прогноз выплат. Всё хранится локально на компьютере.",
      actions: `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить первый долг</button>
        <button class="btn btn-ghost" data-action="add-income-source">${icon("income")}Настроить доходы</button>
        <button class="btn btn-ghost" data-action="load-demo">${icon("sparkles")}Загрузить демо-данные</button>`,
    })}</section>`;
  }

  function dashboardHtml(summary, analytics) {
    const next = summary.next_payment;
    const head = pageHead(
      "Обзор",
      `${summary.active_count} ${plural(summary.active_count, ["активный долг", "активных долга", "активных долгов"])}${summary.payoff_date ? ` · полное погашение ${fmtDate(summary.payoff_date)}` : ""}`,
      `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`
    );

    return `${head}
      ${overdueBannerHtml(summary)}
      ${incomeReminderBannerHtml(summary.income)}
      ${incomeStripHtml(summary.income)}
      ${kpiHtml(summary)}
      ${dashboardChartsHtml(summary, analytics)}
      ${upcomingAndFlowHtml(summary, analytics)}
      ${miniDebtsHtml(analytics.by_debt || [])}`;
  }

  function overdueBannerHtml(summary) {
    if (!summary.overdue_count) return "";
    return `<div class="alert-banner">
      <div class="alert-icon">${icon("alert", 19)}</div>
      <div class="alert-text">
        <b>Просрочено ${summary.overdue_count} ${plural(summary.overdue_count, ["платёж", "платежа", "платежей"])} на ${fmtMoney(summary.overdue_amount)}</b>
        <span>Отметьте оплату или проверьте график — просрочки влияют на кредитную историю.</span>
      </div>
      <div class="alert-actions"><a class="btn btn-ghost btn-sm" href="#/schedule">Открыть график</a></div>
    </div>`;
  }

  function incomeReminderBannerHtml(income) {
    const reminders = income && income.reminders;
    if (!reminders) return "";
    const today = reminders.today || [];
    const missed = reminders.missed || [];
    if (!today.length && !missed.length) return "";

    const primary = today[0] || missed[0];
    const title = today.length
      ? `Сегодня ожидается поступление: ${today.map((item) => item.name).join(", ")}`
      : `Не отмечено поступление: ${missed[0].name} (${fmtDateShort(missed[0].date)})`;
    const text = today.length
      ? "Сколько вы получили? Введите сумму — приложение предложит, сколько отложить на платежи и досрочное погашение."
      : "Похоже, вы пропустили выплату. Внесите сумму, чтобы обновить распределение.";

    return `<div class="alert-banner income-alert">
      <div class="alert-icon">${icon("bell", 19)}</div>
      <div class="alert-text"><b>${esc(title)}</b><span>${text}</span></div>
      <div class="alert-actions"><button class="btn btn-primary btn-sm" data-action="receive-income" data-source="${primary.source_id || ""}">${icon("plus", 14)}Ввести сумму</button></div>
    </div>`;
  }

  function incomeStripHtml(income) {
    if (!income) return "";
    if (!income.source_count) {
      return `<section class="card income-strip income-setup">
        <div class="income-setup-icon">${icon("income", 22)}</div>
        <div class="income-setup-text">
          <b>Настройте поступления</b>
          <span>Укажите дни зарплаты и аванса — приложение напомнит в день выплаты и предложит распределение: обязательные платежи, затем досрочное погашение долгов с самой высокой ставкой.</span>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="add-income-source">${icon("plus", 14)}Настроить</button>
      </section>`;
    }

    const next = income.next_income;
    return `<section class="card income-strip">
      <div class="income-strip-head">
        <div>
          <h2>Доходы и распределение</h2>
          <p>${next ? `Ближайшее поступление ${fmtDateShort(next.date)} · ${next.sources.map((item) => esc(item.name)).join(", ")}` : "Сначала обязательные платежи, затем досрочное погашение"}</p>
        </div>
        <div class="income-strip-actions">
          <button class="btn btn-primary btn-sm" data-action="receive-income">${icon("plus", 14)}Ввести поступление</button>
          <a class="card-link" href="#/incomes">Все доходы ${icon("arrowRight")}</a>
        </div>
      </div>
      <div class="income-strip-grid">
        <div class="income-strip-metric">
          <span>Получено в этом месяце</span>
          <b>${fmtMoney(income.month_received)}</b>
          <small>${income.month_count} ${plural(income.month_count, ["поступление", "поступления", "поступлений"])}</small>
        </div>
        <div class="income-strip-metric">
          <span>Отложено на платежи</span>
          <b>${fmtMoney(income.reserved_payments)}</b>
          <small>досрочно запланировано ${fmtMoney(income.planned_early)}</small>
        </div>
        <div class="income-strip-metric income-strip-free">
          <span>Свободные деньги</span>
          <b>${fmtMoney(income.free)}</b>
          <small>из ${fmtMoney(income.total_received)} полученных</small>
        </div>
      </div>
    </section>`;
  }

  function maybePromptIncome(income) {
    const today = income && income.reminders && income.reminders.today;
    if (!today || !today.length) return;
    const key = `income-prompt-${todayISO()}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch (error) {
      /* sessionStorage может быть недоступен */
    }
    const primary = today[0];
    setTimeout(() => {
      openIncomeModal({ sourceId: primary.source_id, reminder: primary });
    }, 420);
  }

  function kpiHtml(summary) {
    const next = summary.next_payment;
    const principalProgress = summary.total_principal > 0
      ? Math.min(100, Math.max(0, ((summary.total_principal - summary.total_remaining) / summary.total_principal) * 100))
      : 0;
    const monthProgress = summary.month_due > 0
      ? Math.min(100, Math.max(0, (summary.month_paid / summary.month_due) * 100))
      : 0;

    return `<div class="kpi-grid">
      <article class="card kpi-card kpi-hero">
        <div class="kpi-top"><span class="kpi-label">Остаток основного долга</span><span class="kpi-icon accent">${icon("wallet")}</span></div>
        <div class="kpi-value">${fmtMoney(summary.total_remaining)}</div>
        <div class="kpi-sub">к оплате по графику <b>${fmtMoney(summary.total_pending)}</b></div>
        <div class="kpi-progress">
          <div class="kpi-progress-row"><span>Тело долга выплачено</span><span>${principalProgress.toFixed(1)}%</span></div>
          <div class="progress"><span style="width:${principalProgress}%"></span></div>
        </div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-top"><span class="kpi-label">Выплачено всего</span><span class="kpi-icon green">${icon("checkCircle")}</span></div>
        <div class="kpi-value">${fmtMoney(summary.total_paid)}</div>
        <div class="kpi-sub">${summary.paid_count} ${plural(summary.paid_count, ["платёж", "платежа", "платежей"])} за всё время</div>
        <div class="kpi-progress">
          <div class="progress"><span style="width:${summary.progress}%"></span></div>
          <div class="kpi-progress-row" style="margin-top:7px;margin-bottom:0"><span>Прогресс по графику</span><span>${summary.progress.toFixed(1)}%</span></div>
        </div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-top"><span class="kpi-label">К оплате в этом месяце</span><span class="kpi-icon amber">${icon("calendar")}</span></div>
        <div class="kpi-value sm">${fmtMoney(summary.month_due)}</div>
        <div class="kpi-sub">оплачено ${fmtMoney(summary.month_paid)} · ${summary.month_paid_count} из ${summary.month_count}</div>
        <div class="kpi-progress">
          <div class="progress"><span style="width:${monthProgress}%"></span></div>
          <div class="kpi-progress-row" style="margin-top:7px;margin-bottom:0"><span>Платежи месяца</span><span>${monthProgress.toFixed(0)}%</span></div>
        </div>
      </article>

      <article class="card kpi-card">
        <div class="kpi-top"><span class="kpi-label">Ближайший платёж</span><span class="kpi-icon cyan">${icon("clock")}</span></div>
        <div class="kpi-value sm">${next ? fmtMoney(next.amount) : "—"}</div>
        <div class="kpi-sub">${next ? `${esc(next.title)} · ${fmtDateShort(next.due_date)}` : "Нет запланированных платежей"}</div>
        <div class="kpi-progress">
          ${next
            ? `<span class="badge ${next.overdue ? "badge-danger" : "badge-accent"}">${next.overdue ? daysLeftText(next.days_left) : daysLeftText(next.days_left)}</span>`
            : `<span class="badge badge-muted">Свободно</span>`}
        </div>
      </article>
    </div>`;
  }

  function dashboardChartsHtml(summary, analytics) {
    const byDebt = analytics.by_debt || [];
    const total = byDebt.reduce((sum, item) => sum + Number(item.remaining || 0), 0);
    const payoffChip = summary.payoff_date ? `<span class="chip">до ${monthYearShort(summary.payoff_date)}</span>` : "";

    return `<div class="grid grid-2-1" style="margin-bottom:16px">
      <section class="card chart-card">
        <div class="card-head">
          <div><h2>Динамика остатка</h2><p>Прогноз по текущему графику платежей</p></div>
          ${payoffChip}
        </div>
        <div class="chart-box tall"><canvas id="chart-balance" aria-label="График остатка долга"></canvas></div>
      </section>

      <section class="card chart-card">
        <div class="card-head"><div><h2>Структура долгов</h2><p>Остаток основного долга</p></div></div>
        <div class="chart-box donut donut-wrap">
          <canvas id="chart-structure" aria-label="Структура долгов"></canvas>
          <div class="donut-center"><b>${fmtMoney(total)}</b><span>остаток</span></div>
        </div>
        <ul class="legend">
          ${byDebt.slice(0, 6).map((item) => `<li class="legend-item"><i style="background:${item.color}"></i><span>${esc(item.title)}</span><b>${fmtMoney(item.remaining)}</b></li>`).join("")}
        </ul>
      </section>
    </div>`;
  }

  function upcomingAndFlowHtml(summary, analytics) {
    const upcoming = summary.upcoming || [];
    return `<div class="grid grid-1-2" style="margin-bottom:16px">
      <section class="card">
        <div class="card-head">
          <div><h2>Ближайшие платежи</h2><p>По графику на ближайшие недели</p></div>
          <a class="card-link" href="#/schedule">График ${icon("arrowRight")}</a>
        </div>
        ${upcoming.length ? `<div class="pay-list">${upcoming.map((item) => upcomingItemHtml(item)).join("")}</div>` : emptyState({
          iconName: "calendar",
          title: "Предстоящих платежей нет",
          text: "Все ближайшие платежи уже отмечены. Загляните в график, чтобы увидеть будущие месяцы.",
          compact: true,
        })}
      </section>

      <section class="card chart-card">
        <div class="card-head"><div><h2>План и факт</h2><p>Платежи по месяцам</p></div></div>
        <div class="chart-box"><canvas id="chart-flow" aria-label="График плана и факта платежей"></canvas></div>
      </section>
    </div>`;
  }

  function upcomingItemHtml(item) {
    const date = parseISO(item.due_date);
    const day = date ? date.getDate() : "—";
    const month = date ? MONTHS_SHORT[date.getMonth()] : "";
    return `<div class="pay-item">
      <div class="date-badge"><b>${day}</b><span>${month}</span></div>
      <div class="pay-main">
        <b>${esc(item.title)}</b>
        <span>${daysLeftText(item.days_left)}</span>
      </div>
      <div class="pay-amount">${fmtMoney(item.amount)}</div>
      <button class="icon-btn pay-action" data-action="pay" data-payment="${item.id}" data-amount="${item.amount}" data-due="${item.due_date}" data-title="${esc(item.title)}" title="Отметить оплату" aria-label="Отметить оплату">
        ${icon("check")}
      </button>
    </div>`;
  }

  function miniDebtsHtml(byDebt) {
    if (!byDebt.length) return "";
    return `<section class="card">
      <div class="card-head">
        <div><h2>Прогресс по долгам</h2><p>Выплачено тело каждого долга</p></div>
        <a class="card-link" href="#/debts">Все долги ${icon("arrowRight")}</a>
      </div>
      <div class="mini-debts">
        ${byDebt.map((item) => {
          const principal = Number(item.principal || 0);
          const progress = principal > 0 ? Math.min(100, Math.max(0, ((principal - Number(item.remaining || 0)) / principal) * 100)) : 0;
          return `<div class="mini-debt">
            <div class="mini-head"><span class="dot" style="background:${item.color}"></span><b>${esc(item.title)}</b><span class="mini-remaining">${fmtMoney(item.remaining)}</span></div>
            <div class="mini-bar-row"><div class="progress"><span style="width:${progress}%"></span></div><span>${progress.toFixed(0)}%</span></div>
            <div class="mini-sub">Выплачено ${fmtMoney(item.paid)}</div>
          </div>`;
        }).join("")}
      </div>
    </section>`;
  }

  function renderDashboardCharts(summary, analytics) {
    createBalanceChart("chart-balance", analytics.balance_series || []);
    createStructureChart("chart-structure", analytics.by_debt || []);
    createFlowChart("chart-flow", analytics.flow || []);
  }

  /* ---------------------------------------------------------- debts */
  async function loadDebts() {
    const data = await api("/api/debts");
    state.debts = data.items || [];
    const active = state.debts.filter((debt) => debt.status === "active").length;
    const closed = state.debts.length - active;
    const remaining = state.debts.reduce((sum, debt) => sum + Number(debt.remaining_principal || 0), 0);

    setView(`${pageHead(
      "Мои долги",
      `${active} ${plural(active, ["активный", "активных", "активных"])} · ${closed} ${plural(closed, ["закрытый", "закрытых", "закрытых"])} · остаток ${fmtMoney(remaining)}`,
      `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`
    )}
    <div class="toolbar">
      <div class="search">${icon("search")}<input id="debts-search" type="search" placeholder="Поиск по названию или кредитору" value="${esc(state.debtFilters.q)}" autocomplete="off"></div>
      <div class="segmented" id="debts-status">
        <button data-action="debts-status" data-status="active" class="${state.debtFilters.status === "active" ? "active" : ""}">Активные</button>
        <button data-action="debts-status" data-status="all" class="${state.debtFilters.status === "all" ? "active" : ""}">Все</button>
        <button data-action="debts-status" data-status="closed" class="${state.debtFilters.status === "closed" ? "active" : ""}">Закрытые</button>
      </div>
      <select class="select" id="debts-sort" aria-label="Сортировка">
        <option value="next" ${state.debtFilters.sort === "next" ? "selected" : ""}>По ближайшему платежу</option>
        <option value="remaining" ${state.debtFilters.sort === "remaining" ? "selected" : ""}>По остатку</option>
        <option value="principal" ${state.debtFilters.sort === "principal" ? "selected" : ""}>По сумме долга</option>
        <option value="title" ${state.debtFilters.sort === "title" ? "selected" : ""}>По названию</option>
      </select>
    </div>
    <div class="debts-grid" id="debts-grid"></div>`);

    renderDebtGrid();

    const search = $("#debts-search");
    if (search) {
      search.addEventListener("input", () => {
        state.debtFilters.q = search.value;
        renderDebtGrid();
      });
    }
    const sort = $("#debts-sort");
    if (sort) {
      sort.addEventListener("change", () => {
        state.debtFilters.sort = sort.value;
        renderDebtGrid();
      });
    }
  }

  function filteredDebts() {
    const { q, status, sort } = state.debtFilters;
    const query = q.trim().toLowerCase();
    let items = state.debts.filter((debt) => {
      const matchesStatus = status === "all" || debt.status === status;
      const matchesQuery = !query
        || debt.title.toLowerCase().includes(query)
        || (debt.creditor || "").toLowerCase().includes(query)
        || (debt.type_label || "").toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });

    items = [...items].sort((left, right) => {
      if (sort === "remaining") return Number(right.remaining_principal) - Number(left.remaining_principal);
      if (sort === "principal") return Number(right.principal) - Number(left.principal);
      if (sort === "title") return left.title.localeCompare(right.title, "ru");
      const leftDate = left.next_payment ? left.next_payment.due_date : "9999-12-31";
      const rightDate = right.next_payment ? right.next_payment.due_date : "9999-12-31";
      return leftDate.localeCompare(rightDate);
    });
    return items;
  }

  function renderDebtGrid() {
    const grid = $("#debts-grid");
    if (!grid) return;
    const items = filteredDebts();
    if (!items.length) {
      grid.innerHTML = `<div class="card" style="grid-column:1/-1">${emptyState({
        iconName: "search",
        title: "Ничего не найдено",
        text: state.debtFilters.q ? "Попробуйте изменить запрос или сбросить фильтр." : "В этом разделе пока нет долгов. Добавьте первый — график построится автоматически.",
        actions: `<button class="btn btn-ghost" data-action="add-debt">${icon("plus")}Добавить долг</button>`,
        compact: true,
      })}</div>`;
      return;
    }
    grid.innerHTML = items.map((debt) => debtCardHtml(debt)).join("");
  }

  function debtCardHtml(debt) {
    const meta = typeMeta(debt.type);
    const closed = debt.status === "closed";
    const next = debt.next_payment;
    let nextHtml = `<span class="badge badge-muted">Закрыт</span>`;
    if (!closed) {
      if (next) {
        nextHtml = `${next.overdue ? `<span class="text-danger">просрочен</span> · ` : ""}${fmtDateShort(next.due_date)} · <b>${fmtMoney(next.amount)}</b>`;
      } else {
        nextHtml = `<span class="badge badge-success">Все платежи внесены</span>`;
      }
    }

    let actions = "";
    if (closed) {
      actions = `<button class="btn btn-ghost btn-sm" data-action="reopen-debt" data-id="${debt.id}">Вернуть в работу</button>`;
    } else {
      actions = `${next ? `<button class="btn btn-ghost btn-sm" data-action="pay" data-payment="${next.payment_id}" data-amount="${next.amount}" data-due="${next.due_date}" data-title="${esc(debt.title)}">${icon("check", 15)}Оплатить</button>` : ""}
        <button class="icon-btn sm" data-action="edit-debt" data-id="${debt.id}" title="Редактировать" aria-label="Редактировать">${icon("edit", 15)}</button>
        <button class="icon-btn sm danger" data-action="delete-debt" data-id="${debt.id}" title="Удалить" aria-label="Удалить">${icon("trash", 15)}</button>`;
    }

    const rate = Number(debt.rate) > 0 ? `${Number(debt.rate).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%` : "0%";
    return `<article class="card debt-card" data-action="open-debt" data-id="${debt.id}" tabindex="0" role="button" aria-label="Открыть долг ${esc(debt.title)}" style="--debt-color:${debt.color}">
      <div class="debt-head">
        <div class="debt-icon">${icon(meta.icon, 21)}</div>
        <div class="debt-title">
          <h3>${esc(debt.title)}</h3>
          <span>${esc(debt.creditor || "Без кредитора")} · ${meta.label}</span>
        </div>
        <div class="debt-badges">
          ${closed ? `<span class="badge badge-muted">Закрыт</span>` : next && next.overdue ? `<span class="badge badge-danger">Просрочка</span>` : ""}
        </div>
      </div>
      <div class="debt-amount">
        <span>Осталось выплатить</span>
        <strong>${fmtMoney(debt.remaining_total)}</strong>
        <small>основной долг ${fmtMoney(debt.remaining_principal)}</small>
      </div>
      <div class="progress-row">
        <div class="progress"><span style="width:${debt.progress}%"></span></div>
        <span>${Number(debt.progress).toFixed(0)}%</span>
      </div>
      <div class="debt-meta">
        <div><span>Платёж/мес</span><b>${fmtMoney(debt.monthly_payment_avg)}</b></div>
        <div><span>Ставка</span><b>${rate}</b></div>
        <div><span>Срок</span><b>${debt.term_months} мес.</b></div>
      </div>
      <div class="debt-foot">
        <div class="debt-next ${next && next.overdue ? "overdue" : ""}">${nextHtml}</div>
        <div class="debt-actions">${actions}</div>
      </div>
    </article>`;
  }

  /* ---------------------------------------------------------- schedule */
  async function loadSchedule() {
    const [schedule, overdue] = await Promise.all([
      api(`/api/schedule?month=${encodeURIComponent(state.month)}`),
      api("/api/overdue"),
    ]);
    const overdueItems = overdue.items || [];
    const totals = schedule.totals || { planned: 0, paid: 0, count: 0, paid_count: 0 };
    const remaining = Math.max(0, Number(totals.planned) - Number(totals.paid));

    let overdueHtml = "";
    if (overdueItems.length) {
      const earliest = overdueItems[0];
      overdueHtml = `<div class="alert-banner">
        <div class="alert-icon">${icon("alert", 19)}</div>
        <div class="alert-text">
          <b>Просрочено ${overdueItems.length} ${plural(overdueItems.length, ["платёж", "платежа", "платежей"])} на ${fmtMoney(overdueItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))}</b>
          <span>Самый ранний — ${fmtDate(earliest.due_date)}, долг «${esc(earliest.title)}».</span>
        </div>
        <div class="alert-actions"><button class="btn btn-ghost btn-sm" data-action="goto-overdue" data-month="${earliest.due_date.slice(0, 7)}">Показать</button></div>
      </div>`;
    }

    setView(`${pageHead(
      "График платежей",
      `${fmtMonthFull(state.month)} · ${totals.count} ${plural(totals.count, ["платёж", "платежа", "платежей"])} · оплачено ${totals.paid_count}`,
      `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`
    )}
    ${overdueHtml}
    <div class="card month-bar">
      <div class="month-nav">
        <button class="icon-btn" data-action="month-prev" aria-label="Предыдущий месяц">${icon("chevronLeft")}</button>
        <div class="month-title"><b>${fmtMonthFull(state.month)}</b><span>${totals.count} ${plural(totals.count, ["платёж", "платежа", "платежей"])}</span></div>
        <button class="icon-btn" data-action="month-next" aria-label="Следующий месяц">${icon("chevronRight")}</button>
        <button class="btn btn-ghost btn-sm" data-action="month-today">Сегодня</button>
      </div>
      <div class="month-stats">
        <div class="month-stat"><span>К оплате</span><b>${fmtMoney(totals.planned)}</b></div>
        <div class="month-stat"><span>Оплачено</span><b class="text-success">${fmtMoney(totals.paid)}</b></div>
        <div class="month-stat"><span>Осталось</span><b>${fmtMoney(remaining)}</b></div>
      </div>
    </div>
    <div id="schedule-list">${scheduleGroupsHtml(schedule.items || [])}</div>`);
  }

  function scheduleGroupsHtml(items) {
    if (!items.length) {
      return `<section class="card">${emptyState({
        iconName: "calendar",
        title: "На этот месяц платежей нет",
        text: "Выберите другой месяц или добавьте новый долг — платежи появятся в графике автоматически.",
        actions: `<button class="btn btn-ghost" data-action="month-today">К текущему месяцу</button><button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`,
        compact: true,
      })}</section>`;
    }

    const groups = new Map();
    items.forEach((item) => {
      if (!groups.has(item.due_date)) groups.set(item.due_date, []);
      groups.get(item.due_date).push(item);
    });

    return Array.from(groups.entries()).map(([dueDate, rows]) => {
      const date = parseISO(dueDate);
      const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      return `<div class="day-group">
        <div class="day-head">
          <div class="day-num">${date ? date.getDate() : "—"}</div>
          <div class="day-date"><b>${date ? capitalize(WEEKDAYS_FULL[date.getDay()]) : ""}</b><span>${fmtDate(dueDate)}</span></div>
          <div class="day-total">${rows.length} ${plural(rows.length, ["платёж", "платежа", "платежей"])} · ${fmtMoney(total)}</div>
        </div>
        ${rows.map((row) => scheduleRowHtml(row)).join("")}
      </div>`;
    }).join("");
  }

  function scheduleRowHtml(row) {
    const paid = row.status === "paid";
    let badge = `<span class="badge badge-muted">Ожидается</span>`;
    if (paid) badge = `<span class="badge badge-success">Оплачен</span>`;
    else if (row.overdue) badge = `<span class="badge badge-danger">Просрочен</span>`;
    else if (row.due_date === todayISO()) badge = `<span class="badge badge-warning">Сегодня</span>`;

    const sub = paid
      ? `${esc(row.creditor || row.type_label)} · оплачено ${row.paid_date ? fmtDateShort(row.paid_date) : ""}`
      : `${esc(row.creditor || row.type_label)} · ${row.type_label}`;

    const action = paid
      ? `<button class="icon-btn sm" data-action="undo-pay" data-payment="${row.id}" data-title="${esc(row.title)}" title="Отменить оплату" aria-label="Отменить оплату">${icon("undo", 15)}</button>`
      : `<button class="btn btn-ghost btn-sm" data-action="pay" data-payment="${row.id}" data-amount="${row.amount}" data-due="${row.due_date}" data-title="${esc(row.title)}">${icon("check", 15)}Оплатить</button>`;

    return `<div class="card pay-row ${paid ? "is-paid" : ""} ${row.overdue ? "is-overdue" : ""}">
      <span class="dot" style="background:${row.color}"></span>
      <div class="pay-row-main"><b>${esc(row.title)}</b><span>${sub}</span></div>
      <div class="pay-row-right">
        ${badge}
        <span class="pay-row-amount">${fmtMoney(row.amount)}</span>
        <div class="pay-row-actions">${action}</div>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------- incomes */
  async function loadIncomes() {
    const data = await api("/api/incomes");
    state.incomes = data;
    const summary = data.summary || {};
    const reminders = data.reminders || {};

    setView(`${pageHead(
      "Доходы",
      "Зарплата, авансы и распределение поступлений",
      `<button class="btn btn-ghost" data-action="add-income-source">${icon("plus")}Источник</button>
       <button class="btn btn-primary" data-action="receive-income">${icon("income")}Ввести поступление</button>`
    )}
    ${incomeReminderBannerHtml({ ...summary, reminders })}
    ${incomeKpisHtml(summary)}
    <div class="grid grid-2 income-layout" style="margin-bottom:16px">
      ${incomeSourcesCardHtml(data.sources || [])}
      ${incomeNextCardHtml(reminders, summary)}
    </div>
    ${incomeReceiptsCardHtml(data.receipts || [])}`);
  }

  function incomeKpisHtml(summary) {
    return `<div class="income-kpis">
      <article class="card income-metric">
        <div class="income-metric-top"><span>Получено в этом месяце</span>${icon("income", 18)}</div>
        <b>${fmtMoney(summary.month_received)}</b>
        <small>${summary.month_count} ${plural(summary.month_count, ["поступление", "поступления", "поступлений"])} · свободно ${fmtMoney(summary.month_free)}</small>
      </article>
      <article class="card income-metric">
        <div class="income-metric-top"><span>Отложено на платежи</span>${icon("calendar", 18)}</div>
        <b>${fmtMoney(summary.reserved_payments)}</b>
        <small>досрочное погашение — ${fmtMoney(summary.planned_early)}</small>
      </article>
      <article class="card income-metric income-metric-free">
        <div class="income-metric-top"><span>Свободные деньги</span>${icon("wallet", 18)}</div>
        <b>${fmtMoney(summary.free)}</b>
        <small>из ${fmtMoney(summary.total_received)} полученных за всё время</small>
      </article>
    </div>`;
  }

  function incomeSourcesCardHtml(sources) {
    return `<section class="card">
      <div class="card-head">
        <div><h2>Источники дохода</h2><p>Даты зарплаты, аванса и других поступлений</p></div>
        <button class="btn btn-ghost btn-sm" data-action="add-income-source">${icon("plus", 14)}Добавить</button>
      </div>
      ${sources.length ? `<div class="income-source-list">${sources.map((source) => incomeSourceHtml(source)).join("")}</div>` : emptyState({
        iconName: "income",
        title: "Пока нет источников",
        text: "Добавьте зарплату и аванс — приложение будет напоминать в дни выплат и предлагать распределение.",
        actions: `<button class="btn btn-primary btn-sm" data-action="add-income-source">${icon("plus", 14)}Настроить доходы</button>`,
        compact: true,
      })}
    </section>`;
  }

  function incomeSourceHtml(source) {
    const meta = INCOME_KINDS[source.kind] || INCOME_KINDS.other;
    const days = source.days_label || (source.days || []).join(", ");
    const daysText = (source.days || []).length === 1 ? `${days} число` : `${days} числа`;
    const badgeLabel = source.active ? (meta.label === source.name ? "Активен" : meta.label) : "Выключен";
    return `<article class="income-source ${source.active ? "" : "is-inactive"}">
      <div class="income-source-avatar" style="--income-color:${source.color || meta.color}">${icon(source.kind === "advance" ? "calendar" : "income", 20)}</div>
      <div class="income-source-main">
        <div class="income-source-title">
          <b>${esc(source.name)}</b>
          <span class="badge ${source.active ? "badge-success" : "badge-muted"}">${badgeLabel}</span>
        </div>
        <div class="income-source-meta">
          <span>${daysText}</span>
          <span>${source.expected_amount ? `ожидается ${fmtMoney(source.expected_amount)}` : "сумма не задана"}</span>
          ${source.next_date ? `<span>далее ${fmtDateShort(source.next_date)}</span>` : ""}
        </div>
      </div>
      <div class="income-source-actions">
        <button class="btn btn-ghost btn-sm" data-action="receive-income" data-source="${source.id}">${icon("plus", 14)}Получить</button>
        <button class="icon-btn sm" data-action="edit-income-source" data-id="${source.id}" title="Изменить" aria-label="Изменить">${icon("edit", 15)}</button>
        <button class="icon-btn sm danger" data-action="delete-income-source" data-id="${source.id}" title="Удалить" aria-label="Удалить">${icon("trash", 15)}</button>
      </div>
    </article>`;
  }

  function incomeNextCardHtml(reminders, summary) {
    const next = reminders.next;
    return `<section class="card">
      <div class="card-head">
        <div><h2>Ближайшие поступления</h2><p>${summary.active_sources} ${plural(summary.active_sources, ["активный источник", "активных источника", "активных источников"])}</p></div>
        <button class="btn btn-ghost btn-sm" data-action="add-income-source">${icon("plus", 14)}Добавить</button>
      </div>
      ${next ? `<div class="income-next-card">
        <div class="income-next-date">${fmtDateShort(next.date)}</div>
        <div class="income-next-list">
          ${next.sources.map((source) => `<div class="income-next-item">
            <i style="background:${source.color}"></i>
            <div><b>${esc(source.name)}</b><span>${source.kind_label}${source.expected_amount ? ` · ${fmtMoney(source.expected_amount)}` : ""}</span></div>
          </div>`).join("")}
        </div>
      </div>` : emptyState({
        iconName: "calendar",
        title: "Поступлений не запланировано",
        text: "Добавьте источник дохода с датой выплаты, чтобы получать напоминания.",
        compact: true,
      })}
      <div class="income-rule">
        <b>Как считается распределение</b>
        <ul>
          <li>Сначала просроченные и ближайшие платежи на 30 дней.</li>
          <li>Остаток — на досрочное погашение долга с максимальной ставкой.</li>
          <li>Свободные деньги остаются на руках — сумму можно изменить.</li>
        </ul>
      </div>
    </section>`;
  }

  function incomeReceiptsCardHtml(receipts) {
    return `<section class="card">
      <div class="card-head">
        <div><h2>История поступлений</h2><p>Каждая выплата и её распределение</p></div>
        <span class="chip">${receipts.length} ${plural(receipts.length, ["запись", "записи", "записей"])}</span>
      </div>
      ${receipts.length ? `<div class="detail-table-wrap">
        <table class="data-table income-table">
          <thead><tr>
            <th>Дата</th>
            <th>Источник</th>
            <th class="num">Получено</th>
            <th class="num">На платежи</th>
            <th class="num">Досрочно</th>
            <th class="num">Свободно</th>
            <th></th>
          </tr></thead>
          <tbody>${receipts.map((receipt) => `<tr>
            <td>${fmtDate(receipt.received_date)}</td>
            <td class="title-cell"><b>${esc(receipt.source_name || "Разовое поступление")}</b><span>${esc(receipt.source_kind_label || "Доход")}</span></td>
            <td class="num strong">${fmtMoney(receipt.amount)}</td>
            <td class="num">${fmtMoney(receipt.payment_total)}</td>
            <td class="num">${fmtMoney(receipt.early_total)}</td>
            <td class="num ${receipt.free > 0 ? "text-success" : ""}">${fmtMoney(receipt.free)}</td>
            <td class="num">
              <button class="icon-btn sm" data-action="open-income-receipt" data-id="${receipt.id}" title="Детали" aria-label="Детали">${icon("info", 15)}</button>
              <button class="icon-btn sm danger" data-action="delete-income-receipt" data-id="${receipt.id}" title="Удалить" aria-label="Удалить">${icon("trash", 15)}</button>
            </td>
          </tr>`).join("")}</tbody>
        </table>
      </div>` : emptyState({
        iconName: "income",
        title: "Поступлений пока нет",
        text: "Когда вы получите зарплату или аванс, внесите сумму — приложение сохранит план распределения.",
        actions: `<button class="btn btn-primary btn-sm" data-action="receive-income">${icon("plus", 14)}Ввести поступление</button>`,
        compact: true,
      })}
    </section>`;
  }

  async function openIncomeSourceForm(source = null) {
    const item = source && typeof source === "object"
      ? source
      : (state.incomes && state.incomes.sources || []).find((row) => String(row.id) === String(source));
    const isEdit = Boolean(item && item.id);
    const kind = item ? item.kind : "salary";
    const body = `<form id="income-source-form">
      <div class="form-grid">
        <label class="field"><span>Название</span>
          <input name="name" maxlength="120" required placeholder="Например, зарплата" value="${esc(item ? item.name : "")}">
        </label>
        <label class="field"><span>Тип</span>
          <select name="kind">
            ${Object.entries(INCOME_KINDS).map(([value, meta]) => `<option value="${value}" ${kind === value ? "selected" : ""}>${meta.label}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>Дни месяца <em>*</em></span>
          <input name="days" required placeholder="7, 10, 12" value="${esc(item ? item.days_label || (item.days || []).join(", ") : "")}">
          <span class="field-hint">Можно несколько дат через запятую. Если дня нет в месяце, используется последний день.</span>
        </label>
        <label class="field"><span>Ожидаемая сумма, ${esc(state.settings.currency)}</span>
          <input name="expected_amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Необязательно" value="${item && item.expected_amount ? Number(item.expected_amount).toFixed(2) : ""}">
        </label>
        <label class="field full checkbox-field"><input name="active" type="checkbox" ${!item || item.active ? "checked" : ""}><span>Напоминать в дни выплат</span></label>
        <label class="field full"><span>Заметка</span>
          <textarea name="notes" maxlength="2000" placeholder="Необязательно">${esc(item ? item.notes || "" : "")}</textarea>
        </label>
      </div>
    </form>`;
    openModal({
      title: isEdit ? "Изменить источник" : "Новый источник дохода",
      subtitle: "Например: зарплата 7, 10 и 12 числа, аванс — 23, 25 и 27",
      body,
      footer: `<button class="btn btn-ghost" data-action="close-modal">Отмена</button>
        <button class="btn btn-primary" type="submit" form="income-source-form" id="income-source-submit">${icon("check")}Сохранить</button>`,
      onMount(root) {
        const form = root.querySelector("#income-source-form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submit = root.querySelector("#income-source-submit");
          const data = new FormData(form);
          const payload = {
            name: String(data.get("name") || "").trim(),
            kind: String(data.get("kind") || "salary"),
            days: String(data.get("days") || "").trim(),
            expected_amount: String(data.get("expected_amount") || "").trim() || null,
            active: Boolean(data.get("active")),
            notes: String(data.get("notes") || "").trim(),
          };
          setBusy(submit, true, "Сохраняем…");
          try {
            if (isEdit) await api(`/api/incomes/sources/${item.id}`, { method: "PUT", body: payload });
            else await api("/api/incomes/sources", { method: "POST", body: payload });
            closeModal();
            toast(isEdit ? "Источник обновлён" : "Источник добавлен");
            state.incomes = null;
            await loadRoute(state.route);
          } catch (error) {
            toast(error.message, "error");
            setBusy(submit, false);
          }
        });
      },
    });
  }

  function incomePlanHtml(plan) {
    if (!plan) return `<div class="income-plan-empty">Введите сумму поступления — покажу распределение.</div>`;
    const mandatory = plan.mandatory || [];
    const early = plan.early || [];
    const deferred = plan.deferred || [];
    const deferredNote = plan.deferred_total > 0
      ? `<small>перенесено ${fmtMoney(plan.deferred_total)}</small>`
      : "";
    return `<div class="income-plan-title"><b>План распределения</b><span>платежи до ${fmtDate(plan.horizon_date)}</span></div>
      <div class="income-plan-summary">
        <div><span>Из этого поступления</span><b>${fmtMoney(plan.mandatory_total)}</b>${deferredNote}</div>
        <div><span>Досрочно</span><b>${fmtMoney(plan.early_total)}</b></div>
        <div class="${plan.free > 0 ? "is-free" : ""}"><span>Свободно</span><b>${fmtMoney(plan.free)}</b></div>
      </div>
      ${plan.shortfall > 0 ? `<div class="income-shortfall">На обязательные платежи не хватает <b>${fmtMoney(plan.shortfall)}</b>. Добавьте доход, чтобы покрыть платежи полностью.</div>` : ""}
      <div class="income-plan-lists">
        <div class="income-plan-col">
          <h4>Платежи из поступления <span class="dim">${plan.mandatory_mode === "priority" ? "по сроку" : "пропорционально"}</span></h4>
          ${mandatory.length ? mandatory.map((item) => `<div class="income-plan-item">
            <div><b>${esc(item.title)}</b><span>${fmtDateShort(item.due_date)}${item.overdue ? " · просрочен" : item.days_left === 0 ? " · сегодня" : ` · через ${item.days_left} дн.`}${plan.mandatory_mode === "proportional" ? ` · ${Math.round((item.amount / item.need) * 100)}% из ${fmtMoney(item.need)}` : ""}</span></div>
            <b>${fmtMoney(item.amount)}</b>
          </div>`).join("") : `<div class="income-plan-empty">С этого поступления обязательные платежи не резервируются.</div>`}
          ${deferred.length ? `<h4 class="income-plan-deferred-head">Перенесено на следующее</h4>
            ${deferred.map((item) => `<div class="income-plan-item is-deferred">
              <div><b>${esc(item.title)}</b><span>${fmtDateShort(item.due_date)} · ${fmtMoney(item.amount)}</span></div>
              <span class="badge badge-warning">позже</span>
            </div>`).join("")}` : ""}
        </div>
        <div class="income-plan-col">
          <h4>Досрочное погашение <span class="dim">по ставке</span></h4>
          ${early.length ? early.map((item) => `<div class="income-plan-item early">
            <div><b>${esc(item.title)}</b><span>ставка ${Number(item.rate).toLocaleString("ru-RU")}% · остаток ${fmtMoney(item.remaining)}</span></div>
            <div class="income-plan-item-right"><b>${fmtMoney(item.amount)}</b>${item.full_payoff ? `<span class="badge badge-success">закрытие</span>` : ""}</div>
          </div>`).join("") : `<div class="income-plan-empty">Свободные деньги останутся на руках.</div>`}
        </div>
      </div>
      <div class="income-plan-note">${plan.mandatory_mode === "priority" ? "Платежи закрываются по очереди, начиная с ближайшего." : "Сумма резерва делится между платежами пропорционально их остатку."} Это рекомендация, а не списание. Перенесённые платежи будут зарезервированы из следующего поступления; досрочное погашение оформляется в карточке долга.</div>`;
  }

  async function openIncomeModal(options = {}) {
    let data;
    try {
      data = await api("/api/incomes");
    } catch (error) {
      toast(error.message, "error");
      return;
    }
    state.incomes = data;
    const sources = (data.sources || []).filter((source) => source.active || String(source.id) === String(options.sourceId));
    const reminder = options.reminder || ((data.reminders.today || [])[0] || null);
    const initialSource = sources.find((source) => String(source.id) === String(options.sourceId))
      || sources.find((source) => String(source.id) === String(reminder && reminder.source_id))
      || sources[0]
      || null;
    const initialAmount = reminder && reminder.expected_amount
      ? reminder.expected_amount
      : initialSource && initialSource.expected_amount
        ? initialSource.expected_amount
        : "";
    const sourceOptions = `<option value="">Разовое поступление</option>${sources.map((source) => `<option value="${source.id}" ${initialSource && source.id === initialSource.id ? "selected" : ""}>${esc(source.name)} · ${INCOME_KINDS[source.kind]?.label || "Доход"}</option>`).join("")}`;
    const intro = reminder
      ? `Сегодня день выплаты: <b>${esc(reminder.name)}</b>. Сколько вы получили?`
      : "Введите фактическую сумму — приложение сразу рассчитает распределение.";

    const body = `<form id="income-form">
      <div class="income-modal-intro">${intro}</div>
      <div class="form-grid">
        <label class="field"><span>Источник</span><select name="source_id" id="income-source">${sourceOptions}</select></label>
        <label class="field"><span>Дата поступления</span><input name="received_date" id="income-date" type="date" value="${todayISO()}" required></label>
        <label class="field"><span>Сколько вы получили, ${esc(state.settings.currency)}</span><input name="amount" id="income-amount" type="number" min="0.01" step="0.01" inputmode="decimal" required value="${initialAmount ? Number(initialAmount).toFixed(2) : ""}" placeholder="0"></label>
        <label class="field"><span>Отложить на обязательные платежи, ${esc(state.settings.currency)}</span><input name="mandatory_amount" id="income-mandatory" type="number" min="0" step="0.01" inputmode="decimal" value=""><span class="field-hint">Можно отложить часть сейчас, а остаток закрыть со следующего поступления — например, с аванса 25-го.</span></label>
        <label class="field"><span>На досрочное погашение, ${esc(state.settings.currency)}</span><input name="early_amount" id="income-early" type="number" min="0" step="0.01" inputmode="decimal" value=""><span class="field-hint">Можно уменьшить, чтобы оставить деньги на руках.</span></label>
        <label class="field"><span>Распределение обязательных платежей</span>
          <select name="mandatory_mode" id="income-mode">
            <option value="proportional" selected>Пропорционально всем платежам</option>
            <option value="priority">Сначала ближайшие по сроку</option>
          </select>
          <span class="field-hint">Одинаковый процент от каждого платежа; «по сроку» — по очереди.</span>
        </label>
        <label class="field full"><span>Комментарий</span><input name="note" maxlength="500" placeholder="Необязательно"></label>
      </div>
      <div class="income-plan-box" id="income-plan-box">${incomePlanHtml(null)}</div>
    </form>`;

    openModal({
      title: reminder ? "Сколько вы получили?" : "Новое поступление",
      subtitle: "Сначала обязательные платежи, затем досрочное погашение по приоритету ставки",
      body,
      size: "wide",
      footer: `<button class="btn btn-ghost" data-action="close-modal">Позже</button>
        <button class="btn btn-primary" type="submit" form="income-form" id="income-submit" disabled>${icon("check")}Распределить доход</button>`,
      onMount(root) {
        const form = root.querySelector("#income-form");
        const amountInput = root.querySelector("#income-amount");
        const earlyInput = root.querySelector("#income-early");
        const mandatoryInput = root.querySelector("#income-mandatory");
        const modeSelect = root.querySelector("#income-mode");
        const dateInput = root.querySelector("#income-date");
        const sourceSelect = root.querySelector("#income-source");
        const planBox = root.querySelector("#income-plan-box");
        const submit = root.querySelector("#income-submit");
        let earlyTouched = false;
        let mandatoryTouched = false;
        let timer = null;
        let token = 0;

        const refresh = async (initial = false) => {
          const amount = toNumber(amountInput.value, 0);
          if (!amount) {
            planBox.innerHTML = incomePlanHtml(null);
            submit.disabled = true;
            return;
          }
          const requestToken = ++token;
          planBox.classList.add("is-loading");
          try {
            const payload = {
              amount,
              received_date: dateInput.value || todayISO(),
              mandatory_mode: modeSelect.value,
            };
            if (earlyTouched) payload.early_amount = toNumber(earlyInput.value, 0);
            if (mandatoryTouched) payload.mandatory_amount = toNumber(mandatoryInput.value, 0);
            const plan = await api("/api/incomes/plan", { method: "POST", body: payload });
            if (requestToken !== token) return;
            state.incomePlan = plan;
            if (!mandatoryTouched || initial) {
              mandatoryInput.value = Number(plan.mandatory_total || 0).toFixed(2);
            }
            if (!earlyTouched || initial) {
              earlyInput.value = Number(plan.recommended_early || 0).toFixed(2);
              if (!earlyTouched) earlyInput.dataset.recommended = earlyInput.value;
            }
            planBox.innerHTML = incomePlanHtml(plan);
            planBox.classList.remove("is-loading");
            submit.disabled = false;
          } catch (error) {
            if (requestToken !== token) return;
            planBox.classList.remove("is-loading");
            planBox.innerHTML = `<div class="field-error">${esc(error.message)}</div>`;
            submit.disabled = true;
          }
        };
        const schedule = () => {
          clearTimeout(timer);
          timer = setTimeout(() => refresh(false), 320);
        };

        amountInput.addEventListener("input", () => {
          earlyTouched = false;
          mandatoryTouched = false;
          schedule();
        });
        earlyInput.addEventListener("input", () => {
          earlyTouched = true;
          schedule();
        });
        mandatoryInput.addEventListener("input", () => {
          mandatoryTouched = true;
          earlyTouched = true;
          const maxEarly = Math.max(0, toNumber(amountInput.value, 0) - toNumber(mandatoryInput.value, 0));
          if (toNumber(earlyInput.value, 0) > maxEarly) {
            earlyInput.value = maxEarly.toFixed(2);
          }
          schedule();
        });
        modeSelect.addEventListener("change", () => schedule());
        dateInput.addEventListener("change", () => {
          earlyTouched = false;
          mandatoryTouched = false;
          schedule();
        });
        sourceSelect.addEventListener("change", () => {
          const source = sources.find((item) => String(item.id) === String(sourceSelect.value));
          if (source && source.expected_amount && !amountInput.value) {
            amountInput.value = Number(source.expected_amount).toFixed(2);
          }
          earlyTouched = false;
          mandatoryTouched = false;
          schedule();
        });

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const amount = toNumber(amountInput.value, 0);
          if (!amount) {
            toast("Введите сумму поступления", "error");
            return;
          }
          setBusy(submit, true, "Распределяем…");
          try {
            await api("/api/incomes", {
              method: "POST",
              body: {
                source_id: sourceSelect.value || null,
                received_date: dateInput.value || todayISO(),
                amount,
                early_amount: earlyInput.value === "" ? null : toNumber(earlyInput.value, 0),
                mandatory_amount: mandatoryInput.value === "" ? null : toNumber(mandatoryInput.value, 0),
                mandatory_mode: modeSelect.value,
                note: String(new FormData(form).get("note") || "").trim(),
              },
            });
            closeModal();
            toast("Поступление сохранено, распределение готово");
            if (state.route === "incomes") await loadRoute("incomes");
            else await loadRoute(state.route);
            refreshSidebar();
          } catch (error) {
            toast(error.message, "error");
            setBusy(submit, false);
          }
        });

        if (amountInput.value) setTimeout(() => refresh(true), 60);
        else amountInput.focus();
      },
    });
  }

  async function openIncomeReceipt(receiptId) {
    try {
      const receipt = await api(`/api/incomes/receipts/${receiptId}`);
      const allocations = receipt.allocations || [];
      const body = `<div class="detail-stats" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:16px">
        <div class="detail-stat"><span>Получено</span><b>${fmtMoney(receipt.amount)}</b></div>
        <div class="detail-stat"><span>На обязательные платежи</span><b>${fmtMoney(receipt.payment_total)}</b></div>
        <div class="detail-stat"><span>Свободно</span><b class="text-success">${fmtMoney(receipt.free)}</b></div>
      </div>
      <div class="detail-section-title"><h3>Распределение</h3><span class="chip">${fmtDate(receipt.received_date)}</span></div>
      <div class="detail-table-wrap">
        <table class="data-table income-table">
          <thead><tr><th>Куда</th><th>Тип</th><th class="num">Сумма</th></tr></thead>
          <tbody>${allocations.map((item) => `<tr>
            <td>${esc(item.label || "Без названия")}${item.due_date ? `<span class="dim"> · ${fmtDateShort(item.due_date)}</span>` : ""}</td>
            <td>${item.kind === "early" ? `<span class="badge badge-warning">Досрочно</span>` : `<span class="badge badge-accent">Платёж</span>`}</td>
            <td class="num">${fmtMoney(item.amount)}</td>
          </tr>`).join("") || `<tr><td colspan="3" class="dim">Распределения нет — вся сумма свободна.</td></tr>`}</tbody>
        </table>
      </div>`;
      openModal({
        title: esc(receipt.source_name || "Поступление"),
        subtitle: `${fmtDate(receipt.received_date)} · ${fmtMoney(receipt.amount)}`,
        body,
        size: "wide",
        footer: `<button class="btn btn-danger btn-sm" data-action="delete-income-receipt" data-id="${receipt.id}">${icon("trash", 15)}Удалить</button>
          <button class="btn btn-ghost" data-action="close-modal">Закрыть</button>`,
      });
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function deleteIncomeSource(sourceId) {
    const source = (state.incomes?.sources || []).find((item) => String(item.id) === String(sourceId));
    const ok = await confirmAction({
      title: "Удалить источник?",
      message: `Удалить <b>${esc(source ? source.name : "источник дохода")}</b>? История поступлений сохранится.`,
      confirmText: "Удалить",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/incomes/sources/${sourceId}`, { method: "DELETE" });
      state.incomes = null;
      toast("Источник удалён", "info");
      await loadRoute(state.route);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function deleteIncomeReceipt(receiptId) {
    const ok = await confirmAction({
      title: "Удалить поступление?",
      message: "Поступление и его распределение будут удалены. Свободные деньги пересчитаются.",
      confirmText: "Удалить",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/incomes/${receiptId}`, { method: "DELETE" });
      closeModal();
      state.incomes = null;
      toast("Поступление удалено", "info");
      await loadRoute(state.route);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  /* ---------------------------------------------------------- history */
  async function loadHistory() {
    const [history, debts] = await Promise.all([api("/api/history"), api("/api/debts")]);
    state.historyAll = history;
    state.historyDebts = debts.items || [];

    if (state.historyFilters.debtId !== "all" && !state.historyDebts.some((debt) => String(debt.id) === state.historyFilters.debtId)) {
      state.historyFilters.debtId = "all";
    }

    setView(`${pageHead(
      "История платежей",
      "Все оплаты по долгам — можно отменить ошибочную отметку",
      `<button class="btn btn-ghost" data-action="export-csv">${icon("download")}Экспорт CSV</button>`
    )}
    <div class="summary-chips">
      <div class="summary-chip"><span>Всего оплачено</span><b>${fmtMoney(history.total)}</b></div>
      <div class="summary-chip"><span>Платежей</span><b>${history.count}</b></div>
    </div>
    <div class="filter-bar">
      <div class="search">${icon("search")}<input id="history-search" type="search" placeholder="Поиск по долгу или кредитору" value="${esc(state.historyFilters.q)}" autocomplete="off"></div>
      <select class="select" id="history-debt" aria-label="Фильтр по долгу">
        <option value="all">Все долги</option>
        ${state.historyDebts.map((debt) => `<option value="${debt.id}" ${state.historyFilters.debtId === String(debt.id) ? "selected" : ""}>${esc(debt.title)}</option>`).join("")}
      </select>
      <select class="select" id="history-year" aria-label="Фильтр по году">
        <option value="all">Все годы</option>
        ${(history.years || []).map((year) => `<option value="${year}" ${state.historyFilters.year === year ? "selected" : ""}>${year}</option>`).join("")}
      </select>
    </div>
    <section class="card"><div class="table-wrap" id="history-table"></div></section>`);

    renderHistoryTable();

    const search = $("#history-search");
    if (search) {
      search.addEventListener("input", () => {
        state.historyFilters.q = search.value;
        renderHistoryTable();
      });
    }
    const debtSelect = $("#history-debt");
    if (debtSelect) {
      debtSelect.addEventListener("change", () => {
        state.historyFilters.debtId = debtSelect.value;
        renderHistoryTable();
      });
    }
    const yearSelect = $("#history-year");
    if (yearSelect) {
      yearSelect.addEventListener("change", () => {
        state.historyFilters.year = yearSelect.value;
        renderHistoryTable();
      });
    }
  }

  function renderHistoryTable() {
    const container = $("#history-table");
    if (!container || !state.historyAll) return;
    const query = state.historyFilters.q.trim().toLowerCase();
    const items = (state.historyAll.items || []).filter((item) => {
      const matchesQuery = !query
        || item.title.toLowerCase().includes(query)
        || (item.creditor || "").toLowerCase().includes(query);
      const matchesDebt = state.historyFilters.debtId === "all" || String(item.debt_id) === state.historyFilters.debtId;
      const dateValue = item.paid_date || item.due_date;
      const matchesYear = state.historyFilters.year === "all" || dateValue.slice(0, 4) === state.historyFilters.year;
      return matchesQuery && matchesDebt && matchesYear;
    });

    if (!items.length) {
      container.innerHTML = emptyState({
        iconName: "clock",
        title: "Оплат пока нет",
        text: "Отметьте платёж в графике — он появится здесь. История хранится локально и не отправляется в интернет.",
        compact: true,
      });
      return;
    }

    const total = items.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
    container.innerHTML = `<table class="data-table">
      <thead><tr>
        <th>Оплачено</th>
        <th>Долг</th>
        <th>Плановая дата</th>
        <th class="num">Сумма</th>
        <th>Комментарий</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${items.map((item) => `<tr>
          <td><b>${fmtDate(item.paid_date || item.due_date)}</b></td>
          <td class="title-cell"><b>${esc(item.title)}</b><span>${esc(item.creditor || item.type_label)}</span></td>
          <td>${fmtDate(item.due_date)}</td>
          <td class="num strong">${fmtMoney(item.paid_amount || item.amount, { cents: true })}</td>
          <td>${item.note ? esc(item.note) : `<span class="dim">—</span>`}</td>
          <td class="num"><button class="icon-btn sm" data-action="undo-pay" data-payment="${item.id}" data-title="${esc(item.title)}" title="Отменить оплату" aria-label="Отменить оплату">${icon("undo", 15)}</button></td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr>
        <td colspan="3">Итого за выбранный период</td>
        <td class="num">${fmtMoney(total, { cents: true })}</td>
        <td colspan="2">${items.length} ${plural(items.length, ["платёж", "платежа", "платежей"])}</td>
      </tr></tfoot>
    </table>`;
  }

  /* ---------------------------------------------------------- analytics */
  async function loadAnalytics() {
    const analytics = await api("/api/analytics");
    state.analytics = analytics;
    const totals = analytics.totals || {};

    if (!analytics.by_debt || !analytics.by_debt.length) {
      setView(`${pageHead("Аналитика", "Структура долгов, переплата и прогноз выплат", "")}
        <section class="card">${emptyState({
          iconName: "chart",
          title: "Недостаточно данных",
          text: "Добавьте долги, чтобы увидеть структуру, переплату по процентам и прогноз погашения.",
          actions: `<button class="btn btn-primary" data-action="add-debt">${icon("plus")}Добавить долг</button>`,
        })}</section>`);
      return;
    }

    const byType = analytics.by_type || [];
    const debtTable = analytics.debt_table || [];

    setView(`${pageHead("Аналитика", "Структура долгов, переплата и прогноз выплат", "")}
    <div class="analytics-kpis">
      <div class="card stat-card"><div class="stat-label">Основной долг</div><div class="stat-value">${fmtMoney(totals.principal)}</div><div class="stat-sub">первоначальная сумма</div></div>
      <div class="card stat-card"><div class="stat-label">Остаток</div><div class="stat-value">${fmtMoney(totals.remaining)}</div><div class="stat-sub">основной долг к погашению</div></div>
      <div class="card stat-card"><div class="stat-label">Переплата по процентам</div><div class="stat-value">${fmtMoney(totals.interest_planned)}</div><div class="stat-sub">за весь срок</div></div>
      <div class="card stat-card"><div class="stat-label">Выплачено процентов</div><div class="stat-value">${fmtMoney(totals.interest_paid)}</div><div class="stat-sub">из ${fmtMoney(totals.interest_planned)}</div></div>
    </div>

    <section class="card chart-card" style="margin-bottom:16px">
      <div class="card-head"><div><h2>Прогноз остатка долга</h2><p>По текущему графику платежей, все активные долги</p></div></div>
      <div class="chart-box tall"><canvas id="chart-balance" aria-label="Прогноз остатка долга"></canvas></div>
    </section>

    <div class="grid grid-2" style="margin-bottom:16px">
      <section class="card chart-card">
        <div class="card-head"><div><h2>План и факт</h2><p>Оплаты по месяцам</p></div></div>
        <div class="chart-box"><canvas id="chart-flow" aria-label="План и факт оплат"></canvas></div>
      </section>
      <section class="card chart-card">
        <div class="card-head"><div><h2>Структура по типам</h2><p>Остаток основного долга</p></div></div>
        <div class="chart-box donut donut-wrap">
          <canvas id="chart-type" aria-label="Структура по типам долгов"></canvas>
          <div class="donut-center"><b>${fmtMoney(totals.remaining)}</b><span>остаток</span></div>
        </div>
        <ul class="legend">
          ${byType.map((item) => `<li class="legend-item"><i style="background:${TYPE_COLORS[item.type] || "#94a3b8"}"></i><span>${esc(item.label)}</span><b>${fmtMoney(item.remaining)}</b></li>`).join("")}
        </ul>
      </section>
    </div>

    <section class="card">
      <div class="card-head"><div><h2>Детализация по долгам</h2><p>Суммы и переплата по каждому обязательству</p></div></div>
      <div class="table-wrap">${analyticsTableHtml(debtTable)}</div>
    </section>`);

    createBalanceChart("chart-balance", analytics.balance_series || []);
    createFlowChart("chart-flow", analytics.flow || []);
    createTypeChart("chart-type", byType);
  }

  function analyticsTableHtml(rows) {
    if (!rows.length) return "";
    const totals = rows.reduce((acc, row) => {
      acc.paid += Number(row.paid || 0);
      acc.remaining += Number(row.remaining || 0);
      acc.interest += Number(row.interest || 0);
      return acc;
    }, { paid: 0, remaining: 0, interest: 0 });

    return `<table class="data-table">
      <thead><tr>
        <th>Долг</th>
        <th>Тип</th>
        <th class="num">Ставка</th>
        <th class="num">Платёж/мес</th>
        <th class="num">Выплачено</th>
        <th class="num">Остаток</th>
        <th class="num">Переплата</th>
        <th>Закрытие</th>
      </tr></thead>
      <tbody>
        ${rows.map((row) => `<tr>
          <td class="title-cell"><b>${esc(row.title)}</b><span>${esc(row.creditor || "Без кредитора")}${row.status === "closed" ? " · закрыт" : ""}</span></td>
          <td>${esc(row.type_label)}</td>
          <td class="num">${Number(row.rate) > 0 ? Number(row.rate).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + "%" : "0%"}</td>
          <td class="num">${fmtMoney(row.monthly)}</td>
          <td class="num">${fmtMoney(row.paid)}</td>
          <td class="num strong">${fmtMoney(row.remaining)}</td>
          <td class="num text-warning">${fmtMoney(row.interest)}</td>
          <td>${row.payoff_date ? fmtDate(row.payoff_date) : `<span class="badge badge-muted">Закрыт</span>`}</td>
        </tr>`).join("")}
      </tbody>
      <tfoot><tr>
        <td colspan="4">Итого</td>
        <td class="num">${fmtMoney(totals.paid)}</td>
        <td class="num">${fmtMoney(totals.remaining)}</td>
        <td class="num">${fmtMoney(totals.interest)}</td>
        <td></td>
      </tr></tfoot>
    </table>`;
  }

  /* ---------------------------------------------------------- settings */
  function backupListHtml() {
    const items = state.backups || [];
    if (!items.length) {
      return `<div class="backup-empty">Пока нет резервных копий. Они появятся после первого изменения данных.</div>`;
    }
    return `<div class="backup-list">${items.map((item) => {
      const label = item.reason_label || item.kind_label || "Копия";
      const kindClass = item.kind === "auto" ? "auto" : "manual";
      return `<div class="backup-row">
        <div class="backup-main">
          <span class="backup-badge ${kindClass}">${esc(label)}</span>
          <div class="backup-info">
            <b>${fmtDateTime(item.created_at)}</b>
            <span>${fmtBytes(item.size)} · ${esc(item.name)}</span>
          </div>
        </div>
        <div class="backup-actions">
          <button class="btn btn-ghost btn-sm" data-action="restore-backup" data-name="${esc(item.name)}">Восстановить</button>
          <button class="icon-btn" data-action="delete-backup" data-name="${esc(item.name)}" title="Удалить копию" aria-label="Удалить копию">${icon("trash", 15)}</button>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  async function loadSettings() {
    const [info, summary, backups] = await Promise.all([
      api("/api/info"),
      api("/api/summary"),
      api("/api/backups"),
    ]);
    state.info = info;
    state.summary = summary;
    state.backups = backups.items || [];
    state.backupMeta = { dir: backups.dir || "", keep: backups.keep || 5 };
    const theme = state.settings.theme;
    const totalDebts = Number(summary.active_count || 0) + Number(summary.closed_count || 0);
    const dbSize = info.db_size ? `${(info.db_size / 1024).toFixed(1)} КБ` : "—";

    setView(`${pageHead("Настройки", "Внешний вид, резервные копии и данные приложения", "")}
    <div class="settings-grid">
      <div style="display:flex;flex-direction:column;gap:16px">
        <section class="card">
          <div class="card-head"><div><h2>Внешний вид</h2><p>Тема и валюта отображения</p></div></div>
          <div class="setting-row">
            <div class="setting-info"><b>Тема оформления</b><span>Переключается сразу во всём приложении</span></div>
            <div class="setting-control">
              <div class="segmented" id="theme-segmented">
                <button data-action="set-theme" data-theme-value="dark" class="${theme === "dark" ? "active" : ""}">${icon("moon", 15)}Тёмная</button>
                <button data-action="set-theme" data-theme-value="light" class="${theme === "light" ? "active" : ""}">${icon("sun", 15)}Светлая</button>
              </div>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info"><b>Валюта</b><span>Используется во всех суммах приложения</span></div>
            <div class="setting-control">
              <select class="select" id="currency-select" aria-label="Валюта">
                ${["₽", "$", "€", "₸", "₴", "£"].map((currency) => `<option value="${currency}" ${state.settings.currency === currency ? "selected" : ""}>${currency}</option>`).join("")}
              </select>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><div><h2>Данные</h2><p>Экспорт, импорт и перенос</p></div></div>
          <div class="data-actions">
            <button class="data-action" data-action="export-json">
              <span class="data-icon">${icon("download", 18)}</span>
              <span><b>Экспорт в JSON</b><span>Полная копия долгов, графика и настроек</span></span>
            </button>
            <button class="data-action" data-action="export-csv">
              <span class="data-icon">${icon("database", 18)}</span>
              <span><b>Экспорт графика в CSV</b><span>Открывается в Excel и Google Таблицах</span></span>
            </button>
            <button class="data-action" data-action="import-json">
              <span class="data-icon">${icon("upload", 18)}</span>
              <span><b>Импорт из JSON</b><span>Заменит текущие данные данными из файла</span></span>
            </button>
            <button class="data-action" data-action="open-folder">
              <span class="data-icon">${icon("folder", 18)}</span>
              <span><b>Открыть папку приложения</b><span>База данных, резервные копии и логи</span></span>
            </button>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div><h2>Резервные копии</h2><p>${state.backups.length ? `${state.backups.length} ${plural(state.backups.length, ["копия", "копии", "копий"])} · автоматически после изменений` : "Автоматически после изменений"}</p></div>
            <div class="card-actions">
              <button class="btn btn-ghost btn-sm" data-action="refresh-backups">${icon("refresh", 15)}Обновить</button>
              <button class="btn btn-primary btn-sm" data-action="backup">${icon("shield", 15)}Создать</button>
            </div>
          </div>
          ${backupListHtml()}
          <div class="backup-note">Автоматические копии создаются после добавления, оплаты и изменения данных. Хранятся только ${state.backupMeta.keep || 5} последних копий, включая ручные.</div>
          <div class="backup-transfer">
            <b>Перенос на другой компьютер</b>
            <span>Скопируйте <code>ДолгКонтроль.exe</code> и папку <code>data</code> целиком. Если перенести только .exe, база создастся пустой.</span>
          </div>
        </section>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <section class="card">
          <div class="card-head"><div><h2>О приложении</h2><p>Локальный трекер долгов</p></div></div>
          <div class="about-list">
            <div class="about-row"><span>Версия</span><b>${esc(info.version || "1.0.0")}</b></div>
            <div class="about-row"><span>Хранение</span><b>SQLite · только на этом компьютере</b></div>
            <div class="about-row"><span>База данных</span><b><span class="path">${esc(info.db_path || "")}</span></b></div>
            <div class="about-row"><span>Резервные копии</span><b><span class="path">${esc(info.backup_dir || "")}</span></b></div>
            <div class="about-row"><span>Размер базы</span><b>${dbSize}</b></div>
            <div class="about-row"><span>Долгов</span><b>${summary.active_count} активных · ${summary.closed_count} закрытых</b></div>
            <div class="about-row"><span>Платежей</span><b>${summary.paid_count} оплачено</b></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><div><h2 class="danger-title">Опасная зона</h2><p>Действия с данными</p></div></div>
          <div class="setting-row">
            <div class="setting-info"><b>Демо-данные</b><span>${totalDebts ? "Доступно только для пустой базы" : "4 примера долгов с историей платежей"}</span></div>
            <div class="setting-control"><button class="btn btn-ghost btn-sm" data-action="load-demo" ${totalDebts ? "disabled" : ""}>Загрузить</button></div>
          </div>
          <div class="setting-row">
            <div class="setting-info"><b>Очистить все данные</b><span>Удалить долги и историю без возможности восстановления</span></div>
            <div class="setting-control"><button class="btn btn-danger btn-sm" data-action="reset-data" ${totalDebts ? "" : "disabled"}>Очистить</button></div>
          </div>
        </section>
      </div>
    </div>`);

    const currencySelect = $("#currency-select");
    if (currencySelect) {
      currencySelect.addEventListener("change", async () => {
        try {
          const settings = await api("/api/settings", { method: "PUT", body: { currency: currencySelect.value } });
          state.settings.currency = settings.currency;
          toast("Валюта изменена");
          refreshSidebar();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    }
  }

  /* ---------------------------------------------------------- modals */
  function openModal(options) {
    const { title, subtitle = "", body = "", footer = "", size = "", onMount = null, focus = false } = options;
    if (confirmResolver) {
      const resolver = confirmResolver;
      confirmResolver = null;
      resolver(false);
    }
    disposeModalCharts();
    const root = $("#modal-root");
    root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
      <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-head">
          <div><h2 id="modal-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>
          <button class="icon-btn modal-close" data-action="close-modal" aria-label="Закрыть">${icon("x")}</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ""}
      </div>
    </div>`;
    root.classList.add("open");
    document.body.classList.add("modal-open");
    fillIcons(root);
    if (onMount) onMount(root);
    if (focus) {
      const firstInput = root.querySelector(".modal-body input:not([type=hidden]), .modal-body select, .modal-body textarea");
      if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
  }

  function closeModal() {
    if (confirmResolver) {
      const resolver = confirmResolver;
      confirmResolver = null;
      resolver(false);
    }
    disposeModalCharts();
    const root = $("#modal-root");
    if (root) {
      root.classList.remove("open");
      root.innerHTML = "";
    }
    document.body.classList.remove("modal-open");
    state.detailDebt = null;
    state.detailDebtId = null;
  }

  function confirmAction(options) {
    const { title, message, confirmText = "Подтвердить", danger = true, requireText = null } = options;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        confirmResolver = null;
        resolve(value);
      };

      const body = `<div class="confirm-text">${message}</div>
        ${requireText ? `<div class="confirm-input"><input class="input" id="confirm-text" placeholder="${esc(requireText)}" autocomplete="off" style="width:100%"><div class="confirm-hint">Введите «${esc(requireText)}» для подтверждения</div></div>` : ""}`;

      openModal({
        title,
        size: "sm",
        body,
        footer: `<button class="btn btn-ghost" data-confirm-cancel>Отмена</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm-ok>${esc(confirmText)}</button>`,
        focus: Boolean(requireText),
        onMount(root) {
          root.querySelector("[data-confirm-cancel]").addEventListener("click", () => {
            finish(false);
            closeModal();
          });
          root.querySelector("[data-confirm-ok]").addEventListener("click", () => {
            if (requireText) {
              const value = (root.querySelector("#confirm-text")?.value || "").trim();
              if (value !== requireText) {
                toast(`Введите «${requireText}» для подтверждения`, "error");
                return;
              }
            }
            finish(true);
            closeModal();
          });
        },
      });
      confirmResolver = finish;
    });
  }

  function setBusy(button, busy, label = "Сохранение…") {
    if (!button) return;
    if (busy) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner"></span> ${esc(label)}`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function toast(message, type = "success") {
    const root = $("#toast-root");
    if (!root) return;
    const element = document.createElement("div");
    element.className = `toast ${type}`;
    const iconName = type === "error" ? "alert" : type === "info" ? "info" : "check";
    element.innerHTML = `<span class="toast-icon">${icon(iconName, 13)}</span><div>${esc(message)}</div>`;
    root.appendChild(element);
    const remove = () => {
      if (!element.isConnected) return;
      element.classList.add("leaving");
      setTimeout(() => element.remove(), 220);
    };
    element.addEventListener("click", remove);
    setTimeout(remove, 4200);
  }

  /* ---------------------------------------------------------- debt form */
  function openDebtForm(debt = null) {
    const editing = Boolean(debt);
    const selectedColor = debt?.color || COLORS[0];
    const titleValue = esc(debt?.title || "");
    const body = `<form id="debt-form" novalidate>
      <div class="form-grid">
        <label class="field full"><span>Название <em>*</em></span>
          <input name="title" maxlength="120" required placeholder="Например, ипотека на квартиру" value="${titleValue}">
        </label>
        <label class="field"><span>Кредитор</span>
          <input name="creditor" maxlength="120" placeholder="Банк или магазин" value="${esc(debt?.creditor || "")}">
        </label>
        <label class="field"><span>Тип долга</span>
          <select name="type">${Object.entries(TYPES).map(([key, meta]) => `<option value="${key}" ${debt?.type === key ? "selected" : ""}>${meta.label}</option>`).join("")}</select>
        </label>
        <label class="field"><span>Сумма долга, ${esc(state.settings.currency)} <em>*</em></span>
          <input name="principal" type="number" min="0.01" step="0.01" inputmode="decimal" required placeholder="0" value="${debt ? debt.principal : ""}">
        </label>
        <label class="field"><span>Ставка, % годовых</span>
          <input name="rate" type="number" min="0" max="1000" step="0.01" inputmode="decimal" value="${debt ? debt.rate : 0}">
        </label>
        <label class="field"><span>Срок, месяцев <em>*</em></span>
          <input name="term_months" type="number" min="1" max="600" step="1" required value="${debt ? debt.term_months : 12}">
        </label>
        <label class="field"><span>Дата первого платежа <em>*</em></span>
          <input name="start_date" type="date" required value="${debt ? debt.start_date : todayISO()}">
        </label>
        <label class="field"><span>Платёж в месяц (необязательно)</span>
          <input name="monthly_payment" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="Рассчитаем автоматически" value="${debt?.monthly_payment ?? ""}">
        </label>
        <div class="field"><span>Цвет</span>
          <div class="color-picker" id="color-picker">
            ${COLORS.map((color) => `<button type="button" class="color-swatch ${color === selectedColor ? "selected" : ""}" data-color="${color}" style="background:${color}" aria-label="Выбрать цвет ${color}"></button>`).join("")}
          </div>
        </div>
        <label class="field full"><span>Заметка</span>
          <textarea name="notes" maxlength="2000" rows="2" placeholder="Условия, реквизиты, комментарии">${esc(debt?.notes || "")}</textarea>
        </label>
      </div>
      <div class="preview" id="debt-preview"></div>
    </form>`;

    const footer = `<button class="btn btn-ghost" data-action="close-modal">Отмена</button>
      <button class="btn btn-primary" type="submit" form="debt-form" id="debt-submit">${editing ? "Сохранить изменения" : "Добавить долг"}</button>`;

    openModal({
      title: editing ? "Редактировать долг" : "Новый долг",
      subtitle: editing
        ? "Изменение суммы, срока, ставки или даты пересчитает будущие платежи."
        : "Заполните параметры — график платежей создастся автоматически.",
      body,
      footer,
      size: "wide",
      focus: true,
      onMount(root) {
        const form = root.querySelector("#debt-form");
        form.dataset.color = selectedColor;
        const update = () => updateDebtPreview(form, editing);
        form.addEventListener("input", update);
        form.addEventListener("change", update);
        root.querySelectorAll(".color-swatch").forEach((swatch) => {
          swatch.addEventListener("click", () => {
            form.dataset.color = swatch.dataset.color;
            root.querySelectorAll(".color-swatch").forEach((item) => item.classList.toggle("selected", item === swatch));
          });
        });

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submit = root.querySelector("#debt-submit");
          const wasDetail = editing && state.detailDebtId === debt.id;
          const payload = collectDebtForm(form);
          if (!payload.title) {
            toast("Укажите название долга", "error");
            return;
          }
          if (!(payload.principal > 0)) {
            toast("Сумма долга должна быть больше нуля", "error");
            return;
          }
          if (!(payload.term_months > 0)) {
            toast("Укажите срок в месяцах", "error");
            return;
          }
          setBusy(submit, true, editing ? "Сохранение…" : "Создание…");
          try {
            if (editing) {
              await api(`/api/debts/${debt.id}`, { method: "PUT", body: payload });
            } else {
              await api("/api/debts", { method: "POST", body: payload });
            }
            closeModal();
            toast(editing ? "Долг обновлён" : "Долг добавлен");
            await loadRoute(state.route);
            refreshSidebar();
            if (wasDetail) openDebtDetail(debt.id);
          } catch (error) {
            toast(error.message, "error");
            setBusy(submit, false);
          }
        });

        update();
      },
    });
  }

  function collectDebtForm(form) {
    const data = new FormData(form);
    return {
      title: String(data.get("title") || "").trim(),
      creditor: String(data.get("creditor") || "").trim(),
      type: String(data.get("type") || "credit"),
      principal: toNumber(data.get("principal"), 0),
      rate: toNumber(data.get("rate"), 0),
      term_months: Math.round(toNumber(data.get("term_months"), 0)),
      start_date: String(data.get("start_date") || ""),
      monthly_payment: data.get("monthly_payment") ? toNumber(data.get("monthly_payment"), 0) : null,
      color: form.dataset.color || COLORS[0],
      notes: String(data.get("notes") || "").trim(),
    };
  }

  function updateDebtPreview(form, editing) {
    const container = form.querySelector("#debt-preview");
    if (!container) return;
    const principal = toNumber(form.principal.value, 0);
    const rate = Math.max(0, toNumber(form.rate.value, 0));
    const term = Math.round(toNumber(form.term_months.value, 0));
    const manual = toNumber(form.monthly_payment.value, 0);
    const start = parseISO(form.start_date.value);

    if (!(principal > 0) || !(term > 0)) {
      container.innerHTML = `<div class="preview-item"><span>Предпросмотр</span><b>Укажите сумму и срок</b></div>`;
      return;
    }

    const monthlyRate = rate / 1200;
    let payment = manual > 0 ? manual : (monthlyRate > 0 ? principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -term)) : principal / term);
    payment = Math.round(payment * 100) / 100;

    let balance = principal;
    let months = 0;
    let interestTotal = 0;
    let invalid = false;

    while (balance > 0.005 && months < term) {
      const interest = balance * monthlyRate;
      const principalPart = Math.min(balance, payment - interest);
      if (principalPart <= 0) {
        invalid = true;
        break;
      }
      interestTotal += interest;
      balance -= principalPart;
      months += 1;
    }
    if (!invalid && balance > 0.005) {
      interestTotal += balance * monthlyRate;
      balance = 0;
    }

    const lastDate = start ? addMonthsDate(start, Math.max(months - 1, 0)) : null;
    const note = invalid
      ? "Платёж не покрывает начисляемые проценты — увеличьте ежемесячную сумму."
      : editing
        ? "Будущие платежи будут пересчитаны, уже отмеченные оплаты сохранятся."
        : "Расчёт предварительный: точный график создастся при сохранении.";

    container.innerHTML = `
      <div class="preview-item"><span>Платёж в месяц</span><b>${fmtMoney(payment)}</b></div>
      <div class="preview-item"><span>Переплата</span><b class="text-warning">${fmtMoney(interestTotal)}</b></div>
      <div class="preview-item"><span>Всего выплат</span><b>${fmtMoney(principal + interestTotal)}</b></div>
      ${lastDate ? `<div class="preview-item"><span>Последний платёж</span><b>${fmtDateShort(localISO(lastDate))}</b></div>` : ""}
      <div class="preview-note">${note}</div>`;
  }

  /* ---------------------------------------------------------- pay & detail */
  function openPayModal(info) {
    const overdue = info.due_date < todayISO();
    const body = `<form id="pay-form">
      <div class="detail-stats" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:16px">
        <div class="detail-stat"><span>Долг</span><b>${esc(info.title || "Платёж")}</b></div>
        <div class="detail-stat"><span>Плановая дата</span><b>${fmtDate(info.due_date)}</b></div>
      </div>
      <div class="form-grid">
        <label class="field"><span>Сумма оплаты, ${esc(state.settings.currency)}</span>
          <input name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required value="${Number(info.amount || 0).toFixed(2)}">
        </label>
        <label class="field"><span>Дата оплаты</span>
          <input name="paid_date" type="date" required value="${todayISO()}">
        </label>
        <label class="field full"><span>Комментарий</span>
          <input name="note" maxlength="500" placeholder="Необязательно">
        </label>
      </div>
      ${overdue ? `<div class="field-hint" style="margin-top:12px;color:var(--red)">Платёж просрочен. Отметка сохранится с выбранной датой оплаты.</div>` : ""}
    </form>`;

    openModal({
      title: "Отметить оплату",
      subtitle: "Проверьте сумму и дату — платёж попадёт в историю",
      body,
      footer: `<button class="btn btn-ghost" data-action="close-modal">Отмена</button>
        <button class="btn btn-primary" type="submit" form="pay-form" id="pay-submit">${icon("check")}Отметить оплату</button>`,
      onMount(root) {
        const form = root.querySelector("#pay-form");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const submit = root.querySelector("#pay-submit");
          const data = new FormData(form);
          const detailId = info.fromDetail ? state.detailDebtId : null;
          setBusy(submit, true, "Сохраняем…");
          try {
            await api(`/api/payments/${info.payment_id}/pay`, {
              method: "POST",
              body: {
                amount: toNumber(data.get("amount"), info.amount),
                paid_date: String(data.get("paid_date") || todayISO()),
                note: String(data.get("note") || "").trim(),
              },
            });
            closeModal();
            toast("Платёж отмечен как оплачен");
            await loadRoute(state.route);
            refreshSidebar();
            if (detailId) openDebtDetail(detailId);
          } catch (error) {
            toast(error.message, "error");
            setBusy(submit, false);
          }
        });
      },
    });
  }

  async function openDebtDetail(debtId) {
    try {
      const debt = await api(`/api/debts/${debtId}`);
      state.detailDebt = debt;
      state.detailDebtId = debt.id;
      const payments = debt.payments || [];
      const meta = typeMeta(debt.type);

      const body = `<div class="detail-stats">
          <div class="detail-stat"><span>Остаток основного долга</span><b>${fmtMoney(debt.remaining_principal)}</b></div>
          <div class="detail-stat"><span>Выплачено</span><b>${fmtMoney(debt.paid_amount)}</b></div>
          <div class="detail-stat"><span>Платёж в месяц</span><b>${fmtMoney(debt.monthly_payment_avg)}</b></div>
          <div class="detail-stat"><span>Переплата по процентам</span><b class="text-warning">${fmtMoney(debt.interest_planned)}</b></div>
        </div>
        <div class="chart-box detail-chart"><canvas id="detail-chart" aria-label="График платежей по долгу"></canvas></div>
        <div class="detail-section-title">
          <h3>График платежей</h3>
          <span class="chip">${debt.paid_count} из ${payments.length} оплачено</span>
        </div>
        <div class="detail-table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Дата</th>
              <th class="num">Сумма</th>
              <th class="num">Осн. долг</th>
              <th class="num">Проценты</th>
              <th class="num">Остаток</th>
              <th>Статус</th>
              <th></th>
            </tr></thead>
            <tbody>${payments.map((payment) => detailPaymentRow(payment, debt)).join("")}</tbody>
          </table>
        </div>`;

      const footer = `<div class="left">
          <button class="btn btn-ghost btn-sm" data-action="edit-debt" data-id="${debt.id}">${icon("edit", 15)}Изменить</button>
          <button class="btn btn-ghost btn-sm" data-action="delete-debt" data-id="${debt.id}">${icon("trash", 15)}Удалить</button>
        </div>
        <button class="btn btn-ghost" data-action="close-modal">Закрыть</button>
        ${debt.status === "active"
          ? `<button class="btn btn-primary" data-action="close-debt" data-id="${debt.id}">${icon("check")}Завершить долг</button>`
          : `<button class="btn btn-ghost" data-action="reopen-debt" data-id="${debt.id}">${icon("refresh")}Вернуть в работу</button>`}`;

      openModal({
        title: esc(debt.title),
        subtitle: `${esc(debt.creditor || "Без кредитора")} · ${meta.label} · ${debt.status === "closed" ? "долг закрыт" : `ставка ${Number(debt.rate).toLocaleString("ru-RU")}% · срок ${debt.term_months} мес.`}`,
        body,
        footer,
        size: "wide",
        onMount() {
          createDebtChart("detail-chart", debt);
        },
      });
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function detailPaymentRow(payment, debt) {
    const paid = payment.status === "paid";
    const overdue = !paid && payment.due_date < todayISO();
    const badge = paid
      ? `<span class="badge badge-success">Оплачен</span>`
      : overdue
        ? `<span class="badge badge-danger">Просрочен</span>`
        : `<span class="badge badge-muted">Ожидает</span>`;

    let action = "";
    if (debt.status === "active") {
      action = paid
        ? `<button class="icon-btn sm" data-action="undo-pay" data-payment="${payment.id}" data-title="${esc(debt.title)}" title="Отменить оплату" aria-label="Отменить оплату">${icon("undo", 15)}</button>`
        : `<button class="icon-btn sm" data-action="pay" data-payment="${payment.id}" data-amount="${payment.amount}" data-due="${payment.due_date}" data-title="${esc(debt.title)}" title="Отметить оплату" aria-label="Отметить оплату">${icon("check", 15)}</button>`;
    }

    return `<tr>
      <td>${fmtDate(payment.due_date, { year: true })}</td>
      <td class="num">${fmtMoney(payment.amount, { cents: true })}</td>
      <td class="num">${fmtMoney(payment.principal_part, { cents: true })}</td>
      <td class="num">${fmtMoney(payment.interest_part, { cents: true })}</td>
      <td class="num">${fmtMoney(payment.balance_after, { cents: true })}</td>
      <td>${badge}${paid && payment.paid_date && payment.paid_date !== payment.due_date ? `<div class="dim" style="font-size:10px;margin-top:2px">оплачен ${fmtDateShort(payment.paid_date)}</div>` : ""}</td>
      <td class="num">${action}</td>
    </tr>`;
  }

  /* ---------------------------------------------------------- actions */
  async function editDebtFromElement(element) {
    const id = Number(element.dataset.id);
    let debt = state.detailDebt && state.detailDebt.id === id ? state.detailDebt : null;
    if (!debt) debt = state.debts.find((item) => item.id === id) || null;
    if (!debt) {
      try { debt = await api(`/api/debts/${id}`); } catch (error) { toast(error.message, "error"); return; }
    }
    openDebtForm(debt);
  }

  async function deleteDebt(debtId) {
    const debt = (state.detailDebt && state.detailDebt.id === debtId)
      ? state.detailDebt
      : state.debts.find((item) => item.id === debtId);
    const title = debt ? debt.title : "этот долг";
    const ok = await confirmAction({
      title: "Удалить долг?",
      message: `Удалить <b>${esc(title)}</b> вместе со всем графиком и историей платежей? Это действие нельзя отменить.`,
      confirmText: "Удалить",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/debts/${debtId}`, { method: "DELETE" });
      closeModal();
      toast("Долг удалён", "info");
      await loadRoute(state.route);
      refreshSidebar();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function closeDebt(debtId) {
    const debt = state.detailDebt && state.detailDebt.id === debtId ? state.detailDebt : null;
    const title = debt ? debt.title : "этот долг";
    const wasDetail = state.detailDebtId === debtId;
    const ok = await confirmAction({
      title: "Закрыть долг?",
      message: `Долг <b>${esc(title)}</b> будет помечен как закрытый и исчезнет из активных расчётов. Платёжи останутся в истории.`,
      confirmText: "Закрыть долг",
      danger: false,
    });
    if (!ok) return;
    try {
      await api(`/api/debts/${debtId}/close`, { method: "POST" });
      closeModal();
      toast("Долг закрыт");
      await loadRoute(state.route);
      refreshSidebar();
      if (wasDetail) openDebtDetail(debtId);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function reopenDebt(debtId) {
    const wasDetail = state.detailDebtId === debtId;
    try {
      await api(`/api/debts/${debtId}/reopen`, { method: "POST" });
      closeModal();
      toast("Долг возвращён в работу");
      await loadRoute(state.route);
      refreshSidebar();
      if (wasDetail) openDebtDetail(debtId);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function undoPayment(paymentId, title) {
    const wasDetail = Boolean(state.detailDebtId);
    const detailId = state.detailDebtId;
    const ok = await confirmAction({
      title: "Отменить оплату?",
      message: `Платёж по долгу <b>${esc(title || "выбранному долгу")}</b> снова станет ожидающим, а сумма вернётся в остаток.`,
      confirmText: "Вернуть в ожидание",
      danger: false,
    });
    if (!ok) return;
    try {
      await api(`/api/payments/${paymentId}/undo`, { method: "POST" });
      toast("Отметка об оплате отменена", "info");
      await loadRoute(state.route);
      refreshSidebar();
      if (wasDetail && detailId) openDebtDetail(detailId);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function loadDemo() {
    try {
      await api("/api/demo", { method: "POST" });
      toast("Демо-данные загружены");
      await loadRoute(state.route);
      refreshSidebar();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function downloadUrl(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function exportJson() {
    const native = nativeApi();
    if (native && native.save_backup) {
      try {
        const result = await native.save_backup();
        if (result && result.error) throw new Error(result.error);
        if (!result || result.cancelled) return;
        toast(`Копия сохранена: ${result.path}`, "success");
      } catch (error) {
        toast(error.message || "Не удалось сохранить файл", "error");
      }
      return;
    }
    downloadUrl("/api/export", "debts-backup.json");
    toast("Загрузка файла началась", "info");
  }

  async function exportCsv() {
    const native = nativeApi();
    if (native && native.save_csv) {
      try {
        const result = await native.save_csv();
        if (result && result.error) throw new Error(result.error);
        if (!result || result.cancelled) return;
        toast(`CSV сохранён: ${result.path}`, "success");
      } catch (error) {
        toast(error.message || "Не удалось сохранить файл", "error");
      }
      return;
    }
    downloadUrl("/api/export/schedule.csv", "payment-schedule.csv");
    toast("Загрузка файла началась", "info");
  }

  async function backupDatabase() {
    try {
      const result = await api("/api/backup", { method: "POST" });
      toast(`Резервная копия: ${result.path}`, "success");
      if (state.route === "settings") await loadRoute("settings");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function restoreBackup(name) {
    const ok = await confirmAction({
      title: "Восстановить резервную копию?",
      message: `Текущие данные будут заменены копией <b>${esc(name)}</b>. Перед восстановлением приложение автоматически сохранит страховочную копию.`,
      confirmText: "Восстановить",
      danger: true,
    });
    if (!ok) return;
    try {
      const result = await api("/api/backups/restore", { method: "POST", body: { name } });
      const counts = result.counts || {};
      toast(`Восстановлено: ${counts.debts || 0} долгов, ${counts.payments || 0} платежей`, "success");
      const info = await api("/api/info");
      state.info = info;
      state.settings = { ...state.settings, ...info };
      applyTheme(info.theme || "dark", { sync: false });
      state.incomes = null;
      await loadRoute("settings");
      refreshSidebar();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function deleteBackup(name) {
    const ok = await confirmAction({
      title: "Удалить резервную копию?",
      message: `Файл <b>${esc(name)}</b> будет удалён. Это действие необратимо.`,
      confirmText: "Удалить",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/backups/${encodeURIComponent(name)}`, { method: "DELETE" });
      toast("Резервная копия удалена");
      await loadRoute("settings");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function refreshBackups() {
    try {
      const result = await api("/api/backups");
      state.backups = result.items || [];
      state.backupMeta = { dir: result.dir || "", keep: result.keep || 5 };
      await loadRoute("settings");
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function importViaBrowser() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      let data;
      try {
        data = JSON.parse(await file.text());
      } catch (error) {
        toast("Не удалось прочитать JSON-файл", "error");
        return;
      }
      const ok = await confirmAction({
        title: "Импортировать данные?",
        message: "Все текущие долги и платежи будут заменены данными из файла. Рекомендуем сначала сделать резервную копию.",
        confirmText: "Импортировать",
        danger: true,
      });
      if (!ok) return;
      try {
        const result = await api("/api/import", { method: "POST", body: data });
        toast(`Импортировано: ${result.debts} долгов, ${result.payments} платежей`);
        await loadRoute(state.route);
        refreshSidebar();
      } catch (error) {
        toast(error.message, "error");
      }
    });
    input.click();
  }

  async function importJson() {
    const native = nativeApi();
    if (native && native.import_backup) {
      try {
        const result = await native.import_backup();
        if (result && result.error) throw new Error(result.error);
        if (result && result.cancelled) return;
        toast(`Импортировано: ${result.counts.debts} долгов, ${result.counts.payments} платежей`);
        await loadRoute(state.route);
        refreshSidebar();
      } catch (error) {
        toast(error.message || "Не удалось импортировать файл", "error");
      }
      return;
    }
    importViaBrowser();
  }

  async function openFolder() {
    const native = nativeApi();
    if (native && native.open_folder) {
      try {
        const result = await native.open_folder();
        if (result && result.error) throw new Error(result.error);
      } catch (error) {
        toast(error.message, "error");
      }
      return;
    }
    toast(`Папка приложения: ${state.info?.base_dir || "data"}`, "info");
  }

  async function resetData() {
    const ok = await confirmAction({
      title: "Очистить все данные?",
      message: "Будут удалены <b>все долги, графики и история платежей</b>. Действие необратимо — сначала сделайте резервную копию.",
      confirmText: "Очистить всё",
      danger: true,
      requireText: "УДАЛИТЬ",
    });
    if (!ok) return;
    try {
      await api("/api/reset", { method: "POST" });
      toast("Все данные удалены", "info");
      state.debtFilters = { q: "", status: "active", sort: "next" };
      state.historyFilters = { q: "", debtId: "all", year: "all" };
      await loadRoute(state.route);
      refreshSidebar();
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function handleAction(action, element) {
    switch (action) {
      case "close-modal":
        closeModal();
        break;
      case "add-debt":
        openDebtForm();
        break;
      case "add-income-source":
        await openIncomeSourceForm();
        break;
      case "edit-income-source": {
        const source = (state.incomes?.sources || []).find((item) => String(item.id) === element.dataset.id);
        await openIncomeSourceForm(source || Number(element.dataset.id));
        break;
      }
      case "receive-income":
        await openIncomeModal({ sourceId: element.dataset.source || null });
        break;
      case "delete-income-source":
        await deleteIncomeSource(Number(element.dataset.id));
        break;
      case "open-income-receipt":
        await openIncomeReceipt(Number(element.dataset.id));
        break;
      case "delete-income-receipt":
        await deleteIncomeReceipt(Number(element.dataset.id));
        break;
      case "edit-debt":
        await editDebtFromElement(element);
        break;
      case "open-debt":
        await openDebtDetail(Number(element.dataset.id));
        break;
      case "delete-debt":
        await deleteDebt(Number(element.dataset.id));
        break;
      case "close-debt":
        await closeDebt(Number(element.dataset.id));
        break;
      case "reopen-debt":
        await reopenDebt(Number(element.dataset.id));
        break;
      case "pay": {
        const paymentId = Number(element.dataset.payment);
        let info = {
          payment_id: paymentId,
          amount: toNumber(element.dataset.amount, 0),
          due_date: element.dataset.due || todayISO(),
          title: element.dataset.title || "",
          fromDetail: Boolean(state.detailDebtId),
        };
        if (state.detailDebt && state.detailDebt.payments) {
          const row = state.detailDebt.payments.find((payment) => payment.id === paymentId);
          if (row) {
            info.amount = row.amount;
            info.due_date = row.due_date;
            info.title = state.detailDebt.title;
          }
        }
        openPayModal(info);
        break;
      }
      case "undo-pay": {
        const paymentId = Number(element.dataset.payment);
        let title = element.dataset.title || "";
        if (!title && state.detailDebt) title = state.detailDebt.title;
        await undoPayment(paymentId, title);
        break;
      }
      case "toggle-theme":
        await toggleTheme();
        break;
      case "set-theme": {
        const theme = element.dataset.themeValue === "light" ? "light" : "dark";
        applyTheme(theme);
        $$("#theme-segmented button").forEach((button) => {
          button.classList.toggle("active", button.dataset.themeValue === theme);
        });
        break;
      }
      case "debts-status": {
        state.debtFilters.status = element.dataset.status || "active";
        $$("#debts-status button").forEach((button) => {
          button.classList.toggle("active", button.dataset.status === state.debtFilters.status);
        });
        renderDebtGrid();
        break;
      }
      case "month-prev":
        state.month = addMonthsKey(state.month, -1);
        await loadRoute("schedule");
        break;
      case "month-next":
        state.month = addMonthsKey(state.month, 1);
        await loadRoute("schedule");
        break;
      case "month-today":
        state.month = currentMonthKey();
        await loadRoute("schedule");
        break;
      case "goto-overdue":
        state.month = element.dataset.month || currentMonthKey();
        await loadRoute("schedule");
        break;
      case "load-demo":
        await loadDemo();
        break;
      case "export-json":
        await exportJson();
        break;
      case "export-csv":
        await exportCsv();
        break;
      case "backup":
        await backupDatabase();
        break;
      case "restore-backup":
        await restoreBackup(element.dataset.name || "");
        break;
      case "delete-backup":
        await deleteBackup(element.dataset.name || "");
        break;
      case "refresh-backups":
        await refreshBackups();
        break;
      case "import-json":
        await importJson();
        break;
      case "open-folder":
        await openFolder();
        break;
      case "reset-data":
        await resetData();
        break;
      case "retry":
        await loadRoute(state.route);
        break;
      default:
        break;
    }
  }

  /* ---------------------------------------------------------- events */
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger) return;
    if (trigger.tagName === "A") event.preventDefault();
    handleAction(trigger.dataset.action, trigger).catch((error) => {
      console.error(error);
      toast(error.message || "Что-то пошло не так", "error");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const modal = $("#modal-root");
      if (modal && modal.classList.contains("open")) closeModal();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    const element = event.target.closest && event.target.closest("[data-action]");
    if (!element) return;
    if (["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) return;
    event.preventDefault();
    element.click();
  });

  const modalRoot = $("#modal-root");
  if (modalRoot) {
    modalRoot.addEventListener("mousedown", (event) => {
      if (event.target && event.target.matches("[data-modal-backdrop]")) closeModal();
    });
  }

  /* ---------------------------------------------------------- init */
  async function init() {
    fillIcons(document);
    const dateElement = $("#topbar-date");
    if (dateElement) {
      const today = new Date();
      dateElement.textContent = `Сегодня · ${WEEKDAYS_FULL[today.getDay()]}, ${fmtDate(todayISO())}`;
    }

    try {
      const info = await api("/api/info");
      state.info = info;
      state.settings = { ...state.settings, ...info };
      let savedTheme = null;
      try { savedTheme = localStorage.getItem("debt-theme"); } catch (error) {}
      applyTheme(savedTheme === "light" || savedTheme === "dark" ? savedTheme : (info.theme || "dark"), { sync: false });
    } catch (error) {
      toast("Не удалось подключиться к локальному серверу", "error");
    }

    configureCharts();
    await navigate();
    window.addEventListener("hashchange", navigate);
  }

  init();
})();
