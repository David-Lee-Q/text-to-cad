import { useMemo } from "react";
import { ArrowLeft, BookOpen, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider
} from "@/components/ui/tooltip";
import LanguageToggle from "./LanguageToggle";
import { useI18n } from "@/i18n";

const HELP_DOCUMENT = {
  en: {
    description: "A user guide for COSMO AI CAD, the browser previewer for CAD, G-code, and robot-description files.",
    sections: [
      {
        title: "Quick Start",
        blocks: [
          { type: "p", text: "COSMO AI CAD previews local CAD, G-code, and robot files directly in the browser. Select a file from the left file browser or the home screen shortcuts to start." }
        ],
        subs: [
          {
            title: "Interface Overview",
            blocks: [
              { type: "p", text: "The workspace is composed of four main areas:" },
              {
                type: "list",
                items: [
                  "Top bar — breadcrumb navigation, help and language controls, theme settings, update check, and community links.",
                  "Left sidebar — searchable file and directory browser.",
                  "Center viewport — 3D rendering of the selected file.",
                  "Right panel — format-specific file sheets with metadata, parameters, and issues."
                ]
              },
              { type: "p", text: "A floating toolbar and drawing toolbar overlay the viewport for view navigation and annotations." },
              { type: "image", src: "/help-screenshots/01-home.png", alt: "COSMO AI CAD home screen with file browser and quick entries" }
            ]
          },
          {
            title: "Opening and Browsing Files",
            blocks: [
              { type: "p", text: "Use the left sidebar to browse the active directory. The search box filters files by name, id, or path. Click a file to load it into the viewport." },
              { type: "p", text: "The home screen shows quick-entry icons for recently used files. Files are grouped by icon type: assembly, DXF, G-code, robot, STEP part, STL/3MF/GLB mesh, and implicit CAD." },
              { type: "p", text: "Use the type filter at the top of the home screen to narrow the list by file kind: All, Assembly, DXF, G-code, Robot, STEP, Mesh, or Implicit." },
              { type: "p", text: "Drag the sidebar edge to resize it. On mobile the sidebar opens as a drawer." }
            ]
          },
          {
            title: "Switching Language",
            blocks: [
              { type: "p", text: "The top bar language toggle switches the entire interface between Chinese and English. The choice is saved locally and applied to every menu, description, and tooltip across both the workspace and the help page." }
            ]
          }
        ]
      },
      {
        title: "3D Viewing",
        blocks: [
          { type: "p", text: "COSMO AI CAD renders STEP assemblies, mesh models, robot descriptions, DXF drawings, G-code toolpaths, and implicit CAD geometry in a shared 3D viewport." }
        ],
        subs: [
          {
            title: "View Navigation",
            blocks: [
              { type: "p", text: "Orbit, pan, and zoom the camera with the mouse or touch gestures. Use the zoom controls in the corner or the floating toolbar to fit the model to the view and reset zoom." },
              { type: "p", text: "The view-plane indicator shows the current camera orientation in the x/y/z axes." },
              { type: "image", src: "/help-screenshots/02-step-viewer.png", alt: "STEP assembly rendered in the 3D viewport" }
            ]
          },
          {
            title: "Display Modes",
            blocks: [
              { type: "p", text: "Seven display modes are available for STEP views: Solid, Rendered, X-Ray, Hidden, Lines, Flat, and Wire." },
              {
                type: "list",
                items: [
                  "Solid — shaded surfaces.",
                  "Rendered — lit, material-aware rendering.",
                  "X-Ray — translucent surfaces.",
                  "Hidden — hidden-line visualization.",
                  "Lines — edge-only drawing.",
                  "Flat — flat-shaded faces.",
                  "Wire — wireframe mesh."
                ]
              }
            ]
          },
          {
            title: "Projection",
            blocks: [
              { type: "p", text: "Switch between Orthographic and Perspective projection from the display controls. Orthographic is preferred for measurement-style inspection; Perspective gives a natural depth feel." }
            ]
          },
          {
            title: "Floating Toolbar",
            blocks: [
              { type: "p", text: "A floating toolbar over the viewport gives quick access to the main actions:" },
              {
                type: "list",
                items: [
                  "Select — pick reference geometry such as faces and edges.",
                  "Draw — toggle annotation mode.",
                  "Display — switch display mode and projection.",
                  "Play — step the animation of a STEP assembly.",
                  "Pose — pick a target pose for URDF robots.",
                  "Orbit — enter a distraction-free preview mode; press Esc to exit.",
                  "Screenshot — copy the current view as an image to the clipboard."
                ]
              },
              { type: "p", text: "Preview mode hides the surrounding panels so you can focus on the model. Press Esc to return to the workspace." }
            ]
          },
          {
            title: "Copying a Screenshot",
            blocks: [
              { type: "p", text: "Use the screenshot button on the floating toolbar to copy the current viewport as an image to the clipboard. Paste it into any document or chat." }
            ]
          }
        ]
      },
      {
        title: "File Format Guides",
        blocks: [],
        subs: [
          {
            title: "STEP Assembly",
            blocks: [
              { type: "p", text: "The STEP file sheet shows the assembly and topology tree: parts, reference geometry, and mates. Select a part to highlight it in the viewport." },
              {
                type: "list",
                items: [
                  "Hide or isolate parts to inspect inner geometry.",
                  "Use collapse-all and expand-all to manage a deep tree.",
                  "Copy a reference to a part or load its child nodes.",
                  "Play part-level animations and adjust speed and time."
                ]
              },
              { type: "image", src: "/help-screenshots/03-step-sheet.png", alt: "STEP file sheet with assembly tree and parameters" }
            ]
          },
          {
            title: "Robot Files (URDF / SDF / SRDF)",
            blocks: [
              { type: "p", text: "Robot files expose joint controls with sliders. Set joint angles, copy values or angles, and reset the pose to the stored defaults." },
              { type: "p", text: "Pose groups store named positions. Solve Inverse Kinematics to move the end effector to a target pose, or plan a motion to the pose." },
              { type: "p", text: "SDF files also show simulator metadata: includes, plugins, sensors, lights, and physics. SRDF files expose MoveIt planning groups and joints." },
              { type: "image", src: "/help-screenshots/04-robot.png", alt: "Robot file sheet with joint controls" }
            ]
          },
          {
            title: "DXF Drawing",
            blocks: [
              { type: "p", text: "The DXF sheet toggles between 2D and 3D view modes. In 3D mode you can adjust the bend direction, bend angle, and preview thickness for flat-pattern review." },
              { type: "image", src: "/help-screenshots/07-dxf.png", alt: "DXF drawing sheet" }
            ]
          },
          {
            title: "Implicit CAD Parameters",
            blocks: [
              { type: "p", text: "Implicit CAD files are controlled by parameter sliders, numeric inputs, and color pickers. Adjust a parameter to see the signed-distance-field model regenerate in real time." },
              {
                type: "list",
                items: [
                  "Copy or paste the parameter JSON to share exact settings.",
                  "Reset parameters to defaults at any time.",
                  "Play parameter animations and set speed from 0.1x to 3x.",
                  "Change the graphics scale from the graphics settings section."
                ]
              },
              { type: "image", src: "/help-screenshots/06-implicit.png", alt: "Implicit CAD file sheet with parameter controls" }
            ]
          },
          {
            title: "G-code Toolpath",
            blocks: [
              { type: "p", text: "The G-code sheet controls preview detail with a slider. Increase the level for a denser toolpath preview, or lower it for faster interaction on large files." },
              { type: "image", src: "/help-screenshots/05-gcode.png", alt: "G-code toolpath preview" }
            ]
          },
          {
            title: "Mesh Models (STL / 3MF / GLB)",
            blocks: [
              { type: "p", text: "Mesh files render directly in the viewport. Use the same navigation, display modes, and projection controls as STEP models." }
            ]
          }
        ]
      },
      {
        title: "Annotation and Drawing",
        blocks: [
          { type: "p", text: "Toggle the drawing pen from the floating toolbar to annotate directly on the model." }
        ],
        subs: [
          {
            title: "Drawing Tools",
            blocks: [
              { type: "p", text: "The drawing toolbar offers freehand, line, surface line, arrow, double arrow, rectangle, circle, fill, and erase tools." },
              { type: "p", text: "The toolbar also includes undo, redo, and clear-all buttons, with the matching keyboard shortcuts listed in the Keyboard Shortcuts section." },
              { type: "p", text: "Use the crosshair to pick reference points precisely before placing annotation elements." }
            ]
          },
          {
            title: "Undo and Redo",
            blocks: [
              { type: "p", text: "Use Ctrl/Cmd+Z to undo and Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo drawing actions. Undo and redo affect the current drawing session." }
            ]
          }
        ]
      },
      {
        title: "Appearance and Display Settings",
        blocks: [
          { type: "p", text: "Open the theme settings popover from the top bar to personalize the appearance of the viewport and materials." }
        ],
        subs: [
          {
            title: "Theme Presets",
            blocks: [
              { type: "p", text: "Choose a built-in preset from the preset menu, or save the current settings as a custom preset. Delete, reset, or restore defaults from the same menu." },
              { type: "image", src: "/help-screenshots/08-theme.png", alt: "Theme settings popover" }
            ]
          },
          {
            title: "Materials and Background",
            blocks: [
              { type: "p", text: "Adjust material appearance, background color, ground grid, environment, and lighting from the appearance section." }
            ]
          },
          {
            title: "Clip, Exploded View, and Edges",
            blocks: [
              { type: "p", text: "Enable the clip plane to cut through the model, the exploded view to separate assemblies, and edge display to emphasize boundaries." }
            ]
          }
        ]
      },
      {
        title: "File Operations and Sharing",
        blocks: [],
        subs: [
          {
            title: "File Context Menu",
            blocks: [
              { type: "p", text: "Right-click a file in the sidebar for operations: reveal in folder, reveal in explorer view, copy path, copy relative path, copy link, and download." },
              { type: "p", text: "Implicit CAD files can be exported to STL, 3MF, or GLB from the same context menu." }
            ]
          },
          {
            title: "Local Files Management",
            blocks: [
              { type: "p", text: "Use the upload button on the home screen or at the bottom of the sidebar to add STEP, STL, 3MF, GLB, G-code, DXF, URDF/SRDF/SDF or Implicit CAD files (up to 200MB each)." },
              { type: "p", text: "Uploaded files are stored in a dedicated \"Local Files\" folder. The folder and its files can be renamed or deleted from their context menus. Built-in files are read-only." },
              { type: "image", src: "/help-screenshots/10-local-files.png", alt: "Local Files context menu with rename and delete" }
            ]
          },
          {
            title: "Metadata and Issues",
            blocks: [
              { type: "p", text: "The file panel lists metadata groups with copy buttons. The status section lists issues and warnings with severity badges so you can review and report problems." }
            ]
          }
        ]
      },
      {
        title: "AI Assistant",
        blocks: [
          { type: "p", text: "The Bot button in the top bar opens the AI assistant drawer. Type an exact built-in command to view and edit the current CAD file. Commands must match the built-in list exactly (no fuzzy matching); typing a slash (/) in the input shows the full command table, including the current files and model parameters. Clicking a row sends that command directly; rows with a parameter placeholder fill the input for you to complete. The assistant runs a local intent parser, so commands are handled entirely in your browser." },
          { type: "image", src: "/help-screenshots/12-ai-chat.png", alt: "AI assistant drawer replying to an open-file command" },
          {
            type: "table",
            headers: ["Command", "Action"],
            rows: [
              ["help / 帮助", "Show the available commands"],
              ["open <file name> / 打开 <文件名>", "Open a file from the current directory (exact file name)"],
              ["set display mode <mode> / 设置显示模式 <模式>", "Display modes: solid / 实体, rendered / 渲染, transparent / X射线, hidden_edges / 隐藏线, hidden_lines_removed / 线条, unshaded / 平面, wireframe / 线框"],
              ["set projection <projection> / 设置投影 <投影>", "Projections: orthographic / 正射, perspective / 透视"],
              ["fit view / 适应视图", "Fit the model to the viewport"],
              ["reset view / 重置视图", "Reset the camera zoom"],
              ["screenshot / 截图", "Copy the viewport as an image to the clipboard"],
              ["hide all parts / 隐藏所有零件", "Hide all parts"],
              ["show all parts / 显示所有零件", "Show all parts"],
              ["isolate selected / 隔离选中", "Hide every part except the selected one"],
              ["file info / 文件信息", "Show metadata for the current file"],
              ["set parameter <name> <value> / 设置参数 <名称> <值>", "Adjust a parameter of an implicit model"],
              ["reset parameters / 重置参数", "Restore default parameters"],
              ["reset pose / 重置姿态", "Restore the default pose of a robot"],
              ["play animation / 播放动画", "Play the robot animation"],
              ["pause animation / 暂停动画", "Pause the robot animation"],
              ["preview mode / 进入预览", "Enter fullscreen preview"],
              ["exit preview / 退出预览", "Exit preview"],
              ["dark mode / 深色模式", "Switch to the dark theme"],
              ["light mode / 浅色模式", "Switch to the light theme"]
            ]
          }
        ]
      },
      {
        title: "Keyboard Shortcuts",
        blocks: [
          {
            type: "table",
            headers: ["Shortcut", "Action"],
            rows: [
              ["Ctrl/Cmd+Z", "Undo drawing action"],
              ["Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y", "Redo drawing action"],
              ["Esc", "Close overlay or exit preview"]
            ]
          }
        ]
      },
      {
        title: "Updates and Support",
        blocks: [
          { type: "callout", kind: "tip", text: "The version label in the top bar shows the installed version. If a newer release is available you will see an update prompt with the install command." },
          { type: "p", text: "Triple-click the version label in the top bar to open the project Git commit history in a full-screen dialog. The newest commit is highlighted at the top of the list, with the full message shown on the left and the date and hash on the right." },
          { type: "image", src: "/help-screenshots/11-git-log.png", alt: "Full-screen Git commit history dialog opened by triple-clicking the version label" },
          { type: "p", text: "Join the community Discord or open the GitHub repository from the top bar links to report issues, ask questions, and follow development." },
          { type: "image", src: "/help-screenshots/09-help.png", alt: "The help documentation page" }
        ]
      }
    ]
  },
  zh: {
    description: "COSMO AI CAD 用户指南，面向 CAD、G-code 与机器人描述文件的浏览器预览器。",
    sections: [
      {
        title: "快速入门",
        blocks: [
          { type: "p", text: "COSMO AI CAD 直接在浏览器中预览本地 CAD、G-code 与机器人描述文件。从左侧文件浏览器或首页快捷入口选择一个文件即可开始。" }
        ],
        subs: [
          {
            title: "界面总览",
            blocks: [
              { type: "p", text: "工作台由四个主要区域组成：" },
              {
                type: "list",
                items: [
                  "顶部栏——面包屑导航、帮助与语言切换、主题设置、更新检查与社区链接。",
                  "左侧边栏——可搜索的文件与目录浏览器。",
                  "中央视口——所选文件的 3D 渲染。",
                  "右侧面板——按格式区分的文件面板，展示元数据、参数与问题。"
                ]
              },
              { type: "p", text: "悬浮工具栏与绘图工具栏覆盖在视口上，用于视图导航与标注。" },
              { type: "image", src: "/help-screenshots/01-home.png", alt: "COSMO AI CAD 首页，包含文件浏览器与快捷入口" }
            ]
          },
          {
            title: "打开与浏览文件",
            blocks: [
              { type: "p", text: "使用左侧边栏浏览当前目录。搜索框可按名称、ID 或路径过滤文件。点击文件即可载入视口。" },
              { type: "p", text: "首页显示最近使用文件的快捷入口图标。文件按图标类型分组：装配体、DXF、G-code、机器人、STEP 零件、STL/3MF/GLB 网格与隐式 CAD。" },
              { type: "p", text: "使用首页顶部的类型筛选器可按文件类型缩小列表范围：全部、装配体、DXF、G-code、机器人、STEP、网格或隐式。" },
              { type: "p", text: "拖拽侧边栏边缘可调整宽度。移动端侧边栏以抽屉形式打开。" }
            ]
          },
          {
            title: "切换语言",
            blocks: [
              { type: "p", text: "顶部栏的语言切换按钮可在中文与英文之间切换整个界面。选择会被本地保存，并应用到工作台与帮助页的每个菜单、描述和提示。" }
            ]
          }
        ]
      },
      {
        title: "三维查看",
        blocks: [
          { type: "p", text: "COSMO AI CAD 在共享的 3D 视口中渲染 STEP 装配体、网格模型、机器人描述文件、DXF 图纸、G-code 刀路与隐式 CAD 几何。" }
        ],
        subs: [
          {
            title: "视图导航",
            blocks: [
              { type: "p", text: "使用鼠标或触控手势旋转、平移、缩放相机。使用角落的缩放控件或悬浮工具栏将模型适配到视图并重置缩放。" },
              { type: "p", text: "视图平面指示器以 x/y/z 轴显示当前相机朝向。" },
              { type: "image", src: "/help-screenshots/02-step-viewer.png", alt: "3D 视口中渲染的 STEP 装配体" }
            ]
          },
          {
            title: "显示模式",
            blocks: [
              { type: "p", text: "STEP 视图提供七种显示模式：实体、渲染、X 射线、隐藏、线条、平面与线框。" },
              {
                type: "list",
                items: [
                  "实体——着色表面。",
                  "渲染——带光照、材质感知的渲染。",
                  "X 射线——半透明表面。",
                  "隐藏——隐藏线可视化。",
                  "线条——仅边线绘制。",
                  "平面——平面着色面片。",
                  "线框——线框网格。"
                ]
              }
            ]
          },
          {
            title: "投影方式",
            blocks: [
              { type: "p", text: "从显示控件切换正射与透视投影。正射适合测量式检查；透视带来自然的纵深观感。" }
            ]
          },
          {
            title: "悬浮工具栏",
            blocks: [
              { type: "p", text: "悬浮在视口上的工具栏提供主要操作的快捷入口：" },
              {
                type: "list",
                items: [
                  "选择——拾取面、边等参考几何。",
                  "绘图——切换标注模式。",
                  "显示——切换显示模式与投影方式。",
                  "播放——播放 STEP 装配体的动画。",
                  "位姿——为 URDF 机器人拾取目标位姿。",
                  "环绕——进入无干扰的预览模式，按 Esc 退出。",
                  "截图——将当前视图复制为图像到剪贴板。"
                ]
              },
              { type: "p", text: "预览模式会隐藏四周面板，让你专注于模型。按 Esc 返回工作台。" }
            ]
          },
          {
            title: "复制截图",
            blocks: [
              { type: "p", text: "使用悬浮工具栏上的截图按钮可将当前视口复制为图像到剪贴板，随后可粘贴到文档或聊天中。" }
            ]
          }
        ]
      },
      {
        title: "文件格式指南",
        blocks: [],
        subs: [
          {
            title: "STEP 装配体",
            blocks: [
              { type: "p", text: "STEP 文件面板展示装配体与拓扑树：零件、参考几何与配合。选择零件即可在视口中高亮。" },
              {
                type: "list",
                items: [
                  "隐藏或隔离零件以检查内部几何。",
                  "使用全部折叠与全部展开管理深层级树。",
                  "复制零件的引用或加载其子节点。",
                  "播放零件级动画并调整速度与时间。"
                ]
              },
              { type: "image", src: "/help-screenshots/03-step-sheet.png", alt: "STEP 文件面板：装配树与参数" }
            ]
          },
          {
            title: "机器人文件（URDF / SDF / SRDF）",
            blocks: [
              { type: "p", text: "机器人文件通过滑杆提供关节控制。设置关节角度、复制数值或角度，并可重置到存储的默认姿态。" },
              { type: "p", text: "位置组保存命名位置。可求解逆运动学将末端执行器移动到目标位姿，或规划到该位姿的运动。" },
              { type: "p", text: "SDF 文件还展示仿真元数据：includes、plugins、sensors、lights 与 physics。SRDF 文件展示 MoveIt 规划组与关节。" },
              { type: "image", src: "/help-screenshots/04-robot.png", alt: "机器人文件面板：关节控制" }
            ]
          },
          {
            title: "DXF 图纸",
            blocks: [
              { type: "p", text: "DXF 面板可在 2D 与 3D 视图模式间切换。3D 模式下可调整折弯方向、折弯角度与预览厚度，用于展开图审查。" },
              { type: "image", src: "/help-screenshots/07-dxf.png", alt: "DXF 图纸文件面板" }
            ]
          },
          {
            title: "隐式 CAD 参数",
            blocks: [
              { type: "p", text: "隐式 CAD 文件通过参数滑杆、数值输入与颜色选择器控制。调整参数即可看到符号距离场模型实时重新生成。" },
              {
                type: "list",
                items: [
                  "复制或粘贴参数 JSON 以分享精确设置。",
                  "随时重置参数到默认值。",
                  "播放参数动画并设置 0.1x 至 3x 的速度。",
                  "在图形设置区更改整体比例。"
                ]
              },
              { type: "image", src: "/help-screenshots/06-implicit.png", alt: "隐式 CAD 文件面板：参数控制" }
            ]
          },
          {
            title: "G-code 刀路",
            blocks: [
              { type: "p", text: "G-code 面板通过滑杆控制预览细节等级。提高等级可获得更密集的刀路预览，大文件时可降低等级以加快交互。" },
              { type: "image", src: "/help-screenshots/05-gcode.png", alt: "G-code 刀路预览" }
            ]
          },
          {
            title: "网格模型（STL / 3MF / GLB）",
            blocks: [
              { type: "p", text: "网格文件直接在视口中渲染。使用与 STEP 模型相同的导航、显示模式与投影控制。" }
            ]
          }
        ]
      },
      {
        title: "标注与绘图",
        blocks: [
          { type: "p", text: "从悬浮工具栏切换绘图笔，即可直接在模型上标注。" }
        ],
        subs: [
          {
            title: "绘图工具",
            blocks: [
              { type: "p", text: "绘图工具栏提供手绘、直线、曲面线、箭头、双箭头、矩形、圆形、填充与擦除工具。" },
              { type: "p", text: "工具栏还提供撤销、重做与清空全部按钮，对应的快捷键见“键盘快捷键”章节。" },
              { type: "p", text: "放置标注元素前可使用十字准星精确拾取参考点。" }
            ]
          },
          {
            title: "撤销与重做",
            blocks: [
              { type: "p", text: "使用 Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl/Cmd+Y 重做绘图操作。撤销与重做作用于当前绘图会话。" }
            ]
          }
        ]
      },
      {
        title: "外观与显示设置",
        blocks: [
          { type: "p", text: "从顶部栏打开主题设置弹出面板，个性化视口与材质的外观。" }
        ],
        subs: [
          {
            title: "主题预设",
            blocks: [
              { type: "p", text: "从预设菜单选择内置预设，或将当前设置保存为自定义预设。同一菜单中可删除、重置或恢复默认。" },
              { type: "image", src: "/help-screenshots/08-theme.png", alt: "主题设置弹出面板" }
            ]
          },
          {
            title: "材质与背景",
            blocks: [
              { type: "p", text: "从外观分区调整材质外观、背景颜色、地面网格、环境与光照。" }
            ]
          },
          {
            title: "剖切、爆炸视图与边线",
            blocks: [
              { type: "p", text: "启用剖切平面以切开模型查看内部，启用爆炸视图分离装配体，启用边线显示强调边界。" }
            ]
          }
        ]
      },
      {
        title: "文件操作与分享",
        blocks: [],
        subs: [
          {
            title: "文件右键菜单",
            blocks: [
              { type: "p", text: "右键侧边栏中的文件可执行：在文件夹中显示、在资源管理器中显示、复制路径、复制相对路径、复制链接与下载。" },
              { type: "p", text: "隐式 CAD 文件可在同一右键菜单中导出为 STL、3MF 或 GLB。" }
            ]
          },
          {
            title: "本地文件管理",
            blocks: [
              { type: "p", text: "使用首页或侧边栏底部的上传按钮可添加 STEP、STL、3MF、GLB、G-code、DXF、URDF/SRDF/SDF 或隐式 CAD 文件（单文件上限 200MB）。" },
              { type: "p", text: "上传的文件保存在独立的“本地文件”文件夹中。文件夹及其文件可在各自的右键菜单中重命名或删除。内置文件为只读，不可修改。" },
              { type: "image", src: "/help-screenshots/10-local-files.png", alt: "本地文件右键菜单，包含重命名与删除" }
            ]
          },
          {
            title: "元数据与问题状态",
            blocks: [
              { type: "p", text: "文件面板列出带复制按钮的元数据分组。状态区列出带严重级别徽章的问题与警告，方便审查与反馈。" }
            ]
          }
        ]
      },
      {
        title: "AI 助手",
        blocks: [
          { type: "p", text: "顶部栏的机器人按钮可打开 AI 助手抽屉。输入精确的内置指令即可查看和编辑当前 CAD 文件。指令必须与内置指令一一对应，不支持模糊匹配；在输入框输入斜杠（/）可展开完整指令表格，其中包含当前文件和模型参数。点击某一行可直接发送该指令；带参数占位符的行点击后会填入输入框，等待补充参数。助手使用本地意图解析器，指令完全在浏览器内处理。" },
          { type: "image", src: "/help-screenshots/12-ai-chat.png", alt: "AI 助手抽屉回复打开文件指令" },
          {
            type: "table",
            headers: ["指令", "操作"],
            rows: [
              ["help / 帮助", "显示可用指令"],
              ["open <文件名> / 打开 <文件名>", "打开当前目录中的文件（需精确文件名）"],
              ["set display mode <模式> / 设置显示模式 <模式>", "显示模式：solid/实体、rendered/渲染、transparent/X射线、hidden_edges/隐藏线、hidden_lines_removed/线条、unshaded/平面、wireframe/线框"],
              ["set projection <投影> / 设置投影 <投影>", "投影：orthographic/正射、perspective/透视"],
              ["fit view / 适应视图", "将模型适配到视口"],
              ["reset view / 重置视图", "重置相机缩放"],
              ["screenshot / 截图", "将视口复制为图像到剪贴板"],
              ["hide all parts / 隐藏所有零件", "隐藏所有零件"],
              ["show all parts / 显示所有零件", "显示所有零件"],
              ["isolate selected / 隔离选中", "隐藏除所选零件外的其他零件"],
              ["file info / 文件信息", "查看当前文件的元数据"],
              ["set parameter <名称> <值> / 设置参数 <名称> <值>", "调整隐式模型的参数"],
              ["reset parameters / 重置参数", "恢复默认参数"],
              ["reset pose / 重置姿态", "恢复机器人的默认姿态"],
              ["play animation / 播放动画", "播放机器人动画"],
              ["pause animation / 暂停动画", "暂停机器人动画"],
              ["preview mode / 进入预览", "进入全屏预览"],
              ["exit preview / 退出预览", "退出预览"],
              ["dark mode / 深色模式", "切换到深色主题"],
              ["light mode / 浅色模式", "切换到浅色主题"]
            ]
          }
        ]
      },
      {
        title: "键盘快捷键",
        blocks: [
          {
            type: "table",
            headers: ["快捷键", "操作"],
            rows: [
              ["Ctrl/Cmd+Z", "撤销绘图操作"],
              ["Ctrl/Cmd+Shift+Z 或 Ctrl/Cmd+Y", "重做绘图操作"],
              ["Esc", "关闭浮层或退出预览"]
            ]
          }
        ]
      },
      {
        title: "更新与支持",
        blocks: [
          { type: "callout", kind: "tip", text: "顶部栏的版本号显示已安装版本。若有新版本可用，将出现带安装命令的更新提示。" },
          { type: "p", text: "连击顶部栏的版本号三次可打开全屏提交记录弹窗，最新提交在列表顶部高亮显示；左侧完整展示提交说明，右侧展示日期与哈希。" },
          { type: "image", src: "/help-screenshots/11-git-log.png", alt: "连击版本号打开的全屏 Git 提交记录弹窗" },
          { type: "p", text: "通过顶部栏链接加入社区 Discord 或打开 GitHub 仓库，可反馈问题、提问并跟进开发。" },
          { type: "image", src: "/help-screenshots/09-help.png", alt: "帮助文档页面" }
        ]
      }
    ]
  }
};

