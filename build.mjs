import { context } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import path from 'node:path';

// 定义项目路径，让脚本更健壮
const publicDir = path.resolve(import.meta.dirname, 'public');
const distDir = path.resolve(publicDir, 'dist');
const srcDir = path.resolve(import.meta.dirname, 'src');
const tsconfDir = path.resolve(import.meta.dirname, 'tsconfig.json');

// 使用 esbuild 进行构建
const ctx = await context({
  // 入口文件：我们的主逻辑和设置页面逻辑
  entryPoints: [
    path.resolve(srcDir, 'index.ts'),
    path.resolve(srcDir, 'css/index.scss')
  ],
  // 输出目录
  outdir: distDir,
  // 打包所有依赖
  bundle: true,
  // 启用 ES 模块格式
  format: 'esm',
  // 应用插件
  plugins: [
    // Sass 插件，自动将 .scss 文件编译为 CSS
    sassPlugin(),
  ],
  // 根据命令行参数决定是否压缩代码
  minify: process.argv.includes('--minify'),
  // 生成 Source Map，方便调试
  sourcemap: true,
  // 日志级别
  logLevel: 'info',
  // tsconfig.json 路径
  tsconfig: tsconfDir,
});

if (process.argv.includes('--serve')) {
  await ctx.serve({
    host: '127.0.0.1',
    port: 8000,
    servedir: publicDir,
  });
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
