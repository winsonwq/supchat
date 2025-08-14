# SupChat - 智能AI助手微信小程序

> 🚧 **项目状态：开发中** 🚧
> 
> 本项目目前正在积极开发中，功能可能不完整或存在变化。欢迎参与贡献和反馈！

🤖 基于MCP（模型上下文协议）工具调用支持的智能AI助手微信小程序，提供无缝的AI交互体验和集成工具。

## 项目优势与愿景

SupChat 是首个在微信小程序中完整实现 MCP（模型上下文协议）的智能AI助手项目。我们深度集成微信生态，提供原生小程序体验，支持多种实用工具的智能调用。项目采用 TypeScript 全栈开发，具备流式响应、Markdown渲染、多会话管理等先进特性，通过本地数据存储和用户确认机制保障隐私安全。我们的愿景是构建微信生态中最智能的AI助手平台，建立开放的AI工具生态系统，让每个人都能在微信中享受智能化的数字生活体验。

[English Documentation](README_EN.md) | [功能特性](#功能特性) | [快速开始](#快速开始) | [MCP工具](#mcp工具)

## 功能特性

- 🤖 **智能AI对话** - 基于Claude 3.5 Sonnet，支持流式响应
- 🔧 **MCP工具调用** - 可扩展的工具系统，支持6种实用工具
- 📱 **微信原生体验** - 基于微信小程序框架开发
- 📸 **照片选择工具** - 无缝访问相机和相册
- 📍 **位置获取工具** - 获取用户当前位置信息
- 📱 **设备信息工具** - 获取设备系统信息
- 🌐 **网络状态工具** - 检测网络连接状态
- 📁 **文件选择工具** - 选择聊天会话中的文件
- 📱 **扫码工具** - 支持二维码、条形码等多种格式
- 🔄 **流式响应** - 实时AI回复渲染
- 📝 **Markdown支持** - 对话中的富文本格式化
- 💬 **多会话管理** - 支持多个聊天会话
- 🎨 **现代UI** - 简洁直观的界面设计
- ⚙️ **灵活配置** - 支持多种AI服务配置

## 快速开始

### 环境要求

- 微信开发者工具
- Node.js 18+
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

**方法一：快速配置脚本（推荐）**
```bash
# 运行配置向导
npm run setup
# 或
node setup-config.js

# 按照提示获取API密钥并配置
```

**方法二：手动配置**
```bash
# 复制示例配置文件
cp miniprogram/lib/config/local.config.example.js miniprogram/lib/config/local.config.js

# 编辑文件并添加您的真实API密钥
# local.config.js 文件已被git忽略，确保安全
```

**方法三：环境变量**
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
- 获取位置信息
- 检测设备状态
- 选择文件
- 扫描二维码
- 检查网络状态

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

#### 2. 位置获取工具 (`getLocation`)
**功能描述**：获取用户当前位置信息

**参数说明**：
- `type`: 'wgs84' | 'gcj02' （坐标类型）
- `isHighAccuracy`: 是否开启高精度定位
- `highAccuracyExpireTime`: 超时时间（毫秒）

**使用示例**：
```
用户：我在哪里？
AI：让我为您获取当前位置
[自动调用 getLocation 工具]
```

#### 3. 设备信息工具 (`getDeviceInfo`)
**功能描述**：获取设备系统信息

**参数说明**：
- `includeSystemInfo`: 是否包含系统信息
- `includeDeviceInfo`: 是否包含设备信息
- `includeAppInfo`: 是否包含应用信息

**使用示例**：
```
用户：我的设备信息是什么？
AI：让我为您获取设备信息
[自动调用 getDeviceInfo 工具]
```

#### 4. 网络状态工具 (`getNetworkStatus`)
**功能描述**：检测网络连接状态

**参数说明**：
- `includeDetailedInfo`: 是否包含详细网络信息

**使用示例**：
```
用户：我的网络状态怎么样？
AI：让我为您检查网络状态
[自动调用 getNetworkStatus 工具]
```

#### 5. 文件选择工具 (`chooseFile`)
**功能描述**：选择聊天会话中的文件

**参数说明**：
- `count`: 最多选择的文件个数 (1-100)
- `type`: 'all' | 'video' | 'image' | 'file' （文件类型）
- `extension`: 文件扩展名过滤数组

**使用示例**：
```
用户：请帮我选择一个文件
AI：好的，我来帮您选择文件
[自动调用 chooseFile 工具]
```

#### 6. 扫码工具 (`scanCode`)
**功能描述**：扫描二维码、条形码等

**参数说明**：
- `scanType`: 扫码类型数组 ['qrCode', 'barCode', 'datamatrix', 'pdf417']
- `autoZoom`: 是否自动放大
- `onlyFromCamera`: 是否只能从相机扫码

**使用示例**：
```
用户：请帮我扫描这个二维码
AI：好的，我来帮您扫描
[自动调用 scanCode 工具]
```

### 工具调用流程

1. **AI分析** - AI分析用户请求，判断是否需要调用工具
2. **工具调用** - AI自动调用相应的工具
3. **用户确认** - 某些工具（如照片选择、位置获取）需要用户确认
4. **执行操作** - 工具执行具体操作
5. **返回结果** - 工具执行结果返回给AI
6. **最终回复** - AI根据工具执行结果给出最终回复

## 页面功能

### 主要页面

- **首页 (index)** - 主聊天界面，支持多会话管理
- **设置 (settings)** - 应用设置入口
- **AI设置 (ai-settings)** - AI服务配置
- **AI配置 (ai-config)** - 详细的AI参数配置
- **MCP设置 (mcp-settings)** - MCP服务器管理
- **MCP列表 (mcp-list)** - 查看所有MCP服务器
- **MCP详情 (mcp-detail)** - 查看MCP服务器详情
- **MCP编辑 (mcp-edit)** - 编辑MCP服务器配置
- **MCP添加 (mcp-add)** - 添加新的MCP服务器

### 核心功能

- **多会话管理** - 支持创建、切换、删除聊天会话
- **消息历史** - 自动保存和加载聊天历史
- **流式响应** - 实时显示AI回复过程
- **工具调用** - 自动调用相关工具完成任务
- **Markdown渲染** - 支持富文本格式显示
- **用户信息管理** - 保存用户偏好设置

## 注意事项

1. **用户确认**：某些工具（如照片选择、位置获取）需要用户确认才能执行
2. **错误处理**：工具调用失败时会显示相应错误信息
3. **流式响应**：支持实时显示AI回复和工具调用过程
4. **网络要求**：确保网络连接正常，工具调用需要网络支持
5. **权限管理**：某些工具可能需要用户授权相应权限
6. **数据存储**：聊天历史会自动保存到本地存储

## 故障排除

### 常见问题

**Q: API调用失败怎么办？**
A: 检查 `miniprogram/lib/config/api.ts` 中的API密钥配置是否正确。

**Q: 工具调用没有响应？**
A: 确保网络连接正常，检查控制台是否有错误信息。

**Q: 照片选择失败？**
A: 检查是否授权了相机和相册权限。

**Q: 位置获取失败？**
A: 检查是否授权了位置权限，确保GPS已开启。

**Q: 扫码功能不工作？**
A: 检查是否授权了相机权限。

## 贡献指南

1. Fork 这个仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

*感谢您使用 SupChat！希望这个项目能为您带来优秀的AI交互体验。*

---