function blockId(sectionIndex, subIndex, blockIndex) {
  return `h-${sectionIndex}-${subIndex}-${blockIndex}`;
}

function HelpBlock({ block, id }) {
  if (block.type === "image") {
    return (
      <figure id={id} className="help-figure">
        <img
          className="help-image"
          src={block.src}
          alt={block.alt}
          loading="lazy"
        />
        {block.caption ? (
          <figcaption className="help-figcaption">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "p") {
    return (
      <p id={id} className="help-paragraph">
        {block.text}
      </p>
    );
  }

  if (block.type === "list") {
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag id={id} className="help-list">
        {block.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "table") {
    return (
      <div className="help-table-wrap" id={id}>
        <table className="help-table">
          <thead>
            <tr>
              {block.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div
        id={id}
        className={`help-callout help-callout-${block.kind || "note"}`}
      >
        {block.text}
      </div>
    );
  }

  return null;
}

function HelpSection({ section, sectionIndex }) {
  return (
    <section className="help-section">
      <h2 id={`help-heading-${sectionIndex}`} className="help-heading-2">
        {section.title}
      </h2>
      {section.blocks?.length ? (
        <div className="help-blocks">
          {section.blocks.map((block, blockIndex) => (
            <HelpBlock
              key={blockIndex}
              block={block}
              id={blockId(sectionIndex, -1, blockIndex)}
            />
          ))}
        </div>
      ) : null}
      {section.subs?.length ? (
        <div className="help-subs">
          {section.subs.map((sub, subIndex) => (
            <div key={sub.title} className="help-sub">
              <h3 id={`help-heading-${sectionIndex}-${subIndex}`} className="help-heading-3">
                {sub.title}
              </h3>
              {sub.blocks?.length ? (
                <div className="help-blocks">
                  {sub.blocks.map((block, blockIndex) => (
                    <HelpBlock
                      key={blockIndex}
                      block={block}
                      id={blockId(sectionIndex, subIndex, blockIndex)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function HelpToc({ sections }) {
  const handleClick = (event, headingId) => {
    event.preventDefault();
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="help-toc" aria-label="Table of contents">
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className="help-toc-group">
          <a
            className="toc-level-0"
            href={`#help-heading-${sectionIndex}`}
            onClick={(event) => handleClick(event, `help-heading-${sectionIndex}`)}
          >
            {section.title}
          </a>
          {section.subs?.length ? (
            <div className="help-toc-subs">
              {section.subs.map((sub, subIndex) => (
                <a
                  key={sub.title}
                  className="toc-level-1"
                  href={`#help-heading-${sectionIndex}-${subIndex}`}
                  onClick={(event) => handleClick(event, `help-heading-${sectionIndex}-${subIndex}`)}
                >
                  {sub.title}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}

export default function HelpPage({ onBack }) {
  const { lang, t } = useI18n();
  const documentForLang = useMemo(
    () => HELP_DOCUMENT[lang] || HELP_DOCUMENT.en,
    [lang]
  );

  const backToWorkspace = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.hash = "";
  };

  return (
    <TooltipProvider delayDuration={250}>
      <div className="help-page">
        <header className="help-header">
        <div className="help-header-left">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t("helpBackToWorkspace")}
            title={t("helpBackToWorkspace")}
            onClick={backToWorkspace}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-sm px-2 text-xs font-medium leading-none text-muted-foreground hover:text-sidebar-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span aria-hidden="true">{t("helpBackToWorkspace")}</span>
          </Button>
        </div>
        <div className="help-header-title">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("helpTitle")}</span>
        </div>
        <div className="help-header-right">
          <LanguageToggle />
        </div>
      </header>

      <div className="help-layout">
        <aside className="help-sidebar">
          <div className="help-toc-heading">
            <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t("helpTableOfContents")}</span>
          </div>
          <HelpToc sections={documentForLang.sections} />
        </aside>
        <main className="help-content">
          <h1 className="help-title">{t("helpTitle")}</h1>
          <p className="help-description">{documentForLang.description}</p>
          {documentForLang.sections.map((section, sectionIndex) => (
            <HelpSection
              key={section.title}
              section={section}
              sectionIndex={sectionIndex}
            />
          ))}
        </main>
      </div>
      </div>
    </TooltipProvider>
  );
}
