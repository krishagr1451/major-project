import { motion } from "motion/react";
import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { portfoliosAPI } from "../../utils/api";
import { loadPortfolios, savePortfolios, type PortfolioColor } from "../../utils/portfolios";

const colors: PortfolioColor[] = ["green", "blue", "purple"];

export default function AddPortfolio() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  const handleCreate = async () => {
    const portfolioName = name.trim();
    if (!portfolioName) {
      toast.error("Enter a portfolio name");
      return;
    }

    const existing = loadPortfolios();
    if (existing.some((portfolio) => portfolio.name.toLowerCase() === portfolioName.toLowerCase())) {
      toast.error("Portfolio with this name already exists");
      return;
    }

    const color = colors[existing.length % colors.length];

    const next = [
      {
        id: crypto.randomUUID(),
        name: portfolioName,
        color,
        holdings: [],
        createdAt: new Date().toISOString(),
      },
      ...existing,
    ];

    savePortfolios(next);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Login required to save portfolios to Supabase");
      return;
    }

    try {
      await portfoliosAPI.sync(next);
      toast.success("Portfolio created");
      navigate("/portfolio");
    } catch {
      toast.error("Failed to save portfolio to Supabase");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Add Portfolio</h1>
          <button
            onClick={() => navigate("/portfolio")}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Create a new portfolio to group your stocks</p>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Portfolio Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Long-Term Core"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => navigate("/portfolio")}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSave}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            Create Portfolio
          </button>
        </div>
      </motion.div>
    </div>
  );
}
