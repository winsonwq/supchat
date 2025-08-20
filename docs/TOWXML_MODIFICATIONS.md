# Towxml 本地修改记录

## 背景

在使用 towxml 将 HTML/Markdown 转为小程序节点时，解析结果会插入自定义组件 `decode` 作为中间层。例如：

- 原始：`<div class="flex">hello</div>`
- 解析后：`<view class="flex"><decode is="towxml/decode">hello</decode></view>`

该中间层会影响如 `.flex`、`.flex > *` 等基于父子关系的样式选择器，导致布局异常（常见于 flex 布局、子元素对齐、间距控制）。

## 变更

将 `towxml/decode` 设置为虚拟宿主，消除额外包裹节点对布局的影响。

- 修改位置：`miniprogram/towxml/decode.js`

```4:12:miniprogram/towxml/decode.js
Component({
    options: {
        styleIsolation: 'apply-shared',
        virtualHost: true
    },
    properties: {
        nodes: {
            type: Object,
            value: {}
        }
    },
})
```

## 影响范围

- `decode` 不再渲染额外包裹节点，子节点直接提升到父层，恢复原有 DOM 层级预期；`.flex` 等样式选择器重新生效。
- 仍保留 `styleIsolation: 'apply-shared'`，与 `towxml` 根组件（`styleIsolation: 'shared'`）的样式透传策略兼容。

## 兼容性

`virtualHost` 需要较新的小程序基础库版本支持。如在极老设备上发现无效，请评估基础库版本后再行处理。

## 验证步骤

1. 打开任意包含 `.flex` 或对子元素有严格选择器的渲染用例，确认解析后不再出现多余的 `<decode>` 包裹。
2. 检查 `.flex` 对齐、子项间距等是否恢复正常。

## 升级注意

该修改属于对第三方库 towxml 的本地改动（vendor patch）。后续若升级 towxml，需要重新比对并合并此修改。


