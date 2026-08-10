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

const DISPLAY_MODE_ALIASES = Object.freeze({
  solid: CAD_DISPLAY_MODE.SOLID,
  rendered: CAD_DISPLAY_MODE.RENDERED,
  render: CAD_DISPLAY_MODE.RENDERED,
  xray: CAD_DISPLAY_MODE.TRANSPARENT,
  xray1: CAD_DISPLAY_MODE.TRANSPARENT,
  transparent: CAD_DISPLAY_MODE.TRANSPARENT,
  hidden: CAD_DISPLAY_MODE.HIDDEN_EDGES,
  hidden1: CAD_DISPLAY_MODE.HIDDEN_EDGES,
  lines: CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED,
  flat: CAD_DISPLAY_MODE.UNSHADED,
  wire: CAD_DISPLAY_MODE.WIREFRAME,
  wireframe: CAD_DISPLAY_MODE.WIREFRAME
});

export const DISPLAY_MODE_LABELS = Object.freeze({
  [CAD_DISPLAY_MODE.SOLID]: "实体",
  [CAD_DISPLAY_MODE.RENDERED]: "渲染",
  [CAD_DISPLAY_MODE.TRANSPARENT]: "X 射线",
  [CAD_DISPLAY_MODE.HIDDEN_EDGES]: "隐藏",
  [CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED]: "线条",
  [CAD_DISPLAY_MODE.UNSHADED]: "平面",
  [CAD_DISPLAY_MODE.WIREFRAME]: "线框"
});

