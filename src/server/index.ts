import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { fs } from 'fs';
import { SupportMatrix } from '../types';

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, '../../data/component_support_matrix.json');

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加body大小限制到50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

/**
 * GET /api/matrix
 * 获取支持矩阵数据
 */
app.get('/api/matrix', (req, res) => {
  try {
    const data = readMatrixData();
    res.json(data);
  } catch (error) {
    console.error('读取数据失败:', error);
    res.status(500).json({ error: '读取数据失败' });
  }
});

/**
 * POST /api/matrix
 * 保存支持矩阵数据
 */
app.post('/api/matrix', (req, res) => {
  try {
    const data: SupportMatrix = req.body;

    // 简单验证
    if (!data.components || !data.commonProperties) {
      return res.status(400).json({ error: '数据格式不正确' });
    }

    writeMatrixData(data);

    res.json({
      success: true,
      message: '数据保存成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ error: '保存数据失败' });
  }
});

/**
 * POST /api/component/:name/property/:property
 * 更新单个属性的支持状态
 */
app.post('/api/component/:name/property/:property', (req, res) => {
  try {
    const { name, property } = req.params;
    const { isSupported, owner, notes } = req.body;

    const data = readMatrixData();

    if (!data.components[name]) {
      return res.status(404).json({ error: '组件不存在' });
    }

    if (!data.components[name].properties[property]) {
      return res.status(404).json({ error: '属性不存在' });
    }

    // 更新属性状态
    data.components[name].properties[property] = {
      ...data.components[name].properties[property],
      isSupported,
      owner: owner || data.components[name].properties[property].owner,
      notes: notes || data.components[name].properties[property].notes,
      source: 'manual',
      lastUpdated: new Date().toISOString()
    };

    writeMatrixData(data);

    res.json({
      success: true,
      message: '更新成功',
      data: data.components[name].properties[property]
    });
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * POST /api/component/:name/owner
 * 更新组件的 Owner
 */
app.post('/api/component/:name/owner', (req, res) => {
  try {
    const { name } = req.params;
    const { owner } = req.body;

    const data = readMatrixData();

    if (!data.components[name]) {
      return res.status(404).json({ error: '组件不存在' });
    }

    // 更新所有属性的owner
    for (const prop in data.components[name].properties) {
      data.components[name].properties[prop].owner = owner;
    }

    writeMatrixData(data);

    res.json({
      success: true,
      message: 'Owner更新成功'
    });
  } catch (error) {
    console.error('更新Owner失败:', error);
    res.status(500).json({ error: '更新Owner失败' });
  }
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * SPA fallback - 所有其他请求返回index.html
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

/**
 * 读取矩阵数据
 */
function readMatrixData(): SupportMatrix {
  const fs = require('fs');
  if (fs.existsSync(DATA_FILE)) {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  }

  // 返回空数据
  return {
    components: {},
    commonProperties: [],
    lastScanned: null,
    metadata: {
      version: '1.0.0',
      sdkPath: '',
      enginePath: ''
    }
  };
}

/**
 * 写入矩阵数据
 */
function writeMatrixData(data: SupportMatrix): void {
  const fs = require('fs');
  const dir = path.dirname(DATA_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 启动服务器
 */
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 数据文件: ${DATA_FILE}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});
