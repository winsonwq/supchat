# AI聊天小程序

这是一个基于微信小程序的AI聊天应用，集成了OpenRouter API，支持与AI助手进行对话。

## 功能特性

- 🤖 基于OpenRouter API的AI对话
- 💬 支持上下文记忆的聊天历史
- 🎨 美观的聊天界面设计
- 📱 适配微信小程序
- 🔄 实时加载状态显示
- 🗑️ 一键清空聊天记录

## 技术栈

- 微信小程序原生开发
- TypeScript
- Sass样式
- OpenRouter API

## 项目结构

```
supchat/
├── miniprogram/
│   ├── lib/
│   │   ├── config/
│   │   │   └── api.ts          # API配置文件
│   │   └── services/
│   │       └── ai.ts           # AI服务类
│   ├── pages/
│   │   └── index/
│   │       ├── index.wxml      # 页面结构
│   │       ├── index.scss      # 页面样式
│   │       └── index.ts        # 页面逻辑
│   └── components/
│       └── navigation-bar/     # 导航栏组件
└── README.md
```

## 使用方法

1. 在微信开发者工具中打开项目
2. 确保已配置正确的AppID
3. 编译并预览项目
4. 在聊天界面输入消息并发送

## API配置

项目使用OpenRouter API，配置信息位于 `miniprogram/lib/config/api.ts`：

```typescript
export const API_CONFIG = {
  OPENROUTER: {
    HOST: 'https://openrouter.ai/api/v1',
    API_KEY: 'your-api-key-here',
    MODEL: 'google/gemini-2.5-flash-lite'
  }
}
```

## 主要功能

### 1. AI对话
- 支持与AI助手进行自然语言对话
- 使用Google Gemini 2.5 Flash Lite模型
- 支持上下文记忆，保持对话连贯性

### 2. 聊天界面
- 用户消息显示在右侧（蓝色气泡）
- AI回复显示在左侧（白色气泡）
- 支持消息滚动和自动定位

### 3. 输入功能
- 底部固定的输入框
- 支持回车发送消息
- 发送按钮状态随输入内容变化

### 4. 管理功能
- 导航栏右侧的清空按钮
- 一键清空所有聊天记录
- 确认对话框防止误操作

## 注意事项

1. 确保网络连接正常
2. API密钥需要有效且具有足够额度
3. 建议在真机上测试网络请求功能
4. 注意API调用频率限制

## 开发说明

- 使用TypeScript进行类型安全开发
- 采用单例模式管理AI服务
- 支持错误处理和用户友好的提示
- 响应式设计适配不同屏幕尺寸
