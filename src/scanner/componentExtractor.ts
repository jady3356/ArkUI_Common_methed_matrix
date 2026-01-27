import * as fs from 'fs';
import * as path from 'path';

/**
 * 组件提取器 - 从SDK定义中提取组件列表
 */
export class ComponentExtractor {
  constructor(private sdkPath: string) {}

  /**
   * 从SDK目录提取所有组件
   */
  extractComponents(): string[] {
    const components: Set<string> = new Set();

    // 从 .d.ts 文件中提取组件
    const etsDir = path.join(this.sdkPath, 'component', 'ets');

    if (!fs.existsSync(etsDir)) {
      console.warn(`组件目录不存在: ${etsDir}`);
      return [];
    }

    const files = fs.readdirSync(etsDir);

    for (const file of files) {
      if (file.endsWith('.d.ts') && file !== 'common.d.ts' && !file.startsWith('_')) {
        // 从文件名提取组件名 (e.g., button.d.ts -> Button)
        let componentName = path.basename(file, '.d.ts');

        // 转换为 PascalCase
        componentName = this.toPascalCase(componentName);

        // 排除一些非组件文件
        const skipFiles = [
          'common', 'enums', 'units', 'index-full', 'common_ts_ets_api',
          'animator', 'gesture', 'focus', 'lifecycle', 'state_management',
          'image_common', 'text_common', 'component3d'
        ];

        if (!skipFiles.includes(componentName.toLowerCase())) {
          components.add(componentName);
        }
      }
    }

    return Array.from(components).sort();
  }

  /**
   * 转换为 PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 检查组件是否存在
   */
  componentExists(componentName: string): boolean {
    const etsDir = path.join(this.sdkPath, 'component', 'ets');
    const fileName = `${componentName.toLowerCase()}.d.ts`;
    const filePath = path.join(etsDir, fileName);
    return fs.existsSync(filePath);
  }

  /**
   * 读取组件文件内容
   */
  getComponentContent(componentName: string): string | null {
    const etsDir = path.join(this.sdkPath, 'component', 'ets');
    const fileName = `${componentName.toLowerCase()}.d.ts`;
    const filePath = path.join(etsDir, fileName);

    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(`读取组件文件失败: ${filePath}`, error);
      }
    }

    return null;
  }
}
