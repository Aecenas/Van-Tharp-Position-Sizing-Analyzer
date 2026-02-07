# Van Tharp Position Sizing Analyzer

一个基于 Van Tharp 的 R-Multiple 理论和蒙特卡洛模拟的交易系统分析工具，帮助交易者评估系统期望收益、风险控制和最优仓位管理。

![Van Tharp Analyzer](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 功能特性

### 双模式数据输入
- **频率模式 (Frequency Mode)**: 输入不同 R 值的分布频率，适合理论系统分析
- **原始盈亏模式 (Raw PnL Mode)**: 直接粘贴历史交易盈亏数据，自动计算 R 单位

### 核心系统指标
- **胜率 (Win Rate)**: 盈利交易占比
- **盈亏比 (Profit Factor)**: 平均盈利/平均亏损
- **期望值 (Expectancy)**: 每笔交易的期望收益
- **系统质量数 (SQN)**: 基于 Van Tharp 的系统质量评估
- **标准差 (Standard Deviation)**: 收益波动性

### 蒙特卡洛模拟
运行 10,000+ 次模拟，分析：
- 最大回撤分布 (Max Drawdown)
- 最大盈利分布 (Max Profit)
- 最终收益分布 (Final Result)
- 最大连续亏损/盈利次数
- 回撤持续时间

### 最优仓位计算 (Optimal F)
通过遍历不同风险比例 (0.1% - 30%)，找到：
- 最佳平均收益仓位
- 最佳中位数收益仓位
- 最高成功率仓位
- 最低爆仓风险仓位

支持两种风险模式：
- **固定分数法 (Fixed Fractional)**: 基于当前权益的百分比
- **固定初始法 (Fixed Initial)**: 基于初始权益的百分比

### 风险相关性控制
支持多品种/多策略组合风险评估：
- 强相关 (0.9)
- 中等相关 (0.5)
- 弱相关 (0.1)
- 部分对冲 (-0.5)
- 强力对冲 (-0.8)

### 数据导入导出
- 支持 Excel (.xlsx) 导入/导出
- 支持截图保存分析结果
- 内置多种预设模板（彩票、趋势跟踪等）

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **图表**: Recharts
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **Excel 处理**: SheetJS (xlsx)
- **截图**: html2canvas

## 快速开始

### 环境要求
- Node.js 18+

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 使用指南

### 1. 输入交易数据

**频率模式示例**:
| 次数 | R 值 |
|------|------|
| 5    | -1   |
| 3    | 2    |
| 2    | 5    |

**原始盈亏模式示例**:
```
-100
150
-50
200
-75
300
...
```

### 2. 配置模拟参数
- 模拟次数: 建议 10,000 次
- 每笔模拟交易数: 建议 100 笔

### 3. 运行模拟
点击"运行模拟"按钮，系统将生成：
- 系统质量评估
- 风险指标分析
- 收益分布图表
- 资金曲线展示

### 4. 最优仓位分析
在"最优仓位分析"标签页中：
1. 设置成功/失败阈值（如翻倍/亏损 25%）
2. 选择风险计算模式
3. 运行分析，查看最佳仓位建议

## R-Multiple 理论简介

R-Multiple 是 Van Tharp 提出的交易评估方法：
- **1R** = 单笔交易的初始风险（平均亏损金额）
- 盈利 = 盈利金额 / 1R
- 亏损 = 亏损金额 / 1R（通常为 -1）

这种方法统一了不同资金规模的交易评估标准。

## 项目结构

```
Van-Tharp-Position-Sizing-Analyzer/
├── App.tsx                 # 主应用组件
├── index.tsx               # 入口文件
├── types.ts                # TypeScript 类型定义
├── components/
│   ├── InputSection.tsx    # 数据输入面板
│   └── Dashboard.tsx       # 分析结果仪表盘
├── utils/
│   └── calculations.ts     # 核心计算逻辑
├── index.html              # HTML 模板
├── vite.config.ts          # Vite 配置
└── tsconfig.json           # TypeScript 配置
```

## 核心算法

### 蒙特卡洛模拟
```typescript
for (let i = 0; i < totalSimulations; i++) {
  for (let t = 0; t < tradesPerSimulation; t++) {
    const r = pool[randomIndex]; // 随机抽样
    currentEquity += r;
    // 跟踪最大回撤、连续亏损等指标
  }
}
```

### 最优 F 计算
遍历风险比例 f (0.1% - 30%)，对每个 f 运行模拟：
- 计算成功率、爆仓率
- 计算平均收益、中位数收益
- 选择最优的 f 值

## 许可证

MIT License

## 致谢

- [Van K. Tharp](https://www.vantharp.com/) - 交易系统分析理论
- [Recharts](https://recharts.org/) - 图表库
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
