import axios from 'axios';

const baseURL = '/api';

export interface PropertySupport {
  isSupported: 'supported' | 'unsupported' | 'unknown';
  owner?: string;
  lastUpdated?: string;
  source?: 'auto' | 'manual';
  notes?: string;
}

export interface ComponentInfo {
  name: string;
  properties: Record<string, PropertySupport>;
}

export interface SupportMatrix {
  components: Record<string, ComponentInfo>;
  commonProperties: string[];
  lastScanned: string | null;
  metadata?: {
    version: string;
    sdkPath: string;
    enginePath: string;
  };
}

/**
 * 获取支持矩阵数据
 */
export async function getMatrix(): Promise<SupportMatrix> {
  const response = await axios.get<SupportMatrix>(`${baseURL}/matrix`);
  return response.data;
}

/**
 * 保存支持矩阵数据
 */
export async function saveMatrix(data: SupportMatrix): Promise<{ success: boolean; message: string }> {
  const response = await axios.post(`${baseURL}/matrix`, data);
  return response.data;
}

/**
 * 更新单个属性的支持状态
 */
export async function updateProperty(
  componentName: string,
  propertyName: string,
  data: Partial<PropertySupport>
): Promise<{ success: boolean; message: string; data: PropertySupport }> {
  const response = await axios.post(
    `${baseURL}/component/${componentName}/property/${propertyName}`,
    data
  );
  return response.data;
}

/**
 * 更新组件的 Owner
 */
export async function updateOwner(
  componentName: string,
  owner: string
): Promise<{ success: boolean; message: string }> {
  const response = await axios.post(`${baseURL}/component/${componentName}/owner`, { owner });
  return response.data;
}
