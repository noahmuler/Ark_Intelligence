"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  DollarSign,
  BarChart3,
  Activity
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  asset: string;
  type: "Bullish" | "Bearish" | "Neutral";
  severity: "Critical" | "High" | "Medium" | "Low";
  timestamp: Date;
  summary: string;
  keyPoints: string[];
  recommendation: string;
  confidence: number;
  analyst: string;
}

const mockReports: Report[] = [
  {
    id: "1",
    title: "USD Strength Breaking Key Resistance Levels",
    asset: "USD",
    type: "Bullish",
    severity: "Critical",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    summary: "US Dollar Index has broken through critical resistance at 105.50 with strong momentum. Technical indicators suggest continuation to 107.00-108.00 range. Fed policy remains supportive of stronger dollar.",
    keyPoints: [
      "Break above 105.50 resistance",
      "Strong bullish momentum confirmed",
      "Fed policy alignment supports upside",
      "Next targets: 107.00, 108.00"
    ],
    recommendation: "Consider long USD positions with stop at 105.20",
    confidence: 85,
    analyst: "AI Market Analysis"
  },
  {
    id: "2",
    title: "Oil Price Volatility Spike Detected",
    asset: "OIL",
    type: "Bearish",
    severity: "High",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    summary: "Crude oil prices showing unusual volatility with 3.2% intraday swing. Supply concerns from OPEC+ production cuts. Risk of continued downside to $75.00 if support at $78.50 fails.",
    keyPoints: [
      "Volatility spike: $82.30 high",
      "Key support level: $78.50",
      "OPEC+ production decisions crucial",
      "Risk level: High for short positions"
    ],
    recommendation: "Reduce oil exposure, hedge with defensive positions",
    confidence: 78,
    analyst: "Commodities Team"
  },
  {
    id: "3",
    title: "Gold Technical Pattern Formation",
    asset: "XAU",
    type: "Neutral",
    severity: "Medium",
    timestamp: new Date(Date.now() - 120 * 60 * 1000),
    summary: "Gold forming potential head and shoulders pattern on 4-hour chart. Key resistance at $2,380.00, support at $2,320.00. Break above $2,400 could trigger significant upside move. Correlation with USD weakening.",
    keyPoints: [
      "Head and shoulders pattern forming",
      "Resistance: $2,380.00 (critical)",
      "Support: $2,320.00 (strong)",
      "Breakout level: $2,400.00",
      "USD correlation strengthening"
    ],
    recommendation: "Monitor for breakout above $2,380.00",
    confidence: 72,
    analyst: "Technical Analysis Team"
  },
  {
    id: "4",
    title: "Silver Outperforming Gold",
    asset: "XAG",
    type: "Bullish",
    severity: "Medium",
    timestamp: new Date(Date.now() - 180 * 60 * 1000),
    summary: "Silver showing relative strength vs gold with XAU/XAG ratio improving. Industrial demand supporting silver prices. Technical breakout above $29.00 could target $30.50. Silver-to-gold ratio at 1:85 favors silver accumulation.",
    keyPoints: [
      "Silver outperforming gold +2.3%",
      "XAU/XAG ratio: 1:85",
      "Key resistance: $29.00",
      "Industrial demand supporting prices",
      "Target: $30.50 on breakout"
    ],
    recommendation: "Consider silver long positions, monitor XAU/XAG ratio",
    confidence: 68,
    analyst: "Metals Analysis Team"
  }
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const filteredReports = filter === "All" 
    ? mockReports 
    : mockReports.filter(report => report.asset === filter);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-rose-500/20 text-rose-400 border-rose-400";
      case "High": return "bg-amber-500/20 text-amber-400 border-amber-400";
      case "Medium": return "bg-purple-500/20 text-purple-400 border-purple-400";
      case "Low": return "bg-emerald-500/20 text-emerald-400 border-emerald-400";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Bullish": return "text-emerald-400";
      case "Bearish": return "text-rose-400";
      default: return "text-purple-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Bullish": return <TrendingUp className="h-4 w-4" />;
      case "Bearish": return <TrendingDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reports</h1>
            <p className="text-purple-300 text-sm sm:text-base">
              Critical market analysis and AI-generated reports with actionable insights
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-purple-300 text-sm">Filter by Asset:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "USD", "OIL", "XAU", "XAG"].map((asset) => (
                <button
                  key={asset}
                  onClick={() => setFilter(asset)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    filter === asset
                      ? "bg-purple-600 text-white"
                      : "bg-purple-800 text-purple-300 hover:bg-purple-700 hover:text-white"
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                className="bg-purple-900 rounded-lg border border-purple-800 p-6 hover:border-purple-600 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                {/* Report Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${getTypeColor(report.type)}`}>
                      {report.type}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 text-xs">{report.asset}</span>
                    <span className="text-purple-300 text-xs">{report.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Report Title */}
                <h3 className="text-lg font-semibold text-white mb-3">{report.title}</h3>

                {/* Report Summary */}
                <p className="text-purple-200 text-sm mb-4 leading-relaxed">{report.summary}</p>

                {/* Key Points */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">Key Points</h4>
                  <ul className="space-y-2">
                    {report.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-400 text-xs mr-2">•</span>
                        <span className="text-purple-200 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Report Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-purple-800">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-purple-300 text-sm">AI Confidence: {report.confidence}%</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-purple-400 mr-2" />
                      <span className="text-purple-300 text-sm">{report.analyst}</span>
                    </div>
                  </div>
                  <button className="flex items-center text-purple-300 hover:text-white text-sm transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
