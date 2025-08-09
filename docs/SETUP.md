# 项目配置指南 | Project Setup Guide

本文档详细说明如何安全地配置 SupChat 项目的API密钥和环境设置。

This document provides detailed instructions on how to securely configure API keys and environment settings for the SupChat project.

## 🔐 安全配置原则 | Security Principles

### 开发环境 vs 开源分享 | Development vs Open Source

1. **开发环境** - 使用真实的API密钥进行开发和测试
2. **开源版本** - 永远不要将真实API密钥提交到Git仓库

1. **Development Environment** - Use real API keys for development and testing
2. **Open Source Version** - Never commit real API keys to Git repository

## 📋 配置方法 | Configuration Methods

### 方法一：本地配置文件 | Method 1: Local Config File

**推荐用于开发环境 | Recommended for Development**

```bash
# 1. 复制示例文件 | Copy example file
cp miniprogram/lib/config/local.config.example.js miniprogram/lib/config/local.config.js

# 2. 编辑配置文件 | Edit config file
# 将 'your-openrouter-api-key-here' 替换为真实密钥
# Replace 'your-openrouter-api-key-here' with your actual API key
```

**优势 | Advantages:**
- ✅ 文件被Git忽略，确保安全 | File is git-ignored for security
- ✅ 配置简单，易于管理 | Simple configuration, easy to manage
- ✅ 支持详细的配置注释 | Supports detailed configuration comments

### 方法二：环境变量 | Method 2: Environment Variables

**推荐用于CI/CD和生产环境 | Recommended for CI/CD and Production**

```bash
# 1. 复制环境变量模板 | Copy environment template
cp env.example .env.local

# 2. 编辑环境变量文件 | Edit environment file
# 填入真实的API密钥 | Fill in real API keys
```

**优势 | Advantages:**
- ✅ 标准的12-factor app配置方式 | Standard 12-factor app configuration
- ✅ 适合容器化部署 | Suitable for containerized deployment
- ✅ 环境隔离更好 | Better environment isolation

## 🔑 获取API密钥 | Getting API Keys

### OpenRouter API Key

1. **访问官网 | Visit Website**: [https://openrouter.ai/](https://openrouter.ai/)
2. **注册账户 | Sign Up**: 创建新账户或登录现有账户
3. **创建API密钥 | Create API Key**: 
   - 进入 "API Keys" 页面
   - 点击 "Create Key"
   - 为密钥命名（如：supchat-dev）
   - 复制生成的密钥
4. **配置密钥 | Configure Key**: 将密钥添加到配置文件中

### 支持的模型 | Supported Models

- `anthropic/claude-3.5-sonnet` (推荐 | Recommended)
- `anthropic/claude-3-haiku` (快速 | Fast)
- `google/gemini-2.5-flash-lite` (经济 | Economical)

## 📁 文件结构 | File Structure

```
supchat/
├── env.example                           # 环境变量模板 | Environment template
├── miniprogram/lib/config/
│   ├── api.ts                            # API配置主文件 | Main API config
│   ├── env.ts                            # 环境变量读取器 | Environment reader
│   ├── local.config.example.js          # 本地配置模板 | Local config template
│   └── local.config.js                  # 本地配置(Git忽略) | Local config (Git ignored)
└── .gitignore                            # Git忽略规则 | Git ignore rules
```

## 🛡️ 安全最佳实践 | Security Best Practices

### ✅ 应该做的 | DO

1. **使用配置模板** | Use configuration templates
   ```bash
   cp local.config.example.js local.config.js
   ```

2. **验证.gitignore** | Verify .gitignore
   ```bash
   git status # 确保local.config.js未被追踪
   ```

3. **定期轮换密钥** | Rotate keys regularly
   - 建议每3-6个月更换API密钥
   - Recommend changing API keys every 3-6 months

4. **使用环境隔离** | Use environment isolation
   - 开发环境使用测试密钥 | Use test keys in development
   - 生产环境使用生产密钥 | Use production keys in production

### ❌ 不应该做的 | DON'T

1. **直接修改api.ts** | Don't modify api.ts directly
   ```typescript
   // ❌ 错误：硬编码API密钥 | Wrong: Hard-coded API keys
   API_KEY: 'sk-or-v1-real-key-here'
   ```

2. **提交敏感文件** | Don't commit sensitive files
   ```bash
   # ❌ 这些文件不应该被提交 | These files should not be committed
   git add local.config.js     # NO!
   git add .env.local          # NO!
   ```

3. **在代码中暴露密钥** | Don't expose keys in code
   ```javascript
   // ❌ 错误：在控制台打印密钥 | Wrong: Logging keys to console
   console.log('API Key:', config.API_KEY)
   ```

## 🔧 故障排除 | Troubleshooting

### 问题：配置验证失败 | Issue: Configuration Validation Failed

```
Error: API配置验证失败，请检查配置文件
```

**解决方案 | Solution:**
1. 确认配置文件存在 | Ensure config file exists
2. 检查API密钥格式 | Check API key format
3. 验证密钥有效性 | Verify key validity

### 问题：找不到配置文件 | Issue: Config File Not Found

```
Warning: 未找到本地配置文件，使用默认配置
```

**解决方案 | Solution:**
1. 复制示例配置文件 | Copy example config file
2. 填入真实的API密钥 | Fill in real API keys
3. 重启开发服务器 | Restart development server

### 问题：API调用失败 | Issue: API Call Failed

```
Error: 401 Unauthorized
```

**解决方案 | Solution:**
1. 检查API密钥是否正确 | Check if API key is correct
2. 确认账户余额充足 | Ensure account has sufficient balance
3. 验证模型名称正确 | Verify model name is correct

## 🌍 环境配置示例 | Environment Configuration Examples

### 开发环境 | Development Environment

```javascript
// local.config.js
module.exports = {
  OPENROUTER_API_KEY: 'sk-or-v1-dev-key-here',
  OPENROUTER_MODEL: 'anthropic/claude-3-haiku', // 快速模型用于开发
  NODE_ENV: 'development'
}
```

### 生产环境 | Production Environment

```javascript
// local.config.js
module.exports = {
  OPENROUTER_API_KEY: 'sk-or-v1-prod-key-here',
  OPENROUTER_MODEL: 'anthropic/claude-3.5-sonnet', // 高质量模型用于生产
  NODE_ENV: 'production'
}
```

## 📞 获取帮助 | Getting Help

如果您在配置过程中遇到问题，可以：

If you encounter issues during configuration, you can:

1. **查看示例文件** | Check example files
2. **阅读错误信息** | Read error messages carefully
3. **检查网络连接** | Check network connectivity
4. **提交Issue** | Submit an issue on GitHub

---

*配置完成后，您就可以开始使用SupChat进行AI对话和工具调用了！*

*After configuration, you can start using SupChat for AI conversations and tool calling!*
