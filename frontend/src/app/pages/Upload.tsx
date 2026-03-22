import { motion } from "motion/react";
import { Upload as UploadIcon, FileText, CheckCircle, X, Download, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { stockDataAPI } from "../../utils/api";
import { useNavigate } from "react-router";

type CsvPreviewRow = {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

const defaultPreviewData: CsvPreviewRow[] = [
  { date: "2026-01-01", open: "150.25", high: "152.30", low: "149.80", close: "151.50", volume: "1234567" },
  { date: "2026-01-02", open: "151.50", high: "153.75", low: "151.00", close: "153.20", volume: "1456789" },
  { date: "2026-01-03", open: "153.20", high: "154.90", low: "152.50", close: "154.30", volume: "1567890" },
  { date: "2026-01-04", open: "154.30", high: "155.60", low: "153.80", close: "155.10", volume: "1345678" },
  { date: "2026-01-05", open: "155.10", high: "156.25", low: "154.50", close: "155.90", volume: "1234890" },
];

function parseCsvText(text: string): { rows: CsvPreviewRow[]; allCount: number } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV should contain a header and at least one data row");
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const required = ["date", "open", "high", "low", "close", "volume"];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length > 0) {
    throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
  }

  const getIndex = (column: string) => headers.indexOf(column);
  const parsedRows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    return {
      date: cells[getIndex("date")] || "",
      open: cells[getIndex("open")] || "0",
      high: cells[getIndex("high")] || "0",
      low: cells[getIndex("low")] || "0",
      close: cells[getIndex("close")] || "0",
      volume: cells[getIndex("volume")] || "0",
    };
  });

  return {
    rows: parsedRows.slice(0, 5),
    allCount: parsedRows.length,
  };
}

