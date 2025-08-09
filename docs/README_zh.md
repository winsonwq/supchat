# SupChat - 智能AI助手微信小程序

🤖 基于MCP（模型上下文协议）工具调用支持的智能AI助手微信小程序，提供无缝的AI交互体验和集成工具。

[English](../README.md) | [功能特性](#功能特性) | [快速开始](#快速开始) | [MCP工具](#mcp工具) | [开发指南](#开发指南)

## 功能特性

- 🤖 **智能AI对话** - 基于Claude 3.5 Sonnet，支持流式响应
- 🔧 **MCP工具调用** - 可扩展的工具系统，支持多种实用工具
- 📱 **微信原生体验** - 基于微信小程序框架开发
- 📸 **照片选择工具** - 无缝访问相机和相册
- 🌤️ **天气查询工具** - 实时天气信息查询
- 🔄 **流式响应** - 实时AI回复渲染
- 📝 **Markdown支持** - 对话中的富文本格式化
- 🎨 **现代UI** - 简洁直观的界面设计

## 快速开始

### 环境要求

- 微信开发者工具
- Node.js 16+
- TypeScript基础

### 安装步骤

1. 克隆仓库：
```bash
git clone <repository-url>
cd supchat
```

2. 安装依赖：
```bash
npm install
```

3. 配置API设置：

**方法一：本地配置文件（推荐）**
```bash
# 复制示例配置文件
cp miniprogram/lib/config/local.config.example.js miniprogram/lib/config/local.config.js

# 编辑文件并添加您的真实API密钥
# local.config.js 文件已被git忽略，确保安全
```

**方法二：环境变量**
```bash
# 复制环境变量模板
cp env.example .env.local

# 编辑 .env.local 并填入您的API密钥
```

**支持的AI服务：**
- **OpenRouter**（推荐）：[https://openrouter.ai/](https://openrouter.ai/) - 支持多种AI模型
- **OpenAI**：[https://platform.openai.com/](https://platform.openai.com/) - GPT系列模型
- **Anthropic**：[https://console.anthropic.com/](https://console.anthropic.com/) - Claude系列模型
- **自定义服务**：任何兼容OpenAI API格式的服务

**配置步骤：**
1. 选择您要使用的AI服务
2. 从服务提供商获取API密钥
3. 编辑配置文件，设置：`AI_API_KEY`、`AI_HOST`、`AI_MODEL`
4. 保存并重启微信开发者工具

4. 使用微信开发者工具：
   - 启动微信开发者工具
   - 导入项目
   - 开始开发

## MCP工具

### 什么是MCP工具调用？

MCP（模型上下文协议）工具调用允许AI助手在对话过程中自动调用各种工具来完成任务，比如：
- 打开相册或相机
- 查询天气信息
- 执行文件操作
- 调用外部API

### 当前支持的工具

#### 1. 照片选择工具 (`openPhoto`)
**功能描述**：访问相机或相册选择图片

**参数说明**：
- `sourceType`: 'album' | 'camera' （图片来源）
- `count`: 最多选择的图片张数 (1-9)
- `sizeType`: 'original' | 'compressed' （图片尺寸）

**使用示例**：
```
用户：请帮我从相册选择一张照片
AI：好的，我来帮您打开相册
[自动调用 openPhoto 工具]
```

#### 2. 天气查询工具 (`getWeather`)
**功能描述**：获取指定城市的天气信息

**参数说明**：
- `city`: 城市名称
- `date`: 查询日期（可选，默认为今天）

**使用示例**：
```
用户：北京今天天气怎么样？
AI：让我为您查询天气信息
[自动调用 getWeather 工具]
```

### 工具调用流程

1. **AI分析** - AI分析用户请求，判断是否需要调用工具
2. **工具调用** - AI自动调用相应的工具
3. **用户确认** - 某些工具（如照片选择）需要用户确认
4. **执行操作** - 工具执行具体操作
5. **返回结果** - 工具执行结果返回给AI
6. **最终回复** - AI根据工具执行结果给出最终回复

## 开发指南

### 项目结构

```
miniprogram/
├── lib/
│   ├── services/
│   │   ├── ai.ts              # AI服务核心
│   │   └── http.ts            # HTTP工具
│   ├── mcp/
│   │   ├── index.ts           # MCP模块入口
│   │   ├── utils.ts           # 工具调用工具函数
│   │   ├── types.ts           # 类型定义
│   │   └── tools/
│   │       ├── index.ts       # 工具注册
│   │       ├── photo.ts       # 照片选择工具
│   │       └── weather.ts     # 天气查询工具
│   ├── utils/
│   │   ├── markdown.ts        # Markdown工具
│   │   └── util.ts            # 通用工具
│   └── config/
│       └── api.ts             # API配置
├── components/
│   ├── message-input/         # 消息输入组件
│   ├── message-item/          # 消息显示组件
│   └── navigation-bar/        # 导航栏组件
└── pages/
    └── index/                 # 主聊天页面
```

### 创建新工具

要添加新的MCP工具，请按以下步骤：

1. **创建工具文件**：在 `miniprogram/lib/mcp/tools/` 目录下创建新文件

2. **定义工具配置**：
```typescript
import { ToolBaseConfig } from '../types.js'

// 工具参数定义
const myToolInputSchema = {
  type: 'object',
  properties: {
    param1: {
      type: 'string',
      description: '参数描述'
    }
  },
  required: ['param1']
}

// 工具处理函数
async function myToolHandler(args: any): Promise<any> {
  // 实现工具逻辑
  return {
    success: true,
    data: { /* 结果数据 */ }
  }
}

// 工具配置
export const myTool: ToolBaseConfig = {
  name: 'myTool',
  description: '工具描述',
  inputSchema: myToolInputSchema,
  chineseName: '中文名称',
  needUserConfirm: false, // 是否需要用户确认
  handler: myToolHandler
}
```

3. **注册工具**：在 `miniprogram/lib/mcp/tools/index.ts` 中注册：
```typescript
export { myTool } from './myTool.js'

export const allTools: ToolBaseConfig[] = [
  // ... 其他工具
  myTool,
]
```

### 核心组件

- **AIService**：AI服务管理，处理流式响应和工具调用
- **MCP模块**：工具调用协议实现
- **工具系统**：可扩展的工具框架

## API参考

### AIService

处理AI对话和工具调用的主要服务。

```typescript
// 发送消息并处理流式响应
await aiService.sendMessage(message, {
  onData: (chunk) => { /* 处理流式数据 */ },
  onComplete: () => { /* 处理完成 */ },
  onError: (error) => { /* 处理错误 */ }
})
```

### MCP工具函数

工具调用和管理的工具函数。

```typescript
// 执行工具
await executeToolCall(toolCall, tools)

// 验证工具参数
const isValid = validateToolArguments(args, schema)
```

## 使用说明

### 基本对话

1. 打开小程序
2. 在输入框中输入您的问题或请求
3. AI会自动分析并回复，必要时会调用相应工具

### 工具使用示例

**照片选择**：
- "请帮我选择一张照片"
- "打开相册"
- "我想拍一张照片"

**天气查询**：
- "今天天气怎么样？"
- "查询北京的天气"
- "明天会下雨吗？"

## 注意事项

1. **用户确认**：某些工具（如照片选择）需要用户确认才能执行
2. **错误处理**：工具调用失败时会显示相应错误信息
3. **流式响应**：支持实时显示AI回复和工具调用过程
4. **网络要求**：确保网络连接正常，工具调用需要网络支持
5. **权限管理**：某些工具可能需要用户授权相应权限

## 故障排除

### 常见问题

**Q: API调用失败怎么办？**
A: 检查 `miniprogram/lib/config/api.ts` 中的API密钥配置是否正确。

**Q: 工具调用没有响应？**
A: 确保网络连接正常，检查控制台是否有错误信息。

**Q: 照片选择失败？**
A: 检查是否授权了相机和相册权限。

## 贡献指南

1. Fork 这个仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

*感谢您使用 SupChat！希望这个项目能为您带来优秀的AI交互体验。*
