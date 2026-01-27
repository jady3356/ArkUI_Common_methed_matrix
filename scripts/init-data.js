const fs = require('fs');
const path = require('path');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据文件
const dataFile = path.join(dataDir, 'component_support_matrix.json');

if (!fs.existsSync(dataFile)) {
  const initialData = {
    components: {},
    commonProperties: [],
    lastScanned: undefined,
    metadata: {
      version: '1.0.0',
      sdkPath: '',
      enginePath: ''
    }
  };

  fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  console.log('✅ 数据文件初始化成功');
} else {
  console.log('✅ 数据文件已存在');
}
