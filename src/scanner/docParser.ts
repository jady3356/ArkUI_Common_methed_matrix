import * as fs from 'fs';
import * as path from 'path';

/**
 * API 文档解析器 - 从文档中提取属性不支持的信息
 */
export class DocParser {
  private unsupportedCache: Map<string, Set<string>> = new Map();

  constructor(private docsPath: string) {
    this.loadUnsupportedInfo();
  }

  /**
   * 加载所有文档中的不支持信息
   */
  private loadUnsupportedInfo(): void {
    console.log('📚 解析 API 文档，提取属性不支持信息...');

    const uiDocsPath = path.join(this.docsPath, 'zh-cn/application-dev/ui');
    const files = this.getAllMarkdownFiles(uiDocsPath);

    for (const file of files) {
      this.parseFile(file);
    }

    const totalUnsupporteds = Array.from(this.unsupportedCache.values())
      .reduce((sum, set) => sum + set.size, 0);

    console.log(`✅ 解析了 ${files.length} 个文档文件`);
    console.log(`✅ 找到 ${totalUnsupporteds} 条属性不支持信息\n`);
  }

  /**
   * 解析单个文件
   */
  private parseFile(filePath: string): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.md');

      // 提取组件名称
      const componentName = this.extractComponentName(fileName, content);
      if (!componentName) {
        return;
      }

      const unsupportedProps = new Set<string>();

      // 定义所有表示属性不生效/不支持的模式
      const patterns = [
        // ===== 不支持 =====
        // 不支持某个属性
        /不支持\s+(?:通过)?(?:调用)?(?:设置)?(?:[\u4e00-\u9fa5]+\s+)?(\w+)\s+(?:属性|接口|方法|API)/gi,
        /(\w+)\s+(?:属性|接口|方法|API)\s+不支持/gi,
        /不支持\s+(\w+)\s+(?:属性|接口|方法)/gi,
        /不支持\s+通过\s+(\w+)\s+属性/gi,
        // 一般性不支持
        /不支持\s+(\w+)(?!\s+[:：])/gi,
        // 表格中的不支持
        /\|\s*(\w+)\s*\|\s*不支持/gi,

        // ===== 不生效 =====
        /(\w+)\s+(?:属性|接口|方法)?\s*不生效/gi,
        /(?:设置|配置|使用)?(\w+)\s+(?:属性|接口|方法)?\s*(?:时|后)?\s*不生效/gi,
        /不生效\s*(?::|：)?\s*设置\s+(\w+)/gi,
        /对\s+(\w+)\s+不生效/gi,
        /(\w+)\s+对\s+\S+\s+不生效/gi,

        // ===== 无效 =====
        /(\w+)\s+(?:设置|配置|参数)?\s*无效/gi,
        /设置\s+(\w+)\s+(?:无效|不起作用)/gi,
        /(\w+)\s+参数\s+无效/gi,

        // ===== 没有效果/不起作用 =====
        /(\w+)\s+(?:属性|接口|方法)?\s*(?:没有效果|不起作用|无法生效|不会生效)/gi,
        /使用\s+(\w+)\s+(?:没有效果|不起作用)/gi,
        /(\w+)\s+不会\s+(?:生效|响应|起作用)/gi,

        // ===== 不响应 =====
        /(\w+)\s+(?:属性|接口|方法)?\s*不响应/gi,
        /不响应\s+(\w+)/gi,

        // ===== 失效 =====
        /(\w+)\s+(?:属性|接口|方法)?\s*失效/gi,
        /(\w+)\s+会\s+失效/gi,

        // ===== 无法设置/不能设置 =====
        /无法\s+(?:设置|配置|修改)\s+(\w+)/gi,
        /不能\s+(?:设置|配置|修改)\s+(\w+)/gi,
        /(\w+)\s+无法\s+(?:设置|配置|修改)/gi,

        // ===== 特定上下文的限制 =====
        /当\s+[^。]{0,50}?\s+(\w+)\s+[^。]{0,30}?(?:不生效|无效|不支持|不响应)/gi,
        /(?:此|该|本)\s+[^。]{0,30}?\s+(\w+)\s+[^。]{0,30}?(?:不生效|无效|不支持)/gi,
      ];

      // 应用所有模式
      for (const pattern of patterns) {
        let match;
        // 重置正则表达式的 lastIndex
        pattern.lastIndex = 0;
        while ((match = pattern.exec(content)) !== null) {
          const propName = match[1];
          if (this.isLikelyPropertyName(propName)) {
            unsupportedProps.add(propName);
          }
        }
      }

      // 特殊处理：查找并列的属性列表
      // 例如："不支持 A、B、C 属性" 或 "A、B、C 不生效"
      const listPatterns = [
        /(?:不支持|不生效|无效)\s+[:：]?\s*(?:[\u4e00-\u9fa5]+\s+)?([a-zA-Z][a-zA-Z0-9]*(?:[、,，]\s*[a-zA-Z][a-zA-Z0-9]*)+)/gi,
        /([a-zA-Z][a-zA-Z0-9]*(?:[、,，]\s*[a-zA-Z][a-zA-Z0-9]*)+)\s+(?:属性|接口|方法)?\s*(?:不支持|不生效|无效)/gi,
      ];

