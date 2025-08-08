# SupChat - 智能AI助手小程序

一个基于微信小程序的智能AI助手，支持MCP（Model Context Protocol）工具调用功能。

## 功能特性

- 🤖 智能AI对话
- 🔧 MCP工具调用支持
- 📱 微信小程序原生体验
- 📸 照片选择工具
- 🌤️ 天气查询工具
- 🔄 流式响应
- 📝 Markdown渲染

## MCP工具调用功能

### 什么是MCP工具调用？

MCP（Model Context Protocol）工具调用允许AI助手在对话过程中自动调用各种工具来完成任务，比如：
- 打开相册选择照片
- 查询天气信息
- 执行文件操作
- 调用外部API

### 当前支持的工具

1. **照片选择工具** (`openPhoto`)
   - 功能：打开相册或相机选择照片
   - 参数：
     - `sourceType`: 'album' | 'camera' (图片来源)
     - `count`: 最多选择的图片张数 (1-9)
     - `sizeType`: 'original' | 'compressed' (图片尺寸)

2. **天气查询工具** (`getWeather`)
   - 功能：获取指定城市的天气信息
   - 参数：
     - `city`: 城市名称
     - `date`: 查询日期 (可选，默认为今天)

### 如何使用

1. **直接对话**：在聊天中输入自然语言，AI会自动判断是否需要调用工具
   ```
   用户：请帮我打开相册选择一张照片
   AI：好的，我来帮您打开相册选择照片
   [自动调用 openPhoto 工具]
   ```

2. **测试工具调用**：在欢迎页面点击"测试工具调用"按钮

### 工具调用流程

1. **AI分析**：AI分析用户请求，判断是否需要调用工具
2. **工具调用**：如果需要，AI会自动调用相应的工具
3. **用户确认**：某些工具（如照片选择）需要用户确认
4. **执行操作**：工具执行具体操作
5. **返回结果**：工具执行结果返回给AI
6. **最终回复**：AI根据工具执行结果给出最终回复

### 开发新工具

要添加新的MCP工具，请按以下步骤：

1. 在 `miniprogram/lib/mcp/tools/` 目录下创建新的工具文件
2. 定义工具配置：

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

3. 在 `miniprogram/lib/mcp/tools/index.ts` 中注册工具：

```typescript
export { myTool } from './myTool.js'

export const allTools: ToolBaseConfig[] = [
  // ... 其他工具
  myTool,
]
```

## 技术架构

### 核心组件

- **AIService**: AI服务管理，处理流式响应和工具调用
- **MCP模块**: 工具调用协议实现
- **工具系统**: 可扩展的工具框架

### 文件结构

```
miniprogram/
├── lib/
│   ├── services/
│   │   └── ai.ts              # AI服务核心
│   └── mcp/
│       ├── index.ts           # MCP模块入口
│       ├── utils.ts           # 工具调用工具函数
│       ├── types.ts           # 类型定义
│       └── tools/
│           ├── index.ts       # 工具注册
│           ├── photo.ts       # 照片选择工具
│           └── weather.ts     # 天气查询工具
└── pages/
    └── index/                 # 主页面
```

## 开发环境

### 环境要求

- 微信开发者工具
- Node.js 16+
- TypeScript

### 安装依赖

```bash
npm install
```

### 开发调试

1. 打开微信开发者工具
2. 导入项目
3. 配置API密钥（在 `miniprogram/lib/config/api.ts` 中）
4. 开始开发

## API配置

在 `miniprogram/lib/config/api.ts` 中配置您的API密钥：

```typescript
export const API_CONFIG = {
  OPENROUTER: {
    HOST: 'https://openrouter.ai/api/v1',
    API_KEY: 'your-api-key-here',
    MODEL: 'anthropic/claude-3.5-sonnet'
  }
}
```

## 注意事项

1. **用户确认**：某些工具（如照片选择）需要用户确认才能执行
2. **错误处理**：工具调用失败时会显示错误信息
3. **流式响应**：支持实时显示AI回复和工具调用过程
4. **网络请求**：确保网络连接正常，工具调用需要网络支持

## 许可证

MIT License
