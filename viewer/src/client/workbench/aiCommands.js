import { CAD_DISPLAY_MODE } from "cadjs/lib/displaySettings";
import { CAMERA_PROJECTION } from "cadjs/lib/perspective";

export const AI_INTENTS = Object.freeze({
  HELP: "help",
  OPEN_FILE: "openFile",
  SET_DISPLAY_MODE: "setDisplayMode",
  SET_PROJECTION: "setProjection",
  FIT_VIEW: "fitView",
  RESET_VIEW: "resetView",
  HIDE_ALL: "hideAll",
  SHOW_ALL: "showAll",
  HIDE_OTHERS: "hideOthers",
  PLAY_ANIMATION: "playAnimation",
  PAUSE_ANIMATION: "pauseAnimation",
  SCREENSHOT: "screenshot",
  ENTER_PREVIEW: "enterPreview",
  EXIT_PREVIEW: "exitPreview",
  FILE_INFO: "fileInfo",
  RESET_PARAMS: "resetParams",
  SET_PARAM: "setParam",
  RESET_POSE: "resetPose",
  DARK_THEME: "darkTheme",
  LIGHT_THEME: "lightTheme"
});

export const DISPLAY_MODE_OPTIONS = Object.freeze([
  { zh: "实体", en: "solid" },
  { zh: "渲染", en: "rendered" },
  { zh: "X射线", en: "transparent" },
  { zh: "隐藏线", en: "hidden_edges" },
  { zh: "线条", en: "hidden_lines_removed" },
  { zh: "平面", en: "unshaded" },
  { zh: "线框", en: "wireframe" }
]);

export const PROJECTION_OPTIONS = Object.freeze([
  { zh: "正射", en: "orthographic" },
  { zh: "透视", en: "perspective" }
]);

const MODE_ROWS = DISPLAY_MODE_OPTIONS.map((option) => ({
  zh: option.zh,
  en: option.en,
  commandZh: `设置显示模式 ${option.zh}`,
  commandEn: `set display mode ${option.en}`
}));

const PROJECTION_ROWS = PROJECTION_OPTIONS.map((option) => ({
  zh: option.zh,
  en: option.en,
  commandZh: `设置投影 ${option.zh}`,
  commandEn: `set projection ${option.en}`
}));

export const AI_COMMAND_ROWS = Object.freeze([
  { zh: "帮助", en: "help", commandZh: "帮助", commandEn: "help" },
  { zh: "打开 <文件名>", en: "open <file name>", commandZh: "打开 ", commandEn: "open " },
  { zh: "设置显示模式 <模式>", en: "set display mode <mode>", commandZh: "设置显示模式 ", commandEn: "set display mode " },
  ...MODE_ROWS,
  { zh: "设置投影 <投影>", en: "set projection <projection>", commandZh: "设置投影 ", commandEn: "set projection " },
  ...PROJECTION_ROWS,
  { zh: "适应视图", en: "fit view", commandZh: "适应视图", commandEn: "fit view" },
  { zh: "重置视图", en: "reset view", commandZh: "重置视图", commandEn: "reset view" },
  { zh: "截图", en: "screenshot", commandZh: "截图", commandEn: "screenshot" },
  { zh: "隐藏所有零件", en: "hide all parts", commandZh: "隐藏所有零件", commandEn: "hide all parts" },
  { zh: "显示所有零件", en: "show all parts", commandZh: "显示所有零件", commandEn: "show all parts" },
  { zh: "隔离选中", en: "isolate selected", commandZh: "隔离选中", commandEn: "isolate selected" },
  { zh: "文件信息", en: "file info", commandZh: "文件信息", commandEn: "file info" },
  { zh: "设置参数 <名称> <值>", en: "set parameter <name> <value>", commandZh: "设置参数 ", commandEn: "set parameter " },
  { zh: "重置参数", en: "reset parameters", commandZh: "重置参数", commandEn: "reset parameters" },
  { zh: "重置姿态", en: "reset pose", commandZh: "重置姿态", commandEn: "reset pose" },
  { zh: "播放动画", en: "play animation", commandZh: "播放动画", commandEn: "play animation" },
  { zh: "暂停动画", en: "pause animation", commandZh: "暂停动画", commandEn: "pause animation" },
  { zh: "进入预览", en: "preview mode", commandZh: "进入预览", commandEn: "preview mode" },
  { zh: "退出预览", en: "exit preview", commandZh: "退出预览", commandEn: "exit preview" },
  { zh: "深色模式", en: "dark mode", commandZh: "深色模式", commandEn: "dark mode" },
  { zh: "浅色模式", en: "light mode", commandZh: "浅色模式", commandEn: "light mode" }
]);

