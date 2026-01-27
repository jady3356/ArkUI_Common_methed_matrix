const fs = require('fs');
const path = require('path');

console.log('=== 调试 Zeabur 部署路径 ===\n');

console.log('当前工作目录 (process.cwd()):', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

// 检查可能的静态文件路径
const possiblePaths = [
  path.join(process.cwd(), 'src/frontend/dist'),
  path.join(process.cwd(), 'dist/frontend/dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(__dirname, '../../src/frontend/dist'),
  path.join(__dirname, '../frontend/dist'),
];

console.log('检查可能的静态文件路径:');
possiblePaths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`  ${exists ? '✅' : '❌'} ${p}`);
  if (exists) {
    const files = fs.readdirSync(p);
    console.log(`     文件: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
  }
});

console.log('\n检查数据文件路径:');
const dataPaths = [
  path.join(process.cwd(), 'data/component_support_matrix.json'),
  path.join(process.cwd(), 'dist/data/component_support_matrix.json'),
];

dataPaths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`  ${exists ? '✅' : '❌'} ${p}`);
});

console.log('\n=== 调试完成 ===');
