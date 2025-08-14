# SupChat - Intelligent AI Assistant WeChat Mini-Program

> 🚧 **Project Status: In Progress** 🚧
> 
> This project is currently under active development. Features may be incomplete or subject to change. Contributions and feedback are welcome!

🤖 An intelligent AI assistant WeChat mini-program with MCP (Model Context Protocol) tool calling support, providing seamless AI interaction experience with integrated tools.

## Project Advantages & Vision

SupChat is the first intelligent AI assistant project to fully implement MCP (Model Context Protocol) in WeChat Mini-Program. We deeply integrate with the WeChat ecosystem, providing native mini-program experience and supporting intelligent calling of various utility tools. The project is built with TypeScript full-stack development, featuring advanced capabilities such as streaming responses, Markdown rendering, and multi-session management, while ensuring privacy and security through local data storage and user confirmation mechanisms. Our vision is to build the most intelligent AI assistant platform in the WeChat ecosystem, establish an open AI tool ecosystem, and enable everyone to enjoy an intelligent digital life experience within WeChat.

[中文文档](README.md) | [Features](#features) | [Quick Start](#quick-start) | [MCP Tools](#mcp-tools)

## Features

- 🤖 **Intelligent AI Conversations** - Powered by Claude 3.5 Sonnet with streaming responses
- 🔧 **MCP Tool Calling** - Extensible tool system supporting 7 utility tools
- 📱 **Native WeChat Experience** - Built with WeChat Mini-Program framework
- 📸 **Photo Selection Tool** - Seamlessly access camera and photo albums
- 🌤️ **Weather Query Tool** - Real-time weather information
- 📍 **Location Tool** - Get user's current location
- 📱 **Device Info Tool** - Get device system information
- 🌐 **Network Status Tool** - Check network connection status
- 📁 **File Selection Tool** - Select files from chat sessions
- 📱 **Scan Code Tool** - Support QR codes, barcodes and more
- 🔄 **Streaming Responses** - Real-time AI response rendering
- 📝 **Markdown Support** - Rich text formatting in conversations
- 💬 **Multi-session Management** - Support multiple chat sessions
- 🎨 **Modern UI** - Clean and intuitive interface design
- ⚙️ **Flexible Configuration** - Support multiple AI service configurations

## Quick Start

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
- Getting location information
- Checking device status
- Selecting files
- Scanning QR codes
- Checking network status

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

#### 3. Location Tool (`getLocation`)
**Description**: Get user's current location information

**Parameters**:
- `type`: 'wgs84' | 'gcj02' (coordinate type)
- `isHighAccuracy`: Whether to enable high-precision positioning
- `highAccuracyExpireTime`: Timeout (milliseconds)

**Usage Example**:
```
User: "Where am I?"
AI: "Let me get your current location"
[Automatically calls getLocation tool]
```

#### 4. Device Info Tool (`getDeviceInfo`)
**Description**: Get device system information

**Parameters**:
- `includeSystemInfo`: Whether to include system information
- `includeDeviceInfo`: Whether to include device information
- `includeAppInfo`: Whether to include app information

**Usage Example**:
```
User: "What's my device information?"
AI: "Let me get your device information"
[Automatically calls getDeviceInfo tool]
```

#### 5. Network Status Tool (`getNetworkStatus`)
**Description**: Check network connection status

**Parameters**:
- `includeDetailedInfo`: Whether to include detailed network information

**Usage Example**:
```
User: "How's my network status?"
AI: "Let me check your network status"
[Automatically calls getNetworkStatus tool]
```

#### 6. File Selection Tool (`chooseFile`)
**Description**: Select files from chat sessions

**Parameters**:
- `count`: Maximum number of files to select (1-100)
- `type`: 'all' | 'video' | 'image' | 'file' (file type)
- `extension`: File extension filter array

**Usage Example**:
```
User: "Please help me select a file"
AI: "I'll help you select a file"
[Automatically calls chooseFile tool]
```

#### 7. Scan Code Tool (`scanCode`)
**Description**: Scan QR codes, barcodes, etc.

**Parameters**:
- `scanType`: Scan type array ['qrCode', 'barCode', 'datamatrix', 'pdf417']
- `autoZoom`: Whether to auto-zoom
- `onlyFromCamera`: Whether to only scan from camera

**Usage Example**:
```
User: "Please help me scan this QR code"
AI: "I'll help you scan it"
[Automatically calls scanCode tool]
```

### Tool Calling Flow

1. **AI Analysis**: AI analyzes user request to determine if tools are needed
2. **Tool Invocation**: AI automatically calls appropriate tools
3. **User Confirmation**: Some tools (like photo selection, location) require user confirmation
4. **Operation Execution**: Tool performs the specific operation
5. **Result Return**: Tool execution results are returned to AI
6. **Final Response**: AI provides final response based on tool results

## Page Features

### Main Pages

- **Home (index)** - Main chat interface with multi-session management
- **Settings (settings)** - Application settings entry
- **AI Settings (ai-settings)** - AI service configuration
- **AI Config (ai-config)** - Detailed AI parameter configuration
- **MCP Settings (mcp-settings)** - MCP server management
- **MCP List (mcp-list)** - View all MCP servers
- **MCP Detail (mcp-detail)** - View MCP server details
- **MCP Edit (mcp-edit)** - Edit MCP server configuration
- **MCP Add (mcp-add)** - Add new MCP server

### Core Features

- **Multi-session Management** - Support creating, switching, and deleting chat sessions
- **Message History** - Automatically save and load chat history
- **Streaming Responses** - Real-time display of AI response process
- **Tool Calling** - Automatically call relevant tools to complete tasks
- **Markdown Rendering** - Support rich text format display
- **User Information Management** - Save user preference settings

## Notes

1. **User Confirmation**: Some tools (like photo selection, location) require user confirmation before execution
2. **Error Handling**: Tool call failures display appropriate error messages
3. **Streaming Responses**: Supports real-time display of AI responses and tool calling process
4. **Network Requirements**: Ensure stable network connection for tool calling functionality
5. **Permission Management**: Some tools may require user authorization for specific permissions
6. **Data Storage**: Chat history is automatically saved to local storage

## Troubleshooting

### Common Issues

**Q: API call fails?**
A: Check if the API key configuration in `miniprogram/lib/config/api.ts` is correct.

**Q: Tool calling not responding?**
A: Ensure network connection is stable and check console for error messages.

**Q: Photo selection fails?**
A: Check if camera and photo album permissions are granted.

**Q: Location acquisition fails?**
A: Check if location permission is granted and GPS is enabled.

**Q: Scan code function not working?**
A: Check if camera permission is granted.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or suggestions, please submit an Issue or Pull Request.

---

*Thank you for using SupChat! We hope this project brings you an excellent AI interaction experience.*
