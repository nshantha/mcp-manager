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

## 🔐 Security Features

- **Context Isolation**: Secure IPC communication between processes
- **Vetted Servers Only**: No community servers, only trusted company implementations
- **OAuth Integration**: Secure credential storage using OS keychain
- **CSP Protection**: Content Security Policy headers prevent XSS attacks
- **Dependency Validation**: Only trusted dependencies can execute post-install scripts

## 🛠️ Technical Architecture

### Backend Services
- **AI Tool Detector**: Cross-platform detection using `which` and filesystem checks
- **MCP Server Manager**: Official `@modelcontextprotocol/sdk` integration
- **Secure IPC Handlers**: Context-isolated communication bridge

### Frontend Stack
- **React 19** with TypeScript 5 for type-safe UI development
- **Tailwind CSS 4** with shadcn/ui components for modern design
- **Electron Vite** for fast builds and hot reload
- **Lucide React** for consistent iconography

### Security Libraries
- **@modelcontextprotocol/sdk**: Official MCP TypeScript SDK (v1.17.2)
- **which**: Cross-platform executable detection (v5.0.0)
- **detect-installed**: Package installation verification (v2.0.4)

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or later
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/universal-mcp-manager.git
   cd universal-mcp-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Building for Production

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac     # macOS
npm run build:win     # Windows
npm run build:linux   # Linux
```

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run code linting
- `npm run lint:fix` - Fix linting issues automatically

## 🏗️ Development

### Project Structure

```
src/
├── main/                         # Main process (Node.js)
│   ├── main.ts                   # Electron main entry point
│   ├── ipc-handlers.ts          # IPC message handlers
│   └── services/                # Backend services
│       ├── ai-tool-detector.ts  # AI tool detection
│       └── mcp-server-manager.ts # MCP server management
├── renderer/                    # Renderer process (React)
│   ├── components/              # React components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Marketplace.tsx      # Server marketplace
│   │   ├── Settings.tsx         # App settings
│   │   └── ui/                  # Reusable UI components
│   └── styles/                  # CSS and styling
├── preload/                     # Preload scripts
│   └── index.ts                 # Secure IPC bridge
└── shared/                      # Shared types and utilities
    └── types.ts                 # TypeScript type definitions
```

### Adding New MCP Servers

1. Add server definition to `mcp-server-manager.ts`:
   ```typescript
   {
     id: 'new-server-id',
     name: 'Server Name',
     company: 'company-name',
     description: 'Server description',
     packageName: '@company/mcp-server-package',
     requiresAuth: true
   }
   ```

2. Update company badge colors in UI components
3. Test installation and configuration flows

### Security Guidelines

- **Never disable security features** like context isolation or CSP
- **Validate all user inputs** before processing
- **Use official libraries** for MCP server communication
- **Store credentials securely** using OS keychain APIs
- **Review dependencies regularly** for security vulnerabilities

## 🧪 Testing

The application includes comprehensive testing for:
- AI tool detection across different platforms
- MCP server installation and management
- Secure IPC communication
- UI component functionality

Run tests with:
```bash
npm test
```

## 📦 Supported Platforms

- **macOS**: 10.15+ (Catalina and later)
- **Windows**: 10/11 (x64)
- **Linux**: Ubuntu 18.04+ / Debian 10+ / Fedora 32+

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Set to `development` or `production`
- `ELECTRON_IS_DEV`: Enables development features

### Build Configuration

The application uses `electron-builder` for packaging with platform-specific configurations defined in `electron-builder.ts`.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following the coding standards
4. **Run tests** and ensure they pass
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Style

- **TypeScript** for type safety
- **ESLint + Biome** for code linting and formatting
- **Conventional Commits** for commit messages
- **Security-first** approach for all features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via [GitHub Issues](https://github.com/your-org/universal-mcp-manager/issues)
- **Security**: Report security vulnerabilities privately to security@your-org.com

## 🎯 Roadmap

### Phase 2: Advanced Features
- Advanced security scanning and vetting
- Custom server configuration options
- Health monitoring and diagnostics
- Backup and restore functionality

### Phase 3: Enterprise Features
- Team management and collaboration
- Centralized server deployment
- Advanced analytics and reporting
- SSO integration

### Phase 4: Ecosystem Expansion
- Plugin system for custom integrations
- API for third-party tool integration
- Community server vetting program
- Advanced automation features

## 📈 Metrics

The MVP focuses on these success metrics:
- ✅ Detects at least one AI tool (Claude Code/VS Code/Cursor)
- ✅ Successfully installs one MCP server (e.g., GitHub server)
- ✅ Server appears and works in detected AI tool
- ✅ Can enable/disable server per tool
- ✅ Basic OAuth flow works for one provider

---

**Built with ❤️ using modern web technologies and enterprise security practices.**

For questions, suggestions, or contributions, please visit our [GitHub repository](https://github.com/your-org/universal-mcp-manager).