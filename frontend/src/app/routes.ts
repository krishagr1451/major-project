import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Backtest from "./pages/Backtest";
import Results from "./pages/Results";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Strategies from "./pages/Strategies";
import Portfolio from "./pages/Portfolio";
import AddSymbol from "./pages/AddSymbol";
import AddPortfolio from "./pages/AddPortfolio";
import AddPortfolioStock from "./pages/AddPortfolioStock";
import PortfolioHoldings from "./pages/PortfolioHoldings";
import StockDetails from "./pages/StockDetails";
import Comparison from "./pages/Comparison";
import Scanner from "./pages/Scanner";
import Alerts from "./pages/Alerts";
import Optimizer from "./pages/Optimizer";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "portfolio", Component: Portfolio },
      { path: "portfolio/add-symbol", Component: AddSymbol },
      { path: "portfolio/add-portfolio", Component: AddPortfolio },
      { path: "portfolio/:portfolioId/add-stock", Component: AddPortfolioStock },
      { path: "portfolio/:portfolioId/holdings", Component: PortfolioHoldings },
      { path: "portfolio/stock/:symbol", Component: StockDetails },
      { path: "upload", Component: Upload },
      { path: "backtest", Component: Backtest },
      { path: "results", Component: Results },
      { path: "comparison", Component: Comparison },
      { path: "insights", Component: Insights },
      { path: "scanner", Component: Scanner },
      { path: "alerts", Component: Alerts },
      { path: "optimizer", Component: Optimizer },
      { path: "strategies", Component: Strategies },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);