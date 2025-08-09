# SupChat - Intelligent AI Assistant WeChat Mini-Program

🤖 An intelligent AI assistant WeChat mini-program with MCP (Model Context Protocol) tool calling support, providing seamless AI interaction experience with integrated tools.

[中文文档](docs/README_zh.md) | [AI Services](docs/AI_SERVICES.md) | [Features](#features) | [Getting Started](#getting-started) | [Tools](#mcp-tools) | [Development](#development)

## Features

- 🤖 **Intelligent AI Conversations** - Powered by Claude 3.5 Sonnet with streaming responses
- 🔧 **MCP Tool Calling** - Extensible tool system supporting various utilities
- 📱 **Native WeChat Experience** - Built with WeChat Mini-Program framework
- 📸 **Photo Selection Tool** - Seamlessly access camera and photo albums
- 🌤️ **Weather Query Tool** - Real-time weather information
- 🔄 **Streaming Responses** - Real-time AI response rendering
- 📝 **Markdown Support** - Rich text formatting in conversations
- 🎨 **Modern UI** - Clean and intuitive interface design

## Getting Started

### Prerequisites

- WeChat Developer Tools
- Node.js 18+
- TypeScript knowledge

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd supchat
```

2. Install dependencies:
```bash
npm install
```

3. Configure API settings:

**Method 1: Quick Setup Script (Easiest)**
```bash
# Run the configuration wizard
npm run setup
# or
node setup-config.js

# Follow the instructions to get your API key and configure
```

**Method 2: Manual Setup**
```bash
# Copy the example config file
cp miniprogram/lib/config/local.config.example.js miniprogram/lib/config/local.config.js

# Edit the file and add your real API key
# The local.config.js file is git-ignored for security
```

**Method 3: Environment Variables**
```bash
# Copy the environment template
cp env.example .env.local

# Edit .env.local and fill in your API keys
```

**Supported AI Services:**
- **OpenRouter** (Recommended): [https://openrouter.ai/](https://openrouter.ai/) - Access multiple AI models
- **OpenAI**: [https://platform.openai.com/](https://platform.openai.com/) - GPT models  
- **Anthropic**: [https://console.anthropic.com/](https://console.anthropic.com/) - Claude models
- **Custom Services**: Any service compatible with OpenAI API format

**Configuration Steps:**
1. Choose your preferred AI service
2. Get API key from the service provider
3. Edit the config file and set: `AI_API_KEY`, `AI_HOST`, `AI_MODEL`
4. Save and restart WeChat Developer Tools

4. Open with WeChat Developer Tools:
   - Launch WeChat Developer Tools
   - Import project
   - Start developing

## MCP Tools

### What is MCP Tool Calling?

MCP (Model Context Protocol) tool calling allows the AI assistant to automatically invoke various tools during conversations to complete tasks, such as:
- Opening photo albums or camera
- Querying weather information
- Performing file operations
- Calling external APIs

### Available Tools

#### 1. Photo Selection Tool (`openPhoto`)
**Description**: Access camera or photo album to select images

**Parameters**:
- `sourceType`: 'album' | 'camera' (image source)
- `count`: Maximum number of images to select (1-9)
- `sizeType`: 'original' | 'compressed' (image size)

**Usage Example**:
```
User: "Please help me select a photo from my album"
AI: "I'll help you open the photo album"
[Automatically calls openPhoto tool]
```

#### 2. Weather Query Tool (`getWeather`)
**Description**: Get weather information for specified cities

**Parameters**:
- `city`: City name
- `date`: Query date (optional, defaults to today)

**Usage Example**:
```
User: "What's the weather like in Beijing today?"
AI: "Let me check the weather for you"
[Automatically calls getWeather tool]
```

### Tool Calling Flow

1. **AI Analysis**: AI analyzes user request to determine if tools are needed
2. **Tool Invocation**: AI automatically calls appropriate tools
3. **User Confirmation**: Some tools (like photo selection) require user confirmation
4. **Operation Execution**: Tool performs the specific operation
5. **Result Return**: Tool execution results are returned to AI
6. **Final Response**: AI provides final response based on tool results

## Development

### Project Structure

```
miniprogram/
├── lib/
│   ├── services/
│   │   ├── ai.ts              # AI service core
│   │   └── http.ts            # HTTP utilities
│   ├── mcp/
│   │   ├── index.ts           # MCP module entry
│   │   ├── utils.ts           # Tool calling utilities
│   │   ├── types.ts           # Type definitions
│   │   └── tools/
│   │       ├── index.ts       # Tool registration
│   │       ├── photo.ts       # Photo selection tool
│   │       └── weather.ts     # Weather query tool
│   ├── utils/
│   │   ├── markdown.ts        # Markdown utilities
│   │   └── util.ts            # Common utilities
│   └── config/
│       └── api.ts             # API configuration
├── components/
│   ├── message-input/         # Message input component
│   ├── message-item/          # Message display component
│   └── navigation-bar/        # Navigation bar component
└── pages/
    └── index/                 # Main chat page
```

### Creating New Tools

To add a new MCP tool, follow these steps:

1. **Create Tool File**: Create a new tool file in `miniprogram/lib/mcp/tools/`

2. **Define Tool Configuration**:
```typescript
import { ToolBaseConfig } from '../types.js'

// Tool parameter schema
const myToolInputSchema = {
  type: 'object',
  properties: {
    param1: {
      type: 'string',
      description: 'Parameter description'
    }
  },
  required: ['param1']
}

// Tool handler function
async function myToolHandler(args: any): Promise<any> {
  // Implement tool logic
  return {
    success: true,
    data: { /* result data */ }
  }
}

// Tool configuration
export const myTool: ToolBaseConfig = {
  name: 'myTool',
  description: 'Tool description',
  inputSchema: myToolInputSchema,
  chineseName: '中文名称',
  needUserConfirm: false, // Whether user confirmation is needed
  handler: myToolHandler
}
```

3. **Register Tool**: Register in `miniprogram/lib/mcp/tools/index.ts`:
```typescript
export { myTool } from './myTool.js'

export const allTools: ToolBaseConfig[] = [
  // ... other tools
  myTool,
]
```

### Core Components

- **AIService**: AI service management, handles streaming responses and tool calling
- **MCP Module**: Tool calling protocol implementation
- **Tool System**: Extensible tool framework

## API Reference

### AIService

Main service for handling AI conversations and tool calling.

```typescript
// Send message with streaming response
await aiService.sendMessage(message, {
  onData: (chunk) => { /* handle streaming data */ },
  onComplete: () => { /* handle completion */ },
  onError: (error) => { /* handle errors */ }
})
```

### MCP Utils

Utilities for tool calling and management.

```typescript
// Execute tool
await executeToolCall(toolCall, tools)

// Validate tool arguments
const isValid = validateToolArguments(args, schema)
```

## Notes

1. **User Confirmation**: Some tools (like photo selection) require user confirmation before execution
2. **Error Handling**: Tool call failures display appropriate error messages
3. **Streaming Responses**: Supports real-time display of AI responses and tool calling process
4. **Network Requirements**: Ensure stable network connection for tool calling functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