export function matchDisplayMode(keyword) {
  const normalized = String(keyword || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const zhMap = {
    "实体": CAD_DISPLAY_MODE.SOLID,
    "渲染": CAD_DISPLAY_MODE.RENDERED,
    "x光": CAD_DISPLAY_MODE.TRANSPARENT,
    "x射线": CAD_DISPLAY_MODE.TRANSPARENT,
    "半透明": CAD_DISPLAY_MODE.TRANSPARENT,
    "隐藏": CAD_DISPLAY_MODE.HIDDEN_EDGES,
    "隐藏线": CAD_DISPLAY_MODE.HIDDEN_EDGES,
    "线条": CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED,
    "平面": CAD_DISPLAY_MODE.UNSHADED,
    "线框": CAD_DISPLAY_MODE.WIREFRAME
  };
  return zhMap[normalized] ?? DISPLAY_MODE_ALIASES[normalized] ?? null;
}

export function matchProjection(keyword) {
  const normalized = String(keyword || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (/^正射|正交|orthog|ortho$/.test(normalized)) {
    return CAMERA_PROJECTION.ORTHOGRAPHIC;
  }
  if (/^透视|persp|perspective$/.test(normalized)) {
    return CAMERA_PROJECTION.PERSPECTIVE;
  }
  return null;
}

function matchFile(catalog, keyword) {
  if (!Array.isArray(catalog) || !keyword) {
    return null;
  }
  const query = String(keyword).trim().toLowerCase().replace(/\.(step|stp|stl|3mf|glb|dxf|gcode|urdf|sdf|srdf|implicit)$/i, "");
  if (!query) {
    return null;
  }
  const matches = catalog.filter((item) =>
    String(item.label || item.key || "").toLowerCase().includes(query)
  );
  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    const exact = matches.find((item) =>
      String(item.label || item.key || "").toLowerCase() === query
    );
    return exact || matches[0];
  }
  return null;
}

function matchImplicitParameter(parameters, keyword) {
  if (!Array.isArray(parameters) || !keyword) {
    return null;
  }
  const query = String(keyword).trim().toLowerCase();
  const byId = parameters.find((p) => String(p.id || "").toLowerCase() === query);
  if (byId) {
    return byId;
  }
  const byLabel = parameters.find((p) =>
    String(p.label || "").toLowerCase().includes(query)
  );
  return byLabel || null;
}

const PATTERNS = Object.freeze([
  {
    intent: AI_INTENTS.HELP,
    patterns: [/^(help|\?|帮助|能做什么|指令|指令列表|怎么用)$/i]
  },
  {
    intent: AI_INTENTS.SCREENSHOT,
    patterns: [/^(截图|复制截图|截图保存|screenshot|snap)$/i]
  },
  {
    intent: AI_INTENTS.ENTER_PREVIEW,
    patterns: [/^(进入预览|预览模式|全屏预览|preview mode|fullscreen)$/i]
  },
  {
    intent: AI_INTENTS.EXIT_PREVIEW,
    patterns: [/^(退出预览|退出全屏|返回工作台|exit preview|back to workspace)$/i]
  },
  {
    intent: AI_INTENTS.FIT_VIEW,
    patterns: [/^(适应视图|适配视图|适配模型|放到最大|fit view|fit model|fit)$/i]
  },
  {
    intent: AI_INTENTS.RESET_VIEW,
    patterns: [/^(重置缩放|重置视图|还原视图|reset zoom|reset view|reset)$/i]
  },
  {
    intent: AI_INTENTS.HIDE_ALL,
    patterns: [/^(隐藏所有零件|隐藏全部|全部隐藏|hide all parts|hide all)$/i]
  },
  {
    intent: AI_INTENTS.SHOW_ALL,
    patterns: [/^(显示所有零件|显示全部|全部显示|show all parts|show all|unhide all)$/i]
  },
  {
    intent: AI_INTENTS.HIDE_OTHERS,
    patterns: [/^(隔离选中|隔离所选|隐藏其他零件|隐藏其他|isolate selection|isolate selected|hide others)$/i]
  },
  {
    intent: AI_INTENTS.PLAY_ANIMATION,
    patterns: [/^(播放动画|开始动画|播放|play animation|play)$/i]
  },
  {
    intent: AI_INTENTS.PAUSE_ANIMATION,
    patterns: [/^(暂停动画|停止动画|暂停|停止|pause animation|pause|stop animation)$/i]
  },
  {
    intent: AI_INTENTS.FILE_INFO,
    patterns: [/^(文件信息|当前文件|查看信息|这是什么文件|file info|current file|info)$/i]
  },
  {
    intent: AI_INTENTS.RESET_PARAMS,
    patterns: [/^(重置参数|恢复默认参数|参数复位|reset parameters|reset params)$/i]
  },
  {
    intent: AI_INTENTS.RESET_POSE,
    patterns: [/^(重置姿态|重置位姿|恢复默认姿态|reset pose)$/i]
  },
  {
    intent: AI_INTENTS.DARK_THEME,
    patterns: [/^(深色模式|暗色模式|切换深色|dark mode|dark theme|dark)$/i]
  },
  {
    intent: AI_INTENTS.LIGHT_THEME,
    patterns: [/^(浅色模式|亮色模式|切换浅色|light mode|light theme|light)$/i]
  }
]);

export function parseAiCommand(text, context = {}) {
  const input = String(text || "").trim();
  if (!input) {
    return null;
  }
  const catalog = Array.isArray(context?.catalog) ? context.catalog : [];
  const parameters = Array.isArray(context?.parameters) ? context.parameters : [];

  for (const { intent, patterns } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return { intent, params: {}, match: input };
      }
    }
  }

  const openMatch = input.match(/^(?:打开|查看|打开文件|加载|open|view|open file|load)[：:\s]+(.+)$/i);
  if (openMatch) {
    const file = matchFile(catalog, openMatch[1]);
    return {
      intent: AI_INTENTS.OPEN_FILE,
      params: { file, query: openMatch[1].trim() },
      match: input
    };
  }

  const modeMatch = input.match(/^(?:显示模式|切换(?:到)?|设置(?:为)?|改为)?\s*(实体|渲染|x射线|x光|隐藏线|线条|平面|线框|隐藏)\s*(?:模式|显示)?$|^(?:mode|display mode)[：:\s]+(.+)$/i);
  if (modeMatch) {
    const keyword = modeMatch[1] || modeMatch[2] || "";
    const mode = matchDisplayMode(keyword);
    if (mode) {
      return { intent: AI_INTENTS.SET_DISPLAY_MODE, params: { mode }, match: input };
    }
  }

  const projMatch = input.match(/^(?:投影|投影方式)?\s*(正射|正交|透视|orthographic|perspective|ortho|persp)\s*(?:投影)?$/i);
  if (projMatch) {
    const projection = matchProjection(projMatch[1]);
    if (projection) {
      return { intent: AI_INTENTS.SET_PROJECTION, params: { projection }, match: input };
    }
  }

  const paramMatch = input.match(/^(?:设置|设定|调整|修改|set|change)\s*(?:参数|parameter)?\s*[：:\s]+([a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*)\s*(?:为|到|等于|to|=)?\s*([\d.eE+-]+)$/i);
  if (paramMatch) {
    const parameter = matchImplicitParameter(parameters, paramMatch[1]);
    return {
      intent: AI_INTENTS.SET_PARAM,
      params: {
        parameter,
        query: paramMatch[1].trim(),
        value: Number(paramMatch[2])
      },
      match: input
    };
  }

  const paramMatchZh = input.match(/^(设置|设定|调整|修改)(参数)?\s*([\u4e00-\u9fa5a-zA-Z][\u4e00-\u9fa5a-zA-Z0-9_]*)\s*(?:为|到|等于|至)\s*([\d.eE+-]+)$/i);
  if (paramMatchZh) {
    const parameter = matchImplicitParameter(parameters, paramMatchZh[3]);
    return {
      intent: AI_INTENTS.SET_PARAM,
      params: {
        parameter,
        query: paramMatchZh[3].trim(),
        value: Number(paramMatchZh[4])
      },
      match: input
    };
  }

  return null;
}
