## config-formatter

一个简单的“配置文件转换器”前端项目，基于 Vue 3 + Vite。支持在多种环境/配置格式之间进行转换，便于在不同场景下快速生成配置。

### 功能概览

- **环境变量格式互转**：
    - IntelliJ IDEA 环境变量文本 ↔ `.env` ↔ Linux Shell（`export KEY="VALUE"`）。
    - 处理基础的引号与空格转义（值含空格会在 `.env` 中自动加引号）。

- **Properties ↔ YAML 转换**：
    - Java Properties ↔ YAML 格式双向转换。
    - 支持嵌套配置结构的正确转换。

- **环境变量 ↔ Properties/YAML 转换**：
    - 各种环境变量格式可与 Java Properties 和 YAML 格式互相转换。
    - 保持配置结构和值的完整性。

- **Docker Compose → Spring Boot（单向）**：
    - 从 Compose 片段中提取 `mysql` 与 `redis`（仅常见字段：端口、数据库名、用户、密码、时区）。
    - 生成 Spring Boot 配置三种形式：
        - Spring Boot YAML（`spring.datasource`、`spring.data.redis`）
        - Spring Boot properties
        - Spring Boot 环境变量
    - 注意：该转换为单向，Compose 不能通过本工具反向从 Spring 配置生成。

### 开发环境

- Node.js 版本：`^20.19.0 || >=22.12.0`
- 依赖安装：

```sh
npm install
```

### 本地开发

```sh
npm run dev
```

### 构建与预览（部署）

```sh
# 产出到 dist/
npm run build

# 本地预览生产包
npm run preview
```

部署到任意静态资源服务器（Nginx、Apache、静态对象存储等）时，将 `dist/` 目录内容作为站点根目录即可。

### 测试

- 单元测试（Vitest）

```sh
npm run test:unit
```

- 端到端测试（Playwright）（首次需安装浏览器）：

```sh
npx playwright install
npm run test:e2e
```

### 代码质量

```sh
# ESLint / Oxlint / Prettier（组合命令）
npm run lint

# 仅格式化 src/
npm run format
```

### 使用说明（界面）

- 左侧/右侧各一个文本编辑区域，中间提供"→/← 转换"按钮与"交换格式"、"清空"按钮。
- 竖屏时上下布局，横屏时左右布局。
- **智能格式限制**：根据选择的来源格式，动态显示可用的目标格式选项，避免选择不支持的转换组合。

#### 支持的转换路径

**Docker Compose（仅支持到 Spring）**：

- `Docker Compose` → `Spring Boot YAML`
- `Docker Compose` → `Spring Boot properties`
- `Docker Compose` → `Spring Boot 环境变量`

**Properties ↔ YAML（双向）**：

- `Java Properties` ↔ `YAML`

**环境变量格式互转**：

- `IntelliJ IDEA` ↔ `.env` ↔ `Linux Shell`

**环境变量 ↔ Properties/YAML（双向）**：

- `IntelliJ IDEA` / `.env` / `Linux Shell` ↔ `Java Properties`
- `IntelliJ IDEA` / `.env` / `Linux Shell` ↔ `YAML`

#### 特色功能

- **格式记忆**：自动保存用户上次选择的格式组合
- **智能提示**：根据转换内容显示行数和字符统计
- **状态反馈**：转换过程中显示加载状态和结果提示
- **响应式设计**：支持桌面和移动设备

### 重要提示（局限性/不够健壮）

- 该工具为快速原型，**健壮性不足**：
    - Compose 解析使用行级扫描，未使用完整 YAML AST，复杂结构（多服务、`env_file`、变量替换、`profiles`、多网络等）可能解析失败或结果不准确。
    - 仅支持 `mysql` 与 `redis` 的常见字段，未覆盖连接池/SSL/超时/哨兵/集群等高级配置。
    - 环境变量引号/转义处理为简化实现，遇到复杂边界（特殊字符、换行、内嵌引号等）可能与期望不一致。
    - 不保证所有平台/终端编码一致性（例如 Windows 与 Linux 的换行符差异）。
- 若用于生产，请务必人工核对生成配置；建议引入更严格的解析与验证（如采用 YAML 解析库、引入 schema 校验等）。

---

