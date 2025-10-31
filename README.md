## config-formatter

一个简单的“配置文件转换器”前端项目，基于 Vue 3 + Vite。支持在多种环境/配置格式之间进行转换，便于在不同场景下快速生成配置。

### 功能概览
- **环境变量互转**：
  - IntelliJ IDEA 环境变量文本 ↔ `.env` ↔ Linux Shell（`export KEY="VALUE"`）。
  - 处理基础的引号与空格转义（值含空格会在 `.env` 中自动加引号）。
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
- 左侧/右侧各一个文本编辑区域，中间提供“→/← 转换”按钮与“交换格式”、“清空”按钮。
- 竖屏时上下布局，横屏时左右布局。
- 左侧可选：`IntelliJ IDEA`、`.env`、`Linux Shell`、`Docker Compose（只支持到 Spring）`。
- 右侧可选：上述三种环境变量格式，或 `Spring Boot YAML`、`Spring Boot properties`、`Spring Boot 环境变量`。
- 当左侧选择 `Docker Compose（只支持到 Spring）` 时，只能转换为 Spring Boot 的三种输出格式（单向）。

### 重要提示（局限性/不够健壮）
- 该工具为快速原型，**健壮性不足**：
  - Compose 解析使用行级扫描，未使用完整 YAML AST，复杂结构（多服务、`env_file`、变量替换、`profiles`、多网络等）可能解析失败或结果不准确。
  - 仅支持 `mysql` 与 `redis` 的常见字段，未覆盖连接池/SSL/超时/哨兵/集群等高级配置。
  - 环境变量引号/转义处理为简化实现，遇到复杂边界（特殊字符、换行、内嵌引号等）可能与期望不一致。
  - 不保证所有平台/终端编码一致性（例如 Windows 与 Linux 的换行符差异）。
- 若用于生产，请务必人工核对生成配置；建议引入更严格的解析与验证（如采用 YAML 解析库、引入 schema 校验等）。

