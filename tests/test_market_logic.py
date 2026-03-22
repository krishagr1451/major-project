import unittest
from unittest.mock import patch
import pandas as pd

import app


class MarketLogicTests(unittest.TestCase):
    def test_infer_exchange(self):
        self.assertEqual(app.infer_exchange("RELIANCE.NS"), "nse")
        self.assertEqual(app.infer_exchange("RELIANCE.BO"), "bse")
        self.assertEqual(app.infer_exchange("AAPL"), "us")
        self.assertEqual(app.infer_exchange("AAPL", "nse"), "nse")

    def test_exchange_candidates(self):
        self.assertEqual(app.exchange_candidates("AAPL"), ["us", "nse", "bse"])
        self.assertEqual(app.exchange_candidates("RELIANCE.NS"), ["nse", "bse", "us"])

    @patch("app.persist_ohlcv_to_csv")
    @patch("app.yfinance_ohlcv")
    @patch("app.twelvedata_call")
    def test_load_market_ohlcv_falls_back_to_yfinance(self, mock_td, mock_yf, mock_persist):
        mock_td.side_effect = ValueError("Twelve Data error 429")

        idx = pd.to_datetime(["2026-01-01", "2026-01-02"])
        mock_yf.return_value = pd.DataFrame(
            {
                "Open": [100.0, 101.0],
                "High": [102.0, 103.0],
                "Low": [99.0, 100.0],
                "Close": [101.0, 102.0],
                "Volume": [1000.0, 1200.0],
            },
            index=idx,
        )

        df, source = app.load_market_ohlcv("AAPL", "2026-01-01", "2026-01-02", exchange="us", resolution="D")

        self.assertEqual(source, "yfinance")
        self.assertEqual(len(df), 2)
        self.assertTrue(mock_yf.called)
        self.assertTrue(mock_persist.called)


if __name__ == "__main__":
    unittest.main()
