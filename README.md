# ArkUI 组件属性支持度可视化大盘

一个用于查询和可视化 ArkUI 组件通用属性支持度的工具。

## 功能特性

- 🔍 **自动扫描**: 从 SDK、Engine 源码自动提取组件和属性信息
- 📊 **可视化展示**: 以矩阵表格形式展示组件与属性的支持情况
- ✏️ **手动编辑**: 支持在界面上直接修改支持状态和 Owner 信息
- 💾 **数据持久化**: 所有修改自动保存到本地 JSON 文件
- 🎨 **精美界面**: 基于 Vue 3 + Element Plus 的现代化 UI

## 项目结构

```
arkui-support-matrix/
├── src/
│   ├── scanner/          # 数据扫描脚本
│   │   ├── index.ts      # 主扫描器
│   │   ├── componentExtractor.ts    # 组件提取
│   │   ├── propertyExtractor.ts     # 属性提取
│   │   └── supportChecker.ts        # 支持度检查
│   ├── server/           # 后端 API 服务
│   │   └── index.ts
│   └── frontend/         # Vue 3 前端
│       ├── src/
│       │   ├── App.vue
│       │   ├── main.ts
│       │   └── api/
│       ├── index.html
│       └── vite.config.ts
├── data/                 # 数据存储目录
│   └── component_support_matrix.json
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd src/frontend
npm install
cd ../..
```

### 2. 配置路径

设置环境变量或修改配置：

```bash
export SDK_PATH="../api/@internal/component/ets"
export DOCS_PATH="../api_reference/docs"
export SAMPLES_PATH="../sample/applications_app_samples"
export ENGINE_PATH="../arkui_ace_engine/frameworks/bridge/declarative_frontend/js_view/"
```

### 3. 运行扫描

```bash
npm run scan
```

这将扫描源码并生成 `data/component_support_matrix.json`。

### 4. 启动服务

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run server:dev  # 后端 API (http://localhost:3001)
npm run frontend:dev  # 前端页面 (http://localhost:3000)
```

### 5. 访问界面

打开浏览器访问: http://localhost:3000

## 使用说明

### 查看支持度

- ✅ **绿色**: 组件支持该属性
- ❌ **红色**: 组件不支持该属性
- ⚠️ **黄色**: 支持情况未知

### 编辑数据

1. **切换支持状态**: 直接点击表格中的状态单元格即可切换（支持 → 不支持 → 未知）
2. **修改 Owner**: 在 Owner 列的输入框中直接输入负责人
3. **保存修改**: 点击右上角的"保存修改"按钮

### 搜索过滤

- 使用搜索框快速定位特定组件
- 点击列标题可以按支持度排序
- 使用分页控件浏览大量数据

## API 接口

### GET /api/matrix
获取完整的支持矩阵数据

### POST /api/matrix
保存支持矩阵数据

### POST /api/component/:name/property/:property
更新单个属性的支持状态

### POST /api/component/:name/owner
更新组件的 Owner 信息

## 扫描规则

扫描器使用以下规则判定属性支持度：

1. **后端实现**: 检查引擎代码中是否存在 `Set[PropertyName]` 方法
2. **文档声明**: 扫描文档中是否提到该属性的支持情况
3. **示例代码**: 检查示例代码中是否使用了该属性

## 技术栈

- **扫描器**: Node.js + TypeScript
- **后端**: Express + TypeScript
- **前端**: Vue 3 + Vite + Element Plus
- **存储**: JSON 文件

## 开发

```bash
# 构建前端
npm run frontend:build

# 构建所有
npm run build

# 生产环境启动
npm start
```

## 注意事项

- 首次使用需要先运行 `npm run scan` 生成初始数据
- 手动修改的数据会被保留（source: 'manual'）
- 重新扫描会保留所有手动标记的字段
- 建议定期运行扫描以更新数据

## License

MIT