      for (const pattern of listPatterns) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(content)) !== null) {
          const list = match[1];
          // 分割属性名（支持中文顿号、英文逗号）
          const props = list.split(/[、,，]/).map(p => p.trim()).filter(p => p);
          props.forEach(prop => {
            if (this.isLikelyPropertyName(prop)) {
              unsupportedProps.add(prop);
            }
          });
        }
      }

      // 缓存结果
      if (unsupportedProps.size > 0) {
        if (!this.unsupportedCache.has(componentName)) {
          this.unsupportedCache.set(componentName, new Set());
        }
        unsupportedProps.forEach(prop => {
          this.unsupportedCache.get(componentName)!.add(prop);
        });

        // 调试输出（可选）
        // console.log(`${componentName}: ${Array.from(unsupportedProps).join(', ')}`);
      }

    } catch (error) {
      // 忽略读取错误
    }
  }

  /**
   * 从文件名提取组件名称
   */
  private extractComponentName(fileName: string, content: string): string | null {
    // 从文件名提取组件名
    // 例如: arkts-common-components-button.md -> Button
    const match = fileName.match(/arkts[-\w]+-(\w+)$/);
    if (match) {
      return this.capitalizeFirst(match[1]);
    }

    // 尝试从内容中提取组件名
    const titleMatch = content.match(/^#\s+(\w+)/m);
    if (titleMatch) {
      return titleMatch[1];
    }

    return null;
  }

  /**
   * 检查一个词是否像属性名
   */
  private isLikelyPropertyName(word: string): boolean {
    // 扩展的黑名单 - 常见的非属性词
    const blacklist = [
      // 英文常用词
      'the', 'this', 'that', 'with', 'from', 'when', 'while', 'which', 'where',
      '以下', '为', '主要', '包括', '等', '和', '或', '但是', '因此', '所以',
      '可以', '需要', '应该', '使用', '实现', '调用', '设置', '配置',
      '获取', '创建', '删除', '更新', '修改', '添加', '移除', '变化',
      '当前', '默认', '其他', '所有', '支持', '不支持', '生效', '无效',
      // 英文动词和形容词后缀
      'able', 'ible', 'ful', 'less', 'ous', 'ive', 'al', 'ic', 'ed', 'ing',
      'ly', 'wise', 'ward', 'wards', 'ways',
      // 介词和冠词
      'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with',
      'from', 'into', 'onto', 'upon', 'within', 'without',
      // 助动词
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'cannot',
      // 常用否定词
      'not', 'no', 'yes', 'true', 'false', 'null', 'undefined', 'none',
      // 数量词
      'one', 'two', 'three', 'first', 'second', 'third', 'last', 'next',
      // 时间和位置
      'time', 'date', 'before', 'after', 'during', 'under', 'over',
      // UI 相关但不是属性
      'component', 'element', 'node', 'tree', 'list', 'item',
      // 常见技术术语但不是属性
      'api', 'sdk', 'ui', 'ux', 'html', 'css', 'js', 'ts', 'json',
    ];

    const lower = word.toLowerCase();

    // 必须是字母开头，可以包含数字，长度 2-30
    if (!/^[a-z][a-z0-9]*$/i.test(word) || word.length < 2 || word.length > 30) {
      return false;
    }

    // 不在黑名单中
    if (blacklist.includes(lower)) {
      return false;
    }

    // 优先考虑常见的 ArkUI 属性名模式
    // 例如: width, height, fontSize, backgroundColor, borderRadius
    // 通常以小写字母开头，可能是驼峰命名

    return true;
  }

  /**
   * 首字母大写
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 获取所有 markdown 文件
   */
  private getAllMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 检查组件是否明确不支持某个属性
   */
  isPropertyUnsupported(componentName: string, propertyName: string): boolean {
    const key = this.findComponentKey(componentName);
    if (!key) {
      return false;
    }

    const unsupportedProps = this.unsupportedCache.get(key);
    if (!unsupportedProps) {
      return false;
    }

    return unsupportedProps.has(propertyName);
  }

  /**
   * 查找组件的缓存键（支持模糊匹配）
   */
  private findComponentKey(componentName: string): string | null {
    // 精确匹配
    if (this.unsupportedCache.has(componentName)) {
      return componentName;
    }

    // 不区分大小写匹配
    for (const key of this.unsupportedCache.keys()) {
      if (key.toLowerCase() === componentName.toLowerCase()) {
        return key;
      }
    }

    return null;
  }

  /**
   * 获取组件的所有不支持属性列表
   */
  getUnsupportedProperties(componentName: string): string[] {
    const key = this.findComponentKey(componentName);
    if (!key) {
      return [];
    }

    return Array.from(this.unsupportedCache.get(key) || []);
  }
}
