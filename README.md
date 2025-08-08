# SupChat - AI 助手小程序

一个基于微信小程序的 AI 助手应用，支持流式响应和 Markdown 渲染。

## 功能特性

- 🤖 AI 对话：基于 OpenRouter API 的智能对话
- 📝 流式响应：实时显示 AI 回复，提供更好的用户体验
- 📄 Markdown 支持：使用 towxml 渲染 Markdown 内容
- 💬 聊天历史：保存和管理对话记录
- 🎨 现代化 UI：美观的界面设计
- 📱 微信小程序：原生小程序体验

## 流式响应实现

### 技术方案

由于微信小程序的限制，我们采用了以下技术方案来实现流式响应：

1. **主要方案**：尝试使用 `wx.request` 发送流式请求到 OpenRouter API
2. **回退方案**：如果流式请求失败，自动回退到非流式模式并模拟流式效果
3. **用户体验**：提供流畅的打字机效果和实时滚动

### 核心组件

- `AIService.sendMessageStream()`: 流式消息发送
- `StreamCallback`: 流式响应回调接口
- 页面组件中的流式状态管理

### 视觉反馈

- 流式响应指示器：显示"正在思考..."状态
- 流式输入光标：模拟打字机效果
- 取消按钮：允许用户中断当前请求
- 实时滚动：自动滚动到最新消息

## 安装和配置

### 1. 克隆项目

```bash
git clone <repository-url>
cd supchat
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API

编辑 `miniprogram/lib/config/api.ts` 文件，配置你的 OpenRouter API 密钥：

```typescript
export const API_CONFIG = {
  OPENROUTER: {
    HOST: 'https://openrouter.ai/api/v1',
    API_KEY: 'your-api-key-here',
    MODEL: 'google/gemini-2.5-flash-lite'
  }
}
```

### 4. 在微信开发者工具中打开项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择项目目录
4. 填入你的小程序 AppID

## 使用说明

### 发送消息

1. 在输入框中输入你的问题
2. 点击"发送"按钮或按回车键
3. AI 将以流式方式回复，你可以看到实时的打字效果

### 取消请求

- 在 AI 回复过程中，点击"取消"按钮可以中断当前请求

### 清空聊天

- 点击右上角的"清空"按钮可以清除所有聊天记录

## 技术架构

```
miniprogram/
├── lib/
│   ├── config/
│   │   └── api.ts          # API 配置
│   ├── services/
│   │   ├── ai.ts           # AI 服务（流式响应核心）
│   │   └── http.ts         # HTTP 工具
│   └── utils/
│       ├── markdown.ts     # Markdown 处理
│       └── util.ts         # 工具函数
├── pages/
│   └── index/              # 主页面
│       ├── index.ts        # 页面逻辑
│       ├── index.wxml      # 页面模板
│       └── index.scss      # 页面样式
└── components/
    └── navigation-bar/     # 导航栏组件
```

## 流式响应工作原理

1. **请求发送**：使用 `wx.request` 发送 `stream: true` 的请求
2. **响应处理**：解析 SSE (Server-Sent Events) 格式的响应数据
3. **实时更新**：通过回调函数实时更新界面内容
4. **回退机制**：如果流式请求失败，自动切换到模拟流式模式

## 注意事项

- 确保你的 OpenRouter API 密钥有效且有足够的配额
- 流式响应需要网络连接稳定
- 微信小程序对某些网络请求有限制，可能需要配置域名白名单

## 开发计划

- [ ] 支持更多 AI 模型
- [ ] 添加语音输入功能
- [ ] 支持图片上传和识别
- [ ] 添加对话导出功能
- [ ] 优化流式响应性能

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