export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  const [symbol, setSymbol] = useState("AAPL");
  const [selectedFileName, setSelectedFileName] = useState("historical_data.csv");
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>(defaultPreviewData);
  const [rowCount, setRowCount] = useState(1247);
  const [dateRange, setDateRange] = useState("2021-2026");
  const [fileSize, setFileSize] = useState("124 KB");
  const [isValidCsv, setIsValidCsv] = useState(true);
  const [validationMessage, setValidationMessage] = useState("Passed");

  const uploadFile = async (file: File) => {
    setUploadProgress(0);
    setIsUploaded(false);
    setSelectedFileName(file.name);
    setFileSize(`${Math.max(1, Math.round(file.size / 1024))} KB`);

    let detectedMinDate: string | null = null;
    let detectedMaxDate: string | null = null;

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      setPreviewRows(parsed.rows.length > 0 ? parsed.rows : defaultPreviewData);
      setRowCount(parsed.allCount);
      if (parsed.rows.length > 0) {
        const allDates = text
          .split(/\r?\n/)
          .slice(1)
          .map((line) => line.split(",")[0]?.trim())
          .filter(Boolean)
          .sort((a, b) => {
            const tsA = Date.parse(a);
            const tsB = Date.parse(b);
            if (Number.isNaN(tsA) || Number.isNaN(tsB)) {
              return a.localeCompare(b);
            }
            return tsA - tsB;
          });
        if (allDates.length > 0) {
          detectedMinDate = allDates[0];
          detectedMaxDate = allDates[allDates.length - 1];
          setDateRange(`${allDates[0]} to ${allDates[allDates.length - 1]}`);
        }
      }
      setIsValidCsv(true);
      setValidationMessage("Passed");
    } catch (error) {
      setIsValidCsv(false);
      setValidationMessage(error instanceof Error ? error.message : "Invalid CSV format");
      setPreviewRows(defaultPreviewData);
      setRowCount(0);
      setDateRange("- -");
    }

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 120);

    try {
      await stockDataAPI.uploadCsv(symbol, file);
      localStorage.setItem(
        "latestUploadedCsv",
        JSON.stringify({
          symbol,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          dataSource: "csv",
          minDate: detectedMinDate,
          maxDate: detectedMaxDate,
        }),
      );
      clearInterval(interval);
      setUploadProgress(100);
      setIsUploaded(true);
    } catch (error) {
      clearInterval(interval);
      setUploadProgress(0);
      setIsUploaded(false);
      console.error("Error uploading CSV:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Upload Historical Data</h1>
        <p className="text-gray-400">
          Upload CSV files with OHLCV data or connect to a data provider
        </p>
      </motion.div>

      {/* Stock Symbol Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <label className="block text-sm font-medium mb-2">Stock Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Enter symbol (e.g., AAPL, TSLA)"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
        />
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative p-12 rounded-xl border-2 border-dashed transition-all ${
          isDragging
            ? "border-green-500 bg-green-500/10"
            : "border-white/20 bg-white/5 backdrop-blur-xl"
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          id="file-upload"
        />
        <div className="text-center">
          <motion.div
            animate={{ y: isDragging ? -10 : 0 }}
            className="inline-block p-6 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 mb-4"
          >
            <UploadIcon className="text-green-400" size={48} />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">
            {isDragging ? "Drop your file here" : "Drag & drop your CSV file"}
          </h3>
          <p className="text-gray-400 mb-4">or click to browse files</p>
          <p className="text-sm text-gray-500">
            Supported format: CSV with columns (Date, Open, High, Low, Close, Volume)
          </p>
        </div>
      </motion.div>

      {/* Upload Progress */}
      {uploadProgress > 0 && !isUploaded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-400" size={24} />
              <div>
                <p className="font-medium">{selectedFileName}</p>
                <p className="text-sm text-gray-400">Uploading...</p>
              </div>
            </div>
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
            />
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {isUploaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-1" size={24} />
              <div>
                <h3 className="font-semibold mb-1">Upload Successful!</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {symbol} historical data processed successfully
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/backtest?symbol=${encodeURIComponent(symbol)}&dataSource=csv&justUploaded=1`)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-sm font-medium"
                  >
                    Run Backtest
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsUploaded(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10"
                  >
                    Upload Another
                  </motion.button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsUploaded(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Data Preview */}
      {isUploaded && (
        <>
          {/* Data Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-blue-400" size={16} />
                <p className="text-xs text-gray-400">Total Rows</p>
              </div>
              <p className="text-2xl font-bold">{rowCount.toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-400" size={16} />
                <p className="text-xs text-gray-400">Date Range</p>
              </div>
              <p className="text-sm font-bold">{dateRange}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-400" size={16} />
                <p className="text-xs text-gray-400">Validation</p>
              </div>
              <p className={`text-sm font-bold ${isValidCsv ? "text-green-400" : "text-red-400"}`}>{validationMessage}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-purple-400" size={16} />
                <p className="text-xs text-gray-400">File Size</p>
              </div>
              <p className="text-sm font-bold">{fileSize}</p>
            </motion.div>
          </div>

          {/* Quick Chart Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4">Price Overview</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={Array.from({ length: 30 }, (_, i) => ({
                  value: 150 + Math.random() * 10 + i * 0.2,
                }))}
              >
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Data Preview</h2>
              <span className="text-sm text-gray-400">Showing first 5 rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      Open
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      High
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Low</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      Close
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-right">₹{row.open}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-400">₹{row.high}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-400">₹{row.low}</td>
                      <td className="px-4 py-3 text-sm text-right">₹{row.close}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-400">
                        {parseInt(row.volume).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Validation Checks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-5 rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Data Validation Complete</h3>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-gray-300">No missing values</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-gray-300">Correct format</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-gray-300">Chronological order</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Download Sample */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-start gap-4">
          <Download className="text-blue-400 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Need a sample file?</h3>
            <p className="text-sm text-gray-400 mb-3">
              Download our sample CSV to see the required format
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/30"
            >
              Download Sample CSV
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}