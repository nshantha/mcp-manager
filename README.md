# Universal MCP Manager

**Enterprise-grade management for Model Context Protocol servers across AI development tools**

Universal MCP Manager is a secure, cross-platform Electron desktop application that simplifies the installation, configuration, and management of Model Context Protocol (MCP) servers across multiple AI development environments including Claude Code, VS Code, and Cursor.

## 🎯 Core Value Proposition

**"Install trusted MCP servers once, use everywhere safely."**

- **Vetted Company Servers Only:** GitHub, Notion, Atlassian, Slack, Linear (no community servers)
- **Security-First Vetting:** Malicious code detection before marketplace inclusion  
- **Universal Configuration:** One setup works across Claude Code, VS Code, Cursor
- **Enterprise Security:** OAuth + OS keychain for credential management

## ✨ Features

### 🏠 Dashboard
- **AI Tool Detection**: Automatically detects installed AI development tools (Claude Code, VS Code, Cursor)
- **Server Health Panel**: Real-time status of installed MCP servers
- **Quick Actions**: Install/uninstall popular servers with one click
- **Token Management**: Secure API token configuration with validation

### 🏪 Marketplace  
- **Curated Server Library**: Only vetted servers from trusted companies
- **One-Click Installation**: Install servers with default secure configurations
- **Company Integration**: GitHub, Notion, Slack, Linear, and Anthropic servers
- **OAuth Ready**: Built-in authentication flow for servers requiring credentials

### ⚙️ Settings
- **Security Dashboard**: View active security features and configurations
- **Theme Selection**: Light/dark mode support
- **Notification Management**: Control update and status notifications
- **Auto-Update Control**: Manage automatic security updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or later
- npm or yarn package manager

### Installation & Development

```bash
# Clone and install
git clone <repository-url>
cd mcp-manager
npm install

# Start development
npm run dev

# Build for production  
npm run build
```

## 📁 Project Structure

```
mcp-manager/
├── 📁 src/                          # Source code
│   ├── main/                        # Main process (Node.js)
│   │   ├── services/                # Backend services
│   │   └── windows/                 # Window management
│   ├── renderer/                    # Renderer process (React)
│   │   ├── components/              # React components
│   │   └── screens/                 # Screen components
│   ├── preload/                     # Preload scripts
│   └── shared/                      # Shared utilities
├── 📁 test/                         # Test files
│   ├── test-github-mcp.js           # GitHub MCP testing
│   ├── test-integration.js          # Integration tests  
│   ├── troubleshoot-claude-mcp.js   # Debugging scripts
│   └── verify-mvp.js                # MVP verification
├── 📁 project_documentation/        # Documentation
│   ├── CONFIGURE_FUNCTIONALITY.md   # Configuration guide
│   ├── GITHUB_MCP_TEST_GUIDE.md     # Testing instructions
│   ├── TOKEN_MANAGEMENT.md          # Token management
│   └── MVP_PLAN.md                  # Project planning
├── 📁 scripts/                      # Build & utility scripts
│   └── build/                       # Build configuration
├── 📦 Configuration Files
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json               # TypeScript config
│   ├── electron.vite.config.ts     # Build configuration
│   └── biome.json                  # Code linting
└── 📖 README.md                    # This file
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run prebuild` | Clean and compile app |
| `npm run clean:dev` | Clean development artifacts |
| `npm run lint` | Run code linting |
| `npm run lint:fix` | Fix linting issues automatically |

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Test GitHub MCP functionality
node test/test-github-mcp.js

# Verify MVP requirements  
node test/verify-mvp.js

# Troubleshoot Claude Code integration
node test/troubleshoot-claude-mcp.js
```

## 🔐 Security Features

- **Context Isolation**: Secure IPC communication between processes
- **Vetted Servers Only**: No community servers, only trusted company implementations  
- **Token Validation**: Smart detection of placeholder vs. real API tokens
- **Multi-Tool Sync**: Secure configuration across Claude Code, VS Code, Cursor
- **CSP Protection**: Content Security Policy headers prevent XSS attacks

## 🛠️ Architecture

### Backend Services
- **AI Tool Detector**: Cross-platform detection using filesystem checks
- **MCP Server Manager**: Official `@modelcontextprotocol/sdk` integration  
- **Token Management**: Secure API token storage and validation

### Frontend Stack
- **React 19** with TypeScript 5 for type-safe UI development
- **Tailwind CSS 4** with shadcn/ui components for modern design
- **Electron Vite** for fast builds and hot reload
- **Lucide React** for consistent iconography

## 📋 Current Status: ✅ MVP Complete

### ✅ Implemented Features
- [x] **Window Management** - Resizable Electron window (1200×800)
- [x] **Clean UI** - Modern design with professional layout
- [x] **Token Management** - In-app secure token configuration
- [x] **Authentication Detection** - Smart placeholder vs. real token detection
- [x] **Multi-Tool Configuration** - Updates Claude Code, VS Code, Cursor configs
- [x] **GitHub MCP Server** - Fully tested with 26+ repositories
- [x] **Real-time Status** - Live authentication and server status

### 🧪 Testing Status
- [x] **GitHub MCP Server** - ✅ Working with personal access token
- [x] **Configuration Files** - ✅ All AI tools configured
- [x] **Repository Access** - ✅ 26+ GitHub repositories accessible
- [x] **Authentication** - ✅ Valid token verification

## 📖 Documentation

Detailed documentation is available in the `project_documentation/` folder:

- **[Configure Functionality](project_documentation/CONFIGURE_FUNCTIONALITY.md)** - Configuration features
- **[GitHub MCP Testing](project_documentation/GITHUB_MCP_TEST_GUIDE.md)** - Testing guide  
- **[Token Management](project_documentation/TOKEN_MANAGEMENT.md)** - Security implementation
- **[Implementation Notes](project_documentation/IMPLEMENTATION_NOTES.md)** - Technical details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards  
4. Run tests and ensure they pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using modern web technologies and enterprise security practices.**

For questions or contributions, please check the documentation in `project_documentation/` or create an issue.