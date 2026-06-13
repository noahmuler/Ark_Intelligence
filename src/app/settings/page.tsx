"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Moon,
  Sun,
  Sparkles,
  Zap,
  Monitor,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const [mt5Connected, setMt5Connected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [serverName, setServerName] = useState("");
  const [accountLogin, setAccountLogin] = useState("");
  const [investorPassword, setInvestorPassword] = useState("");
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Convex mutations and actions
  const connectMT5 = useMutation(api.mt5.connectMT5);
  const disconnectMT5 = useMutation(api.mt5.disconnectMT5);
  const fetchTradeHistory = useAction(api.mt5Actions.fetchTradeHistory);
  const importTradesFromCSV = useAction(api.mt5Actions.importTradesFromCSV);

  // Load connection state from localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedConnection = localStorage.getItem("mt5Connected");
    const savedServerName = localStorage.getItem("mt5ServerName");
    const savedAccountLogin = localStorage.getItem("mt5AccountLogin");

    if (savedConnection === "true") {
      setMt5Connected(true);
      setServerName(savedServerName || "");
      setAccountLogin(savedAccountLogin || "");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const userId = "user-1"; // TODO: Get actual user ID from auth

      // Store connection in Convex
      await connectMT5({
        userId,
        serverName,
        accountLogin,
        investorPassword,
      });

      // Fetch trade history from MT5 API
      const result = await fetchTradeHistory({
        userId,
        serverName,
        accountLogin,
        investorPassword,
      });

      // Validate that fetch was successful
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch trade history");
      }

      // Handle case where no trades were found (non-fatal)
      if (result.tradesCount === 0) {
        console.warn("No trades found in the specified time range");
        alert("Warning: No trades found in the specified time range. Connection saved but no trades imported.");
      }

      // Persist to localStorage
      setMt5Connected(true);
      localStorage.setItem("mt5Connected", "true");
      localStorage.setItem("mt5ServerName", serverName);
      localStorage.setItem("mt5AccountLogin", accountLogin);
      setIsConnecting(false);
    } catch (error) {
      console.error("Failed to connect MT5 account:", error);
      setIsConnecting(false);
      alert(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      const userId = "user-1"; // TODO: Get actual user ID from auth

      // Disconnect from Convex
      await disconnectMT5({ userId });

      // Clear localStorage
      setMt5Connected(false);
      localStorage.removeItem("mt5Connected");
      localStorage.removeItem("mt5ServerName");
      localStorage.removeItem("mt5AccountLogin");
      setServerName("");
      setAccountLogin("");
      setInvestorPassword("");
    } catch (error) {
      console.error("Failed to disconnect MT5 account:", error);
    }
  };

  const handleCSVImport = async () => {
    let csvContent = csvData;

    // If file is selected, read its content
    if (csvFile) {
      try {
        csvContent = await csvFile.text();
      } catch (error) {
        alert("Failed to read CSV file");
        return;
      }
    }

    if (!csvContent.trim()) {
      alert("Please upload a CSV file or paste CSV data");
      return;
    }

    setIsImporting(true);
    try {
      const userId = "user-1"; // TODO: Get actual user ID from auth
      const result = await importTradesFromCSV({
        userId,
        csvData: csvContent,
      });

      if (result.success && result.tradesCount > 0) {
        alert(`Successfully imported ${result.tradesCount} trades`);
        setCsvData("");
        setCsvFile(null);

        // Create a connection record in Convex for CSV imports
        await connectMT5({
          userId,
          serverName: "CSV Import",
          accountLogin: "Imported",
          investorPassword: "",
        });

        setMt5Connected(true);
        localStorage.setItem("mt5Connected", "true");
        localStorage.setItem("mt5ServerName", "CSV Import");
        localStorage.setItem("mt5AccountLogin", "Imported");
      } else {
        alert(result.message || "No trades imported");
      }
    } catch (error) {
      console.error("Failed to import CSV:", error);
      alert(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvData(""); // Clear text area when file is selected
    }
  };

  const maskAccountNumber = (account: string) => {
    if (account.length <= 4) return "****";
    return "******" + account.slice(-4);
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-purple-300 text-sm sm:text-base">
              Configure your Ark Intelligence dashboard preferences and account settings
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Theme Settings */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mr-3">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Appearance</h2>
                </div>

                <div className="space-y-6">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-800/50">
                        <Moon className="h-4 w-4 text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Dark Mode</h3>
                        <p className="text-purple-400 text-sm">Toggle between light and dark themes</p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>

                  {/* Theme Preview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-900 to-black rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-gray-900 rounded-lg p-4 border border-gray-700 cursor-pointer transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="w-16 h-1 bg-gray-700 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-800 rounded mb-2"></div>
                        <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-100 to-white rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                      <div className="relative bg-white rounded-lg p-4 border border-gray-200 cursor-pointer transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="w-16 h-1 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-8 bg-gray-50 rounded mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-6">
              <div className="flex items-center mb-4">
                <Bell className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Price Alerts</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-700 transition-colors">
                    <span className="sr-only">Toggle price alerts</span>
                    <span className="inline-block h-4 w-4 rounded-full bg-purple-500 transition-transform translate-x-1"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">News Updates</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-700 transition-colors">
                    <span className="sr-only">Toggle news updates</span>
                    <span className="inline-block h-4 w-4 rounded-full bg-purple-500 transition-transform translate-x-1"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">AI Briefs</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-700 transition-colors">
                    <span className="sr-only">Toggle AI briefs</span>
                    <span className="inline-block h-4 w-4 rounded-full bg-purple-500 transition-transform translate-x-1"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-6">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Data Sources</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Finnhub API</span>
                  <input
                    type="password"
                    placeholder="API Key"
                    className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 w-32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Polygon API</span>
                  <input
                    type="password"
                    placeholder="API Key"
                    className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 w-32"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">OpenAI API</span>
                  <input
                    type="password"
                    placeholder="API Key"
                    className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 w-32"
                  />
                </div>
              </div>
            </div>

            {/* MT5 Connection */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-purple-900/90 backdrop-blur-xl rounded-2xl border border-purple-800/50 p-6 shadow-2xl">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">MT5 Connection</h2>
                </div>

                {!mt5Connected ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-purple-300 text-sm font-medium mb-2">
                        Broker Server Name
                      </label>
                      <input
                        type="text"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        placeholder="e.g., MetaQuotes-Demo"
                        className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2.5 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 placeholder-purple-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 text-sm font-medium mb-2">
                        Account Login
                      </label>
                      <input
                        type="number"
                        value={accountLogin}
                        onChange={(e) => setAccountLogin(e.target.value)}
                        placeholder="Account number"
                        className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2.5 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 placeholder-purple-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 text-sm font-medium mb-2">
                        Investor Password
                      </label>
                      <input
                        type="password"
                        value={investorPassword}
                        onChange={(e) => setInvestorPassword(e.target.value)}
                        placeholder="Investor password"
                        className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-2.5 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 placeholder-purple-400/50"
                      />
                    </div>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || !serverName || !accountLogin || !investorPassword}
                      className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect Account"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">MetaTrader 5 Connected</p>
                          <p className="text-purple-300 text-sm">Account: {maskAccountNumber(accountLogin)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDisconnect}
                        className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Disconnect
                      </button>
                      <button
                        onClick={handleDisconnect}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        Switch Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Free CSV Import */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-6">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Free CSV Import (Exness MT5)</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-800/50 rounded-lg p-4 border border-purple-700">
                  <h3 className="text-white font-medium mb-2">How to Export from Exness MT5:</h3>
                  <ol className="text-purple-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Open MT5 terminal and login to your Exness account (e.g., Exness-MT5Trial9)</li>
                    <li>Go to "Account History" tab at the bottom</li>
                    <li>Right-click anywhere in the history list</li>
                    <li>Select "Save as Detailed Report" or "Save as CSV"</li>
                    <li>Save the file to your computer</li>
                    <li>Upload the file directly below or paste the CSV content</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Upload CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full bg-purple-800 text-white text-sm rounded-lg px-4 py-3 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-700 file:text-white file:cursor-pointer"
                  />
                  {csvFile && (
                    <p className="text-green-400 text-sm mt-2">Selected: {csvFile.name}</p>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-purple-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-purple-900 text-purple-300">OR</span>
                  </div>
                </div>
                <div>
                  <label className="block text-purple-300 text-sm mb-2">Paste CSV Data</label>
                  <textarea
                    value={csvData}
                    onChange={(e) => {
                      setCsvData(e.target.value);
                      setCsvFile(null); // Clear file when text is pasted
                    }}
                    placeholder="Paste CSV data here (Exness format: Ticket,Symbol,Type,Lots,Open Price,Close Price,Open Time,Close Time,Profit,Commission,Swap)"
                    className="w-full h-32 bg-purple-800 text-white text-sm rounded-lg px-4 py-3 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 placeholder-purple-400"
                    disabled={!!csvFile}
                  />
                </div>
                <button
                  onClick={handleCSVImport}
                  disabled={isImporting || (!csvData.trim() && !csvFile)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Import CSV
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-6">
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Display</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Language</span>
                  <select className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Time Zone</span>
                  <select className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500">
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Currency Display</span>
                  <select className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-purple-900 rounded-lg border border-purple-800 p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-white">Security</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Two-Factor Auth</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-700 transition-colors">
                    <span className="sr-only">Toggle 2FA</span>
                    <span className="inline-block h-4 w-4 rounded-full bg-purple-500 transition-transform translate-x-1"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Session Timeout</span>
                  <select className="bg-purple-800 text-white text-sm rounded-lg px-3 py-2 border border-purple-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-center">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
