import { useState, useEffect } from "react";
import { healthCheck } from "../../utils/api";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function SupabaseTest() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus("loading");
      const response = await healthCheck();
      if (response.status === "ok") {
        setStatus("success");
        setMessage("Supabase backend is connected and running!");
      }
    } catch (error) {
      setStatus("error");
      setMessage(`Connection failed: ${error}`);
      console.error("Supabase connection error:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-3 rounded-lg border backdrop-blur-xl flex items-center gap-3 ${
          status === "success"
            ? "bg-green-500/10 border-green-500/30"
            : status === "error"
            ? "bg-red-500/10 border-red-500/30"
            : "bg-blue-500/10 border-blue-500/30"
        }`}
      >
        {status === "loading" && (
          <>
            <Loader className="text-blue-400 animate-spin" size={20} />
            <span className="text-sm">Connecting to Supabase...</span>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="text-green-400" size={20} />
            <span className="text-sm text-green-400">{message}</span>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="text-red-400" size={20} />
            <div>
              <span className="text-sm text-red-400 block">{message}</span>
              <button
                onClick={testConnection}
                className="text-xs text-blue-400 hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
