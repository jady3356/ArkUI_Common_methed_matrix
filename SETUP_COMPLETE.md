# ArkUI 组件属性支持度可视化大盘 - 使用说明

## 🎉 项目已成功部署！

项目已完成扫描和部署，目前有以下数据：

- **组件数量**: 128 个
- **通用属性数量**: 187 个
- **数据文件**: data/component_support_matrix.json

## 🚀 访问地址

- **前端页面**: http://localhost:3000
- **后端API**: http://localhost:3001

## 📊 扫描的组件列表（前10个）

1. AbilityComponent
2. ActionSheet
3. AlertDialog
4. AlphabetIndexer
5. Badge
6. Blank
7. Button
8. Calendar
9. CalendarPicker
10. Canvas

（共128个组件）

## 🔧 识别的通用属性（部分）

### 尺寸相关
- width, height, size, constraintSize
- layoutWeight, chainWeight

### 位置和布局
- position, offset, markAnchor, align
- margin, padding, alignRules

### 样式
- backgroundColor, foreground
- border, borderWidth, borderColor, borderRadius
- opacity, blur, shadow

### 文本
- font, fontSize, fontColor, fontWeight, fontStyle
- textAlign, textDecoration, lineHeight

### 事件
- onClick, onTouch, onHover, onFocus
- onAppear, onDisappearing

（共187个属性）

## 💡 使用方法

### 1. 查看支持度

打开 http://localhost:3000，你会看到一个巨大的矩阵表格：
- 行：128个 ArkUI 组件
- 列：187个通用属性
- 单元格：显示组件对该属性的支持状态

### 2. 状态说明

- ✅ **绿色勾**: 组件支持该属性
- ❌ **红色叉**: 组件不支持该属性
- ⚠️ **黄色问号**: 支持情况未知（可能支持，需要确认）

### 3. 编辑数据

**切换支持状态**:
- 直接点击表格中的状态单元格
- 状态会循环切换：支持 → 不支持 → 未知 → 支持

**修改Owner**:
- 在Owner列的输入框中输入负责人名字
- 该组件的所有属性都会更新为该Owner

**保存修改**:
- 点击右上角"保存修改"按钮
- 数据会保存到 `data/component_support_matrix.json`

### 4. 搜索和过滤

**搜索组件**:
- 在搜索框中输入组件名
- 表格会实时过滤显示匹配的组件

**排序**:
- 点击列标题可以按组件名排序
- 点击属性列可以按该属性的支持度排序

**分页**:
- 使用底部的分页控件浏览大量数据
- 可选择每页显示 20/50/100/200 条

## 🔄 重新扫描

如果需要重新扫描数据：

```bash
# 停止前端和后端服务 (Ctrl+C)

# 运行扫描
npm run scan

# 重新启动服务
npm run dev
```

## 📁 数据文件格式

```json
{
  "components": {
    "Button": {
      "name": "Button",
      "properties": {
        "width": {
          "isSupported": "supported",
          "source": "auto",
          "lastUpdated": "2026-01-27T08:45:46.526Z",
          "notes": "组件继承自 CommonMethod"
        }
      }
    }
  },
  "commonProperties": ["width", "height", ...],
  "lastScanned": "2026-01-27T08:45:46.526Z"
}
```

## 🎨 技术实现

### 扫描逻辑

1. **组件提取**: 从 `api/@internal/component/ets/*.d.ts` 文件中提取所有组件定义
2. **属性提取**: 从 `common.d.ts` 的 `CommonMethod` 类中提取所有通用属性方法
3. **支持度判定**:
   - 检查组件是否继承 CommonMethod
   - 检查组件文件中是否提到该属性
   - 基于继承关系推断支持度

### 扫描路径

```
SDK定义: ../api/@internal/component/ets
文档: ../api_reference/docs (可选)
示例: ../sample (可选)
引擎: ../arkui_ace_engine (可选)
```

### 数据保护

- 手动修改的数据（source: "manual"）会被保留
- 重新扫描时会跳过手动标记的字段
- 只有自动扫描的字段会被更新

## 🌟 下一步建议

1. **完善支持度判定**:
   - 添加文档扫描逻辑
   - 添加示例代码分析
   - 添加引擎实现检查

2. **增强功能**:
   - 支持导出为 Excel/CSV
   - 添加批量编辑功能
   - 添加版本对比功能

3. **性能优化**:
   - 使用虚拟滚动优化大数据量显示
   - 添加数据缓存
   - 实现增量更新

## 📝 注意事项

- 首次加载可能较慢，因为需要加载 128×187 = 23,936 个数据点
- 建议使用分页浏览，不要一次性加载所有数据
- 修改数据后记得点击"保存修改"按钮
- 数据文件可以手动编辑或通过版本控制管理

---

**项目状态**: ✅ 运行中
**最后更新**: 2026-01-27
**版本**: 1.0.0
