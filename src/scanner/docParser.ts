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

      // 查找所有"不支持"的说明
      const patterns = [
        // 不支持某个属性
        /不支持\s+通过?(\w+)\s+属性/gi,
        /不支持\s+(\w+)\s+属性/gi,
        /(\w+)\s+属性\s+不支持/gi,
        // 不支持某个功能
        /不支持\s+(\w+)/gi,
        // 表格中的不支持说明
        /\|\s*(\w+)\s*\|\s*不支持/gi,
      ];

      const unsupportedProps = new Set<string>();

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const propName = match[1];
          // 过滤掉一些明显不是属性名的词
          if (this.isLikelyPropertyName(propName)) {
            unsupportedProps.add(propName);
          }
        }
      }

      // 特殊处理：查找"不支持"后面的属性列表
      const listPattern = /不支持\s+[:：]\s*([^\n]+)/gi;
      let listMatch;
      while ((listMatch = listPattern.exec(content)) !== null) {
        const list = listMatch[1];
        // 提取中英文属性名
        const props = list.match(/[a-zA-Z]+/g);
        if (props) {
          props.forEach(prop => {
            if (this.isLikelyPropertyName(prop)) {
              unsupportedProps.add(prop);
            }
          });
        }
      }

      if (unsupportedProps.size > 0) {
        if (!this.unsupportedCache.has(componentName)) {
          this.unsupportedCache.set(componentName, new Set());
        }
        unsupportedProps.forEach(prop => {
          this.unsupportedCache.get(componentName)!.add(prop);
        });
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
    // 过滤掉一些常见的非属性词
    const blacklist = [
      'the', 'this', 'that', 'with', 'from', 'when', 'while',
      '以下', '为', '主要', '包括', '等', '和', '或', '但是',
      '可以', '需要', '应该', '使用', '实现', '调用', '设置',
      '获取', '创建', '删除', '更新', '修改', '添加', '移除',
      '当前', '默认', '其他', '所有', '支持', '不支持',
      'able', 'ible', 'ful', 'less', 'ous', 'ive', 'al', 'ic',
      'ly', 'wise', 'ward', 'wards', 'ways', 'ward',
      'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for',
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can',
      'not', 'no', 'yes', 'true', 'false', 'null', 'undefined',
    ];

    const lower = word.toLowerCase();

    // 必须是字母开头，长度2-30
    if (!/^[a-z][a-z0-9]*$/i.test(word) || word.length < 2 || word.length > 30) {
      return false;
    }

    // 不在黑名单中
    if (blacklist.includes(lower)) {
      return false;
    }

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
