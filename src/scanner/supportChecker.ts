import * as fs from 'fs';
import * as path from 'path';
import { PropertySupport, SupportStatus } from '../types';

/**
 * 支持度检查器 - 判定组件是否支持某个属性
 */
export class SupportChecker {
  constructor(
    private enginePath: string,
    private docsPath: string,
    private samplesPath: string,
    private sdkPath: string
  ) {}

  /**
   * 检查组件对属性的支持情况
   */
  checkSupport(
    componentName: string,
    propertyName: string,
    existingData?: PropertySupport
  ): PropertySupport {
    // 如果存在手动修改的数据，保留其状态
    if (existingData?.source === 'manual') {
      return existingData;
    }

    // Rule 1: 检查组件定义文件是否扩展了 CommonMethod
    const typeScriptSupport = this.checkTypeScriptDefinition(componentName, propertyName);

    if (typeScriptSupport === 'supported') {
      return {
        isSupported: 'supported',
        source: 'auto',
        lastUpdated: new Date().toISOString(),
        notes: '组件继承自 CommonMethod'
      };
    }

    // Rule 2: 检查组件文件中是否明确提到了该属性
    const mentionedInFile = this.checkPropertyMentioned(componentName, propertyName);

    if (mentionedInFile === 'supported') {
      return {
        isSupported: 'supported',
        source: 'auto',
        lastUpdated: new Date().toISOString(),
        notes: '在组件定义中找到'
      };
    }

    // 默认返回未知状态（因为继承 CommonMethod 的组件理论上支持所有通用属性）
    return {
      isSupported: 'unknown',
      source: 'auto',
      lastUpdated: new Date().toISOString(),
      notes: '未明确声明，可能支持'
    };
  }

  /**
   * Rule 1: 检查 TypeScript 定义
   */
  private checkTypeScriptDefinition(
    componentName: string,
    propertyName: string
  ): SupportStatus {
    const etsDir = path.join(this.sdkPath, 'component', 'ets');
    const fileName = `${componentName.toLowerCase()}.d.ts`;
    const filePath = path.join(etsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return 'unknown';
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 检查是否扩展了 CommonMethod
      const extendsCommonMethod = content.includes('extends CommonMethod');

      if (extendsCommonMethod) {
        // 如果扩展了 CommonMethod，理论上支持所有通用属性
        return 'supported';
      }

      // 检查是否使用了泛型继承 CommonMethod<T>
      const genericPattern = /extends\s+CommonMethod\s*</;
      if (genericPattern.test(content)) {
        return 'supported';
      }

      // 检查类定义中是否混入 CommonMethod
      const implementsPattern = /implements\s+.*CommonMethod/;
      if (implementsPattern.test(content)) {
        return 'supported';
      }

    } catch (error) {
      console.error(`检查 TypeScript 定义失败: ${componentName}.${propertyName}`, error);
    }

    return 'unknown';
  }

  /**
   * Rule 2: 检查组件文件中是否提到了该属性
   */
  private checkPropertyMentioned(
    componentName: string,
    propertyName: string
  ): SupportStatus {
    const etsDir = path.join(this.sdkPath, 'component', 'ets');
    const fileName = `${componentName.toLowerCase()}.d.ts`;
    const filePath = path.join(etsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return 'unknown';
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // 检查是否提到了该属性方法
      const methodPattern = new RegExp(`\\b${propertyName}\\s*\\(`, 'i');

      if (methodPattern.test(content)) {
        // 确认这不是"不支持"的说明
        const unsupportedPattern = new RegExp(
          `不支持.*${propertyName}|${propertyName}.*不支持|does not support.*${propertyName}`,
          'i'
        );

        if (!unsupportedPattern.test(content)) {
          return 'supported';
        }
      }

    } catch (error) {
      console.error(`检查属性提及失败: ${componentName}.${propertyName}`, error);
    }

    return 'unknown';
  }

  /**
   * 递归获取所有文件（用于其他规则的检查）
   */
  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 跳过node_modules等目录
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }
}
