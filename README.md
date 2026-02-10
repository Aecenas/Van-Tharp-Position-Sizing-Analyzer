<div align="center">

# 📊 Van Tharp Position Sizing Analyzer

![Version](https://img.shields.io/badge/version-1.0.0-indigo)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

**[ English ](#-english) | [ 简体中文 ](#-简体中文)**

</div>

---

<a id="-english"></a>

## 🇬🇧 English

> **"We don't trade the markets, we trade our beliefs about the markets." — Dr. Van K. Tharp**

A powerful web application designed for quantitative traders and system developers. It leverages **Van Tharp's R-Multiple concepts** and **Monte Carlo simulations** to analyze trading system expectancy, evaluate risk, and optimize position sizing strategies.

### 🌟 Key Features

#### 1. Dual Input Modes
- **Frequency Distribution (Scenario Mode):** Manually define your system's edge by entering counts of R-multiples (e.g., "5 trades of -1R", "2 trades of 5R"). Includes fun presets like "Welfare Lottery" or "Trend Following".
- **Raw P&L Import:** Paste a list of raw dollar profit/loss amounts (from Excel/CSV). The app automatically calculates your 1R unit (based on average loss) and converts data into R-Multiples.

#### 2. Deep System Analysis
- **SQN® (System Quality Number):** automatically calculated with visual grading (Poor to Super System).
- **Expectancy & Standard Deviation:** Mathematical breakdown of your system's reliability.
- **Confidence Intervals:** 1σ, 2σ, and 3σ projections for future trade expectations.

#### 3. Advanced Monte Carlo Simulation
- Runs **10,000+ simulations** to generate probability cones.
- **Visualizers:**
  - 📉 **Max Drawdown:** Histogram distribution of potential worst-case scenarios.
  - 📈 **Equity Curves:** Visualizes Best, Worst, Average, and Max Drawdown paths.
  - 🎲 **Streak Analysis:** Probability of consecutive wins and losses.
- **Risk Metrics:** Calculates "Probability of Profit", "Reward/Risk Ratio", and "95% Drawdown Duration".

#### 4. Position Sizing & Risk Management
- **Portfolio Heat:** Calculates the maximum recommended total risk exposure based on system quality and survival constraints.
- **Optimal F (Kelly-style):** Iterative analysis to find the geometric growth optimal risk percentage.
- **Correlation Matrix Pruning:** An advanced widget to allocate risk across multiple assets using a "Dual-Constraint Pruning" algorithm to handle correlations and hedging.

#### 5. Utilities
- **Excel Import/Export:** Save your distribution data or analysis results.
- **Screenshot:** One-click export of the dashboard analysis to a PNG image.

### 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/van-tharp-analyzer.git
   cd van-tharp-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

### 🛠️ Technology Stack

- **Frontend Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charting:** Recharts
- **Icons:** Lucide React
- **Data Processing:** SheetJS (xlsx)
- **Export:** html2canvas

### 🧠 Algorithms

The app features a sophisticated **Risk Allocation Widget** (`Dashboard.tsx`) that solves the problem of how much risk to assign to correlated assets.

**Logic:**
1. **Initialize:** Start with max risk per asset.
2. **Dual-Constraint Check:** It monitors both *Total Nominal Exposure* and *Portfolio Volatility*.
3. **Smart Pruning:** If limits are exceeded, it iteratively reduces position sizes. It prioritizes cutting assets that contribute most to risk while preserving "hedge" positions (negatively correlated assets).

---

<br/>

<a id="-简体中文"></a>

## 🇨🇳 简体中文

> **"我们交易的并非市场本身，而是我们对市场的认知。" — 范·K·萨普博士 (Dr. Van K. Tharp)**

一款专为量化交易者和系统开发者设计的离线 Web 应用程序。它利用 **R 倍数 (R-Multiples)** 概念和 **蒙特卡洛模拟 (Monte Carlo Simulations)**，帮助您分析交易系统的数学期望、评估潜在风险，并寻找最优的头寸规模策略。

### 🌟 核心功能

#### 1. 双重输入模式
- **频率分布 (场景模式):** 手动输入不同盈亏倍数的发生次数来定义系统优势（例如：“5笔 -1R 交易”，“2笔 5R 交易”）。内置多种趣味预设，如“福利彩票型”或“趋势跟踪型”。
- **原始盈亏导入 (Raw P&L):** 直接粘贴 Excel/CSV 中的原始盈亏金额（如 -150, 300, ...）。系统会自动根据平均亏损计算您的 **1R 风险单位**，并将金额转换为 R 倍数进行分析。

#### 2. 深度系统分析
- **SQN® (系统质量评分):** 自动计算并进行可视化评级（从“难以交易”到“圣杯系统”）。
- **数学期望与标准差:** 拆解系统的稳定性与盈利能力。
- **置信区间:** 提供未来交易表现的 1σ, 2σ, 和 3σ 概率区间预测。

#### 3. 高级蒙特卡洛模拟
- 快速运行 **10,000+ 次模拟**，生成概率锥。
- **可视化图表:**
  - 📉 **最大回撤分布:** 直方图展示潜在的最坏回撤情况。
  - 📈 **权益曲线:** 包含最优、最差、平均以及最大回撤路径的模拟曲线。
  - 🎲 **连胜/连败分析:** 连续亏损或盈利的概率统计。
- **风险指标:** 计算“盈利概率 (Probability of Profit)”、“回报/风险比 (Reward/Risk)”及“95%置信度下的回撤恢复期”。

#### 4. 头寸规模与风控
- **组合热度 (Portfolio Heat):** 基于系统质量 (SQN) 和生存约束，计算账户建议的最大总风险敞口。
- **最优 F 值 (Optimal F):** 类似凯利公式的迭代分析，寻找几何增长最优的风险百分比。
- **相关性矩阵剪枝:** 一个高级的交互式组件。利用“双重约束剪枝算法”，在考虑资产相关性（如对冲）的情况下，将总风险额度科学地分配给多个资产。

#### 5. 实用工具
- **Excel 导入/导出:** 保存您的分布数据或导出分析结果。
- **一键截图:** 将仪表盘分析结果导出为高清 PNG 图片，便于分享。

### 🚀 快速开始

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/van-tharp-analyzer.git
   cd van-tharp-analyzer
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动本地服务器**
   ```bash
   npm run dev
   ```
   然后打开浏览器访问 `http://localhost:3000`。

### 🛠️ 技术栈

- **前端框架:** React 19
- **开发语言:** TypeScript
- **样式方案:** Tailwind CSS
- **图表库:** Recharts
- **图标组件:** Lucide React
- **数据处理:** SheetJS (xlsx)
- **导出工具:** html2canvas

### 📚 核心概念解释

#### 什么是 R (Risk)?
**R** 代表 **初始风险 (Initial Risk)**。它是您在单笔交易中愿意承受的最大损失金额。
- 如果您计划承担 $100 的风险，结果亏损了 $100，这是一笔 **-1R** 的交易。
- 如果您承担 $100 风险，最终盈利 $300，这是一笔 **+3R** 的交易。
- 这种标准化方法让您可以横向比较不同价格、不同波动率的交易品种。

#### 什么是 SQN?
**系统质量评分 (System Quality Number)** 衡量的是系统期望收益与波动率之间的关系。
- **SQN < 1.0**: 系统很难盈利。
- **SQN 2.0 - 3.0**: 优秀的系统。
- **SQN > 5.0**: 超级系统 (圣杯)。

#### 什么是蒙特卡洛模拟?
历史回测只展示了过去发生的**一种**特定路径。蒙特卡洛模拟通过将您的交易记录打乱并重新排列数万次，展示**可能发生**的所有情况。这能帮您识别系统是由于运气好才盈利，还是真的具有鲁棒性。

### 🧠 风控算法

本项目内置了一个复杂的 **风险分配 (Risk Allocation)** 算法 (`Dashboard.tsx`)，用于解决多资产配置问题。

**算法逻辑 (双重约束智能剪枝):**
1. **初始化:** 假设所有资产都满仓（达到单笔风险上限）。
2. **双重监控:** 算法同时计算当前的 **名义总敞口** 和 **组合波动率风险**。
3. **智能剪枝:** 如果任一指标超标，算法会迭代减少仓位。它会优先削减那些对整体风险贡献最大的资产，同时保护那些能提供对冲效果（负相关）的资产权重。

---

## 🤝 Contributing / 贡献

欢迎提交 Issue 或 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 License

MIT License.

---

<div align="center">
  <sub>Built with ❤️ by Ain</sub>
</div>
