# 📊 Van Tharp Position Sizing Analyzer

![Version](https://img.shields.io/badge/version-1.0.0-indigo)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

> **"We don't trade the markets, we trade our beliefs about the markets." — Dr. Van K. Tharp**

A powerful, offline-capable web application designed for quantitative traders and system developers. It leverages **Van Tharp's R-Multiple concepts** and **Monte Carlo simulations** to analyze trading system expectancy, evaluate risk, and optimize position sizing strategies.

---

## 🌟 Key Features

### 1. Dual Input Modes
- **Frequency Distribution (Scenario Mode):** Manually define your system's edge by entering counts of R-multiples (e.g., "5 trades of -1R", "2 trades of 5R"). Includes fun presets like "Welfare Lottery" or "Trend Following".
- **Raw P&L Import:** Paste a list of raw dollar profit/loss amounts (from Excel/CSV). The app automatically calculates your 1R unit (based on average loss) and converts data into R-Multiples.

### 2. Deep System Analysis
- **SQN® (System Quality Number):** automatically calculated with visual grading (Poor to Super System).
- **Expectancy & Standard Deviation:** Mathematical breakdown of your system's reliability.
- **Confidence Intervals:** 1σ, 2σ, and 3σ projections for future trade expectations.

### 3. Advanced Monte Carlo Simulation
- Runs **10,000+ simulations** to generate probability cones.
- **Visualizers:**
  - 📉 **Max Drawdown:** Histogram distribution of potential worst-case scenarios.
  - 📈 **Equity Curves:** Visualizes Best, Worst, Average, and Max Drawdown paths.
  - 🎲 **Streak Analysis:** Probability of consecutive wins and losses.
- **Risk Metrics:** Calculates "Probability of Ruin" and "95% Drawdown Duration".

### 4. Position Sizing & Risk Management
- **Portfolio Heat:** Calculates the maximum recommended total risk exposure based on system quality and survival constraints.
- **Optimal F (Kelly-style):** Iterative analysis to find the geometric growth optimal risk percentage.
- **Correlation Matrix Pruning:** An advanced widget to allocate risk across multiple assets using a "Dual-Constraint Pruning" algorithm to handle correlations and hedging.

### 5. Utilities
- **Excel Import/Export:** Save your distribution data or analysis results.
- **Screenshot:** One-click export of the dashboard analysis to a PNG image.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

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

4. Open your browser to `http://localhost:3000` (or the port shown in your terminal).

---

## 📚 Concepts Explained

### What is R?
**R** stands for **Risk**. It is the amount of money you are willing to lose on a single trade (Initial Risk).
- If you risk $100 and lose $100, that is a **-1R** trade.
- If you risk $100 and make $300, that is a **+3R** trade.

### What is SQN?
The **System Quality Number (SQN)** measures the relationship between your expectancy (average R) and the standard deviation of your R-multiples.
- **SQN < 1.0**: Hard to trade (likely unprofitable).
- **SQN 2.0 - 3.0**: Good system.
- **SQN > 5.0**: Holy Grail / Super system.

### Monte Carlo Simulation
Historical backtests show only *one* sequence of trades. Monte Carlo simulation shuffles your trades thousands of times to show *what could happen* if the order of wins and losses changes. This helps identify if a system is robust or just lucky.

---

## 🛠️ Technology Stack

- **Frontend Framework:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charting:** Recharts
- **Icons:** Lucide React
- **Data Handling:** XLSX (SheetJS)
- **Export:** html2canvas

---

## 📂 Project Structure

```text
/
├── components/
│   ├── InputSection.tsx    # Left sidebar for data entry and config
│   └── Dashboard.tsx       # Main visualization area (Charts, Metrics, Widgets)
├── utils/
│   └── calculations.ts     # Core math logic (Monte Carlo, Optimal F, Stats)
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application entry
├── index.html              # HTML entry point
└── ...
```

---

## 🧠 Risk Management Algorithms

The app features a sophisticated **Risk Allocation Widget** (`Dashboard.tsx`) that solves the problem of how much risk to assign to correlated assets.

**Logic:**
1. **Initialize:** Start with max risk per asset.
2. **Dual-Constraint Check:** It monitors both *Total Nominal Exposure* and *Portfolio Volatility*.
3. **Smart Pruning:** If limits are exceeded, it iteratively reduces position sizes. It prioritizes cutting assets that contribute most to risk while preserving "hedge" positions (negatively correlated assets).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ by Ain</sub>
</div>