## config-formatter (English)

A simple "Configuration File Converter" frontend project based on Vue 3 + Vite. Supports conversion between multiple environment/configuration formats for quick configuration generation in different scenarios.

### Features Overview

- **Environment Variable Format Conversion**:
    - IntelliJ IDEA environment variables ↔ `.env` ↔ Linux Shell (`export KEY="VALUE"`).
    - Handles basic quote and space escaping (values containing spaces are automatically quoted in `.env`).

- **Properties ↔ YAML Conversion**:
    - Bidirectional conversion between Java Properties and YAML formats.
    - Supports correct conversion of nested configuration structures.

- **Environment Variables ↔ Properties/YAML Conversion**:
    - Various environment variable formats can be converted with Java Properties and YAML formats.
    - Maintains configuration structure and value integrity.

- **Docker Compose → Spring Boot (Unidirectional)**:
    - Extracts `mysql` and `redis` from Compose fragments (common fields only: ports, database name, user, password, timezone).
    - Generates Spring Boot configurations in three forms:
        - Spring Boot YAML (`spring.datasource`, `spring.data.redis`)
        - Spring Boot properties
        - Spring Boot environment variables
    - Note: This conversion is unidirectional; Compose cannot be generated from Spring configurations using this tool.

### Development Environment

- Node.js version: `^20.19.0 || >=22.12.0`
- Install dependencies:

```sh
npm install
```

### Local Development

```sh
npm run dev
```

### Build & Preview (Deployment)

```sh
# Build to dist/
npm run build

# Preview production build locally
npm run preview
```

For deployment to any static resource server (Nginx, Apache, static object storage, etc.), use the `dist/` directory contents as the site root.

### Testing

- Unit Testing (Vitest):

```sh
npm run test:unit
```

- End-to-End Testing (Playwright) (first time requires browser installation):

```sh
npx playwright install
npm run test:e2e
```

### Code Quality

```sh
# ESLint / Oxlint / Prettier (combined command)
npm run lint

# Format src/ only
npm run format
```

### Usage Instructions (Interface)

- Left/right text editing areas, with "→/← Convert" buttons and "Swap Formats", "Clear" buttons in between.
- Vertical layout on portrait screens, horizontal layout on landscape screens.
- **Smart Format Limitation**: Dynamically displays available target format options based on selected source format to avoid unsupported conversion combinations.

#### Supported Conversion Paths

**Docker Compose (Spring conversions only)**:

- `Docker Compose` → `Spring Boot YAML`
- `Docker Compose` → `Spring Boot properties`
- `Docker Compose` → `Spring Boot Environment Variables`

**Properties ↔ YAML (Bidirectional)**:

- `Java Properties` ↔ `YAML`

**Environment Variable Format Conversion**:

- `IntelliJ IDEA` ↔ `.env` ↔ `Linux Shell`

**Environment Variables ↔ Properties/YAML (Bidirectional)**:

- `IntelliJ IDEA` / `.env` / `Linux Shell` ↔ `Java Properties`
- `IntelliJ IDEA` / `.env` / `Linux Shell` ↔ `YAML`

#### Special Features

- **Format Memory**: Automatically saves user's last selected format combination
- **Smart Tips**: Displays line count and character statistics based on conversion content
- **Status Feedback**: Shows loading status and result hints during conversion process
- **Responsive Design**: Supports desktop and mobile devices

### Important Notes (Limitations / Lack of Robustness)

- This tool is a rapid prototype with **insufficient robustness**:
    - Compose parsing uses line-by-line scanning, not full YAML AST parsing. Complex structures (multiple services, `env_file`, variable substitution, `profiles`, multiple networks, etc.) may fail to parse or produce inaccurate results.
    - Only supports common fields for `mysql` and `redis`, not covering advanced configurations like connection pools/SSL/timeouts/sentinels/clusters.
    - Environment variable quote/escape handling is simplified and may not match expectations for complex edge cases (special characters, newlines, embedded quotes, etc.).
    - Does not guarantee encoding consistency across all platforms/terminals (e.g., Windows vs Linux newline differences).
- If used in production, please manually verify generated configurations; consider introducing stricter parsing and validation (such as using YAML parsing libraries, adding schema validation, etc.).