export function buildCommandRows({ catalog = [], parameters = [], lang = "en" } = {}) {
  const base = AI_COMMAND_ROWS.map((row) => ({
    key: `base-${row.zh}`,
    zh: row.zh,
    en: row.en,
    command: lang === "zh" ? row.commandZh : row.commandEn,
    group: null
  }));
  const fileRows = (Array.isArray(catalog) ? catalog : []).map((item) => {
    const label = String(item.label || item.key || "");
    return {
      key: `file-${item.key || label}`,
      zh: `打开 ${label}`,
      en: `open ${label}`,
      command: lang === "zh" ? `打开 ${label}` : `open ${label}`,
      group: "file"
    };
  });
  const paramRows = (Array.isArray(parameters) ? parameters : []).map((parameter) => {
    const label = String(parameter.label || parameter.id || "");
    return {
      key: `param-${parameter.id || label}`,
      zh: `设置参数 ${label} `,
      en: `set parameter ${label} `,
      command: lang === "zh" ? `设置参数 ${label} ` : `set parameter ${label} `,
      group: "param"
    };
  });
  return [...base, ...fileRows, ...paramRows];
}

const DISPLAY_MODE_KEYWORDS = Object.freeze({
  solid: CAD_DISPLAY_MODE.SOLID,
  实体: CAD_DISPLAY_MODE.SOLID,
  rendered: CAD_DISPLAY_MODE.RENDERED,
  渲染: CAD_DISPLAY_MODE.RENDERED,
  transparent: CAD_DISPLAY_MODE.TRANSPARENT,
  "x射线": CAD_DISPLAY_MODE.TRANSPARENT,
  hidden_edges: CAD_DISPLAY_MODE.HIDDEN_EDGES,
  隐藏线: CAD_DISPLAY_MODE.HIDDEN_EDGES,
  hidden_lines_removed: CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED,
  线条: CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED,
  unshaded: CAD_DISPLAY_MODE.UNSHADED,
  平面: CAD_DISPLAY_MODE.UNSHADED,
  wireframe: CAD_DISPLAY_MODE.WIREFRAME,
  线框: CAD_DISPLAY_MODE.WIREFRAME
});

const PROJECTION_KEYWORDS = Object.freeze({
  orthographic: CAMERA_PROJECTION.ORTHOGRAPHIC,
  正射: CAMERA_PROJECTION.ORTHOGRAPHIC,
  perspective: CAMERA_PROJECTION.PERSPECTIVE,
  透视: CAMERA_PROJECTION.PERSPECTIVE
});

