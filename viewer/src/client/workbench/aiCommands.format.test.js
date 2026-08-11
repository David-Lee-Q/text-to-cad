import assert from "node:assert/strict";
import test from "node:test";

import { buildCommandRows } from "./aiCommands.js";

const catalog = [{ key: "a.step", label: "a.step" }, { key: "b.implicit.js", label: "b.implicit.js" }];
const parameters = [{ id: "radius", label: "radius" }];

test("无文件时只推荐通用命令，不含格式专属命令", () => {
  const rows = buildCommandRows({ catalog, parameters, lang: "zh", sourceFormat: "" });
  const texts = rows.map((r) => r.zh);
  assert.ok(texts.includes("帮助"));
  assert.ok(texts.includes("打开 <文件名>"));
  assert.ok(!texts.some((t) => t.includes("显示模式")));
  assert.ok(!texts.some((t) => t.includes("投影")));
  assert.ok(!texts.some((t) => t.includes("隐藏所有零件")));
  assert.ok(!texts.some((t) => t.includes("设置参数")));
  assert.ok(!texts.some((t) => t.includes("重置姿态")));
});

test("STEP 文件推荐显示模式/投影/零件显隐，不推荐参数与姿态", () => {
  const rows = buildCommandRows({ catalog, parameters, lang: "zh", sourceFormat: "step" });
  const texts = rows.map((r) => r.zh);
  assert.ok(texts.some((t) => t.includes("设置显示模式")));
  assert.ok(texts.some((t) => t.includes("设置投影")));
  assert.ok(texts.some((t) => t.includes("隐藏所有零件")));
  assert.ok(texts.some((t) => t.includes("隔离选中")));
  assert.ok(!texts.some((t) => t.includes("设置参数")));
  assert.ok(!texts.some((t) => t.includes("重置参数")));
  assert.ok(!texts.some((t) => t.includes("重置姿态")));
});

test("Implicit 文件推荐参数命令，不推荐显示模式/投影/姿态", () => {
  const rows = buildCommandRows({ catalog, parameters, lang: "zh", sourceFormat: "implicit" });
  const texts = rows.map((r) => r.zh);
  assert.ok(texts.some((t) => t.startsWith("设置参数")));
  assert.ok(texts.some((t) => t === "重置参数"));
  assert.ok(!texts.some((t) => t.includes("显示模式")));
  assert.ok(!texts.some((t) => t.includes("投影")));
  assert.ok(!texts.some((t) => t.includes("隐藏所有零件")));
  assert.ok(!texts.some((t) => t.includes("重置姿态")));
});

test("机器人文件推荐重置姿态，不推荐显示模式与参数", () => {
  for (const format of ["urdf", "srdf", "sdf"]) {
    const rows = buildCommandRows({ catalog, parameters, lang: "zh", sourceFormat: format });
    const texts = rows.map((r) => r.zh);
    assert.ok(texts.includes("重置姿态"), `${format} 应有重置姿态`);
    assert.ok(!texts.some((t) => t.includes("显示模式")), `${format} 不应有显示模式`);
    assert.ok(!texts.some((t) => t.includes("设置参数")), `${format} 不应有设置参数`);
  }
});
