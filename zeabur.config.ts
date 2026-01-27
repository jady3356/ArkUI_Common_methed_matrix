// Zeabur 部署配置
export default {
  // 项目名称
  name: 'arkui-support-matrix',

  // 服务配置
  services: [
    {
      // 服务类型：预构建模板
      type: 'prebuilt',

      // 服务名称
      name: 'web',

      // 构建命令
      buildCommand: 'npm run build',

      // 启动命令
      startCommand: 'npm start',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },

      // 需要部署的目录
      outputs: {
        // 静态文件目录
        static: 'dist',
      },
    },
  ],
};