const EXACT_COMMANDS = Object.freeze({
  "help": AI_INTENTS.HELP,
  "帮助": AI_INTENTS.HELP,
  "screenshot": AI_INTENTS.SCREENSHOT,
  "截图": AI_INTENTS.SCREENSHOT,
  "preview mode": AI_INTENTS.ENTER_PREVIEW,
  "进入预览": AI_INTENTS.ENTER_PREVIEW,
  "exit preview": AI_INTENTS.EXIT_PREVIEW,
  "退出预览": AI_INTENTS.EXIT_PREVIEW,
  "fit view": AI_INTENTS.FIT_VIEW,
  "适应视图": AI_INTENTS.FIT_VIEW,
  "reset view": AI_INTENTS.RESET_VIEW,
  "重置视图": AI_INTENTS.RESET_VIEW,
  "hide all parts": AI_INTENTS.HIDE_ALL,
  "隐藏所有零件": AI_INTENTS.HIDE_ALL,
  "show all parts": AI_INTENTS.SHOW_ALL,
  "显示所有零件": AI_INTENTS.SHOW_ALL,
  "isolate selected": AI_INTENTS.HIDE_OTHERS,
  "隔离选中": AI_INTENTS.HIDE_OTHERS,
  "play animation": AI_INTENTS.PLAY_ANIMATION,
  "播放动画": AI_INTENTS.PLAY_ANIMATION,
  "pause animation": AI_INTENTS.PAUSE_ANIMATION,
  "暂停动画": AI_INTENTS.PAUSE_ANIMATION,
  "file info": AI_INTENTS.FILE_INFO,
  "文件信息": AI_INTENTS.FILE_INFO,
  "reset parameters": AI_INTENTS.RESET_PARAMS,
  "重置参数": AI_INTENTS.RESET_PARAMS,
  "reset pose": AI_INTENTS.RESET_POSE,
  "重置姿态": AI_INTENTS.RESET_POSE,
  "dark mode": AI_INTENTS.DARK_THEME,
  "深色模式": AI_INTENTS.DARK_THEME,
  "light mode": AI_INTENTS.LIGHT_THEME,
  "浅色模式": AI_INTENTS.LIGHT_THEME
});

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchFileExact(catalog, query) {
  if (!Array.isArray(catalog) || !query) {
    return null;
  }
  const normalizedQuery = normalize(query);
  const withoutExt = normalizedQuery.replace(/\.(step|stp|stl|3mf|glb|dxf|gcode|urdf|sdf|srdf|implicit)$/i, "");
  return (
    catalog.find((item) => {
      const label = normalize(item.label || "");
      const key = normalize(item.key || "");
      const strippedLabel = label.replace(/\.(step|stp|stl|3mf|glb|dxf|gcode|urdf|sdf|srdf|implicit)$/i, "");
      const strippedKey = key.replace(/\.(step|stp|stl|3mf|glb|dxf|gcode|urdf|sdf|srdf|implicit)$/i, "");
      return label === normalizedQuery ||
        key === normalizedQuery ||
        label === withoutExt ||
        key === withoutExt ||
        strippedLabel === withoutExt ||
        strippedKey === withoutExt;
    }) || null
  );
}

function matchParameterExact(parameters, keyword) {
  if (!Array.isArray(parameters) || !keyword) {
    return null;
  }
  const normalized = normalize(keyword);
  return (
    parameters.find((parameter) =>
      normalize(parameter.id) === normalized ||
      normalize(parameter.label) === normalized
    ) || null
  );
}

export function parseAiCommand(text, context = {}) {
  const input = normalize(text);
  if (!input) {
    return null;
  }
  const catalog = Array.isArray(context?.catalog) ? context.catalog : [];
  const parameters = Array.isArray(context?.parameters) ? context.parameters : [];

  const exactIntent = EXACT_COMMANDS[input];
  if (exactIntent) {
    return { intent: exactIntent, params: {}, match: text.trim() };
  }

  let match = input.match(/^(?:open|打开)\s+(.+)$/i);
  if (match) {
    const file = matchFileExact(catalog, match[1]);
    return {
      intent: AI_INTENTS.OPEN_FILE,
      params: { file, query: match[1] },
      match: text.trim()
    };
  }

  match = input.match(/^(?:set display mode|设置显示模式)\s+(.+)$/i);
  if (match) {
    const mode = DISPLAY_MODE_KEYWORDS[normalize(match[1])] ?? null;
    if (mode) {
      return { intent: AI_INTENTS.SET_DISPLAY_MODE, params: { mode }, match: text.trim() };
    }
    return null;
  }

  match = input.match(/^(?:set projection|设置投影)\s+(.+)$/i);
  if (match) {
    const projection = PROJECTION_KEYWORDS[normalize(match[1])] ?? null;
    if (projection) {
      return { intent: AI_INTENTS.SET_PROJECTION, params: { projection }, match: text.trim() };
    }
    return null;
  }

  match = input.match(/^(?:set parameter|设置参数)\s+([\w\u4e00-\u9fa5.-]+)\s+(-?\d+(?:\.\d+)?)$/i);
  if (match) {
    const parameter = matchParameterExact(parameters, match[1]);
    return {
      intent: AI_INTENTS.SET_PARAM,
      params: {
        parameter,
        query: match[1],
        value: Number(match[2])
      },
      match: text.trim()
    };
  }

  return null;
}
