/**
 * 组件属性支持状态
 */
export type SupportStatus = 'supported' | 'unsupported' | 'unknown';

/**
 * 单个属性的支持信息
 */
export interface PropertySupport {
  /** 是否支持 */
  isSupported: SupportStatus;
  /** 所有者/负责人 */
  owner?: string;
  /** 最后更新时间 */
  lastUpdated?: string;
  /** 数据来源 (auto/manual) */
  source?: 'auto' | 'manual';
  /** 备注 */
  notes?: string;
}

/**
 * 组件信息
 */
export interface ComponentInfo {
  /** 组件名称 */
  name: string;
  /** 各个属性的支持情况 */
  properties: Record<string, PropertySupport>;
}

/**
 * 支持矩阵数据结构
 */
export interface SupportMatrix {
  /** 所有组件 */
  components: Record<string, ComponentInfo>;
  /** 所有通用属性列表 */
  commonProperties: string[];
  /** 最后扫描时间 */
  lastScanned?: string;
  /** 元数据 */
  metadata?: {
    version: string;
    sdkPath: string;
    enginePath: string;
  };
}

/**
 * 扫描配置
 */
export interface ScanConfig {
  /** SDK定义目录 */
  sdkPath: string;
  /** 文档目录 */
  docsPath: string;
  /** 示例代码目录 */
  samplesPath: string;
  /** 引擎实现目录 */
  enginePath: string;
  /** 输出数据文件 */
  outputPath: string;
}
