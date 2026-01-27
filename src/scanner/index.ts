import * as fs from 'fs';
import * as path from 'path';
import { ComponentExtractor } from './componentExtractor';
import { PropertyExtractor } from './propertyExtractor';
import { SupportChecker } from './supportChecker';
import { SupportMatrix, ScanConfig, ComponentInfo } from '../types';

/**
 * 主扫描器
 */
export class Scanner {
  private config: ScanConfig;

  constructor(config: ScanConfig) {
    this.config = config;
  }

  /**
   * 执行扫描
   */
  async scan(): Promise<SupportMatrix> {
    console.log('🔍 开始扫描 ArkUI 组件支持度...\n');

    // 1. 读取现有数据（如果存在）
    const existingData = this.loadExistingData();

    // 2. 提取组件列表
    console.log('📦 提取组件列表...');
    const componentExtractor = new ComponentExtractor(this.config.sdkPath);
    const components = componentExtractor.extractComponents();
    console.log(`✅ 找到 ${components.length} 个组件\n`);

    // 3. 提取通用属性
    console.log('🔧 提取通用属性...');
    const propertyExtractor = new PropertyExtractor(this.config.sdkPath);
    const commonProperties = propertyExtractor.extractCommonProperties();
    console.log(`✅ 找到 ${commonProperties.length} 个通用属性\n`);

    // 4. 检查每个组件对每个属性的支持情况
    console.log('🔬 检查属性支持度...');
    const supportChecker = new SupportChecker(
      this.config.enginePath,
      this.config.docsPath,
      this.config.samplesPath,
      this.config.sdkPath
    );

    const componentMap: Record<string, ComponentInfo> = {};
    let processedCount = 0;

    for (const componentName of components) {
      if (processedCount % 10 === 0) {
        console.log(`   进度: ${processedCount}/${components.length}`);
      }

      const existingComponent = existingData?.components[componentName];
      const properties: Record<string, any> = {};

      for (const propertyName of commonProperties) {
        const existingProp = existingComponent?.properties[propertyName];
        properties[propertyName] = supportChecker.checkSupport(
          componentName,
          propertyName,
          existingProp
        );
      }

      componentMap[componentName] = {
        name: componentName,
        properties
      };

      processedCount++;
    }

    console.log(`✅ 完成 ${processedCount} 个组件的检查\n`);

    // 5. 构建结果
    const result: SupportMatrix = {
      components: componentMap,
      commonProperties,
      lastScanned: new Date().toISOString(),
      metadata: {
        version: '1.0.0',
        sdkPath: this.config.sdkPath,
        enginePath: this.config.enginePath
      }
    };

    // 6. 保存结果
    console.log('💾 保存扫描结果...');
    this.saveResults(result);
    console.log('✅ 结果已保存到:', this.config.outputPath);

    return result;
  }

  /**
   * 加载现有数据
   */
  private loadExistingData(): SupportMatrix | null {
    try {
      if (fs.existsSync(this.config.outputPath)) {
        const content = fs.readFileSync(this.config.outputPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('加载现有数据失败:', error);
    }
    return null;
  }

  /**
   * 保存结果
   */
  private saveResults(data: SupportMatrix): void {
    try {
      const dir = path.dirname(this.config.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.config.outputPath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('保存结果失败:', error);
      throw error;
    }
  }
}

/**
 * CLI 入口
 */
async function main() {
  // 从环境变量或默认值获取配置
  const config: ScanConfig = {
    sdkPath: process.env.SDK_PATH || path.join(__dirname, '../../../api/@internal'),
    docsPath: process.env.DOCS_PATH || path.join(__dirname, '../../../api_reference/docs'),
    samplesPath: process.env.SAMPLES_PATH || path.join(__dirname, '../../../sample'),
    enginePath: process.env.ENGINE_PATH || path.join(__dirname, '../../../arkui_ace_engine'),
    outputPath: path.join(__dirname, '../../data/component_support_matrix.json')
  };

  // 验证路径
  console.log('配置信息:');
  console.log('  SDK路径:', config.sdkPath);
  console.log('  文档路径:', config.docsPath);
  console.log('  示例路径:', config.samplesPath);
  console.log('  引擎路径:', config.enginePath);
  console.log('  输出路径:', config.outputPath);
  console.log('');

  const scanner = new Scanner(config);

  try {
    await scanner.scan();
    console.log('\n🎉 扫描完成！');
  } catch (error) {
    console.error('\n❌ 扫描失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行扫描
if (require.main === module) {
  main();
}
