"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMutation, useAction, useQuery } from "convex/react";
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
  KeyRound,
  RefreshCw,
  LockKeyhole,
} from "lucide-react";

export default function Settings() {
  const [syncSetup, setSyncSetup] = useState<{ endpoint: string; token: string } | null>(null);
  const [syncSetupError, setSyncSetupError] = useState("");
  const [syncTokenCopied, setSyncTokenCopied] = useState(false);
  const [syncTokenVisible, setSyncTokenVisible] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [exnessApiKey, setExnessApiKey] = useState("");
  const [exnessPrivateKey, setExnessPrivateKey] = useState("");
  const [exnessAccountId, setExnessAccountId] = useState("");
  const [exnessGateway, setExnessGateway] = useState("");
  const [exnessBusy, setExnessBusy] = useState(false);
  const [exnessError, setExnessError] = useState("");
  const [exnessMessage, setExnessMessage] = useState("");

  // Convex mutations and actions
  const connectMT5 = useMutation(api.mt5.connectMT5);
  const disconnectMT5 = useMutation(api.mt5.disconnectMT5);
  const importTradesFromCSV = useAction(api.mt5Actions.importTradesFromCSV);
  const connection = useQuery(api.mt5.getMT5Connection, { userId: "user-1" });
  const exnessConnection = useQuery(api.exness.getConnection, { userId: "user-1" });
  const exnessConnected = exnessConnection?.isConnected ?? false;
  const exnessConfigured = exnessConnection?.isConfigured ?? false;
  const mt5Connected =
    (connection?.isConnected ?? false) &&
    (connection?.method === "mt5" || connection?.method === undefined);

  const handleExnessConnect = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setExnessBusy(true);
    setExnessError("");
    setExnessMessage("");
    try {
      const response = await fetch("/api/exness/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: exnessApiKey,
          privateKey: exnessPrivateKey,
          accountId: exnessAccountId,
          discoveryBaseUrl: exnessGateway,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not connect Exness API";
        throw new Error(message);
      }

      setExnessApiKey("");
      setExnessPrivateKey("");
      setExnessMessage("Exness account connected. Account history will sync every minute.");
    } catch (error) {
      setExnessError(error instanceof Error ? error.message : "Could not connect Exness API");
    } finally {
      setExnessBusy(false);
    }
  };

  const handleExnessSync = async () => {
    setExnessBusy(true);
    setExnessError("");
    setExnessMessage("");
    try {
      const response = await fetch("/api/exness/sync", { method: "POST" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not sync Exness account";
        throw new Error(message);
      }
      setExnessMessage("Exness account history synced.");
    } catch (error) {
      setExnessError(error instanceof Error ? error.message : "Could not sync Exness account");
    } finally {
      setExnessBusy(false);
    }
  };

  const handleExnessDisconnect = async () => {
    setExnessBusy(true);
    setExnessError("");
    setExnessMessage("");
    try {
      const response = await fetch("/api/exness/disconnect", { method: "POST" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not disconnect Exness API";
        throw new Error(message);
      }
      setExnessMessage("Exness API credentials removed.");
    } catch (error) {
      setExnessError(error instanceof Error ? error.message : "Could not disconnect Exness API");
    } finally {
      setExnessBusy(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mt5/sync", { signal: controller.signal })
      .then(async (response) => {
        const result: unknown = await response.json();
        if (
          !response.ok ||
          typeof result !== "object" ||
          result === null ||
          !("endpoint" in result) ||
          typeof result.endpoint !== "string" ||
          !("token" in result) ||
          typeof result.token !== "string"
        ) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "Could not load local MT5 sync settings";
          throw new Error(message);
        }
        setSyncSetup({ endpoint: result.endpoint, token: result.token });
        setSyncSetupError("");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSyncSetupError(error instanceof Error ? error.message : "Could not load local MT5 sync settings");
      });

    return () => controller.abort();
  }, []);

  const handleCopySyncToken = async () => {
    if (!syncSetup) return;
    try {
      await navigator.clipboard.writeText(syncSetup.token);
      setSyncTokenCopied(true);
      window.setTimeout(() => setSyncTokenCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy MT5 sync key:", error);
      alert("Could not copy the sync key. Show it to copy it manually.");
    }
  };

  const handleDisconnect = async () => {
    try {
      const userId = "user-1"; // TODO: Get actual user ID from auth

      // Disconnect from Convex
      await disconnectMT5({ userId });

      localStorage.removeItem("mt5Connected");
      localStorage.removeItem("mt5ServerName");
      localStorage.removeItem("mt5AccountLogin");
    } catch (error) {
      console.error("Failed to disconnect MT5 account:", error);
      alert(`Failed to disconnect: ${error instanceof Error ? error.message : "Unknown error"}`);
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
          method: "csv",
        });

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

            {/* Exness API Connection */}
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-40 blur transition duration-300 group-hover:opacity-60"></div>
              <div className="relative rounded-2xl border border-emerald-700/60 bg-purple-900/95 p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500">
                      <KeyRound className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Exness Africa API</h2>
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                        Recommended · Read-only account sync
                      </p>
                    </div>
                  </div>
                  {exnessConnected && (
                    <span className="flex items-center gap-1 rounded-full bg-green-900/50 px-2.5 py-1 text-xs text-green-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Connected
                    </span>
                  )}
                </div>

                <p className="mb-4 text-sm text-purple-200">
                  Connect with your Exness Trading API key instead of entering an MT5 investor password.
                  Ark only reads account history; it does not place or manage trades. This free API
                  connection is recommended; the free MT5 desktop method remains available below.
                </p>

                {exnessConnected && (
                  <div className="mb-4 rounded-lg border border-green-700/50 bg-green-900/20 p-3 text-sm">
                    <p className="text-white">
                      Account {maskAccountNumber(exnessConnection?.accountId ?? "")}
                      {exnessConnection?.accountCurrency ? ` · ${exnessConnection.accountCurrency}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-purple-300">
                      Last sync:{" "}
                      {exnessConnection?.lastSynced
                        ? new Date(exnessConnection.lastSynced).toLocaleString()
                        : "waiting"}
                      {" · "}Automatic sync every minute
                    </p>
                  </div>
                )}
                {exnessConfigured && !exnessConnected && (
                  <p className="mb-4 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-200">
                    Exness credentials are saved, but MT5 or CSV is currently selected for the journal.
                    Connect Exness again below to switch methods.
                  </p>
                )}

                <div className="mb-4 rounded-lg border border-purple-700 bg-purple-950/60 p-3 text-xs text-purple-300">
                  <LockKeyhole className="mr-1 inline h-3.5 w-3.5 text-emerald-300" />
                  Your key pair is sent to this local server, encrypted before storage, and never returned to
                  the browser. Configure the encryption key as described in the README first.
                  {" "}
                  <a
                    href="https://www.exness-api.com/authentication/api-key-and-host-setup"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 underline underline-offset-2"
                  >
                    Exness API setup guide
                  </a>
                </div>

                <form onSubmit={handleExnessConnect} className="space-y-3">
                  <div>
                    <label htmlFor="exness-api-key" className="mb-1 block text-sm text-purple-200">
                      API key ID
                    </label>
                    <input
                      id="exness-api-key"
                      type="password"
                      autoComplete="off"
                      value={exnessApiKey}
                      onChange={(event) => setExnessApiKey(event.target.value)}
                      required
                      maxLength={512}
                      placeholder="exnsk-…"
                      className="w-full rounded-lg border border-purple-700 bg-purple-950 px-3 py-2 text-sm text-white placeholder-purple-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="exness-private-key" className="mb-1 block text-sm text-purple-200">
                      Ed25519 private signing key
                    </label>
                    <textarea
                      id="exness-private-key"
                      value={exnessPrivateKey}
                      onChange={(event) => setExnessPrivateKey(event.target.value)}
                      required
                      rows={3}
                      maxLength={4096}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="128-character hex key or unencrypted PKCS#8 PEM"
                      className="w-full resize-y rounded-lg border border-purple-700 bg-purple-950 px-3 py-2 font-mono text-xs text-white placeholder-purple-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="exness-account-id" className="mb-1 block text-sm text-purple-200">
                      Trading account ID
                    </label>
                    <input
                      id="exness-account-id"
                      type="text"
                      inputMode="numeric"
                      value={exnessAccountId}
                      onChange={(event) => setExnessAccountId(event.target.value)}
                      required
                      maxLength={20}
                      pattern="[1-9][0-9]{0,19}"
                      placeholder="Account ID from Key Management"
                      className="w-full rounded-lg border border-purple-700 bg-purple-950 px-3 py-2 text-sm text-white placeholder-purple-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="exness-gateway" className="mb-1 block text-sm text-purple-200">
                      Trading API DNS gateway URL
                    </label>
                    <input
                      id="exness-gateway"
                      type="url"
                      value={exnessGateway}
                      onChange={(event) => setExnessGateway(event.target.value)}
                      required
                      placeholder="https://api.exness.com (copy from the DNS widget)"
                      className="w-full rounded-lg border border-purple-700 bg-purple-950 px-3 py-2 text-sm text-white placeholder-purple-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-purple-400">
                    Create a Trading API key with read access to this exact account. Enter the Main DNS
                    hostname from Key Management with https:// in front (for example, https://api.exness.com).
                    The account Access Point is discovered after connecting. Make sure the key allows this
                    account and your current public IP.
                  </p>

                  {exnessError && (
                    <p role="alert" className="text-sm text-red-300">
                      {exnessError}
                    </p>
                  )}
                  {exnessMessage && (
                    <p role="status" className="text-sm text-emerald-300">
                      {exnessMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={exnessBusy}
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 font-semibold text-white transition-colors hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50"
                  >
                    {exnessBusy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      "Connect Exness API"
                    )}
                  </button>
                </form>

                {exnessConfigured && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {exnessConnected && (
                      <button
                        type="button"
                        onClick={handleExnessSync}
                        disabled={exnessBusy}
                        className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
                      >
                        <RefreshCw className={`mr-1.5 inline h-4 w-4 ${exnessBusy ? "animate-spin" : ""}`} />
                        Sync now
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExnessDisconnect}
                      disabled={exnessBusy}
                      className={`rounded-lg border border-purple-600 px-3 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-800 disabled:opacity-50 ${exnessConnected ? "" : "col-span-2"}`}
                    >
                      <XCircle className="mr-1.5 inline h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                )}
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
                  <h2 className="text-xl font-semibold text-white">MT5 Desktop Connection</h2>
                </div>

                <div className="space-y-4">
                  <p className="text-purple-300 text-sm">
                    Free automatic sync runs on this Mac through the official MT5 terminal. Enter your
                    investor (read-only) password only in MT5; Ark never receives or stores it.
                  </p>
                  {mt5Connected && (
                    <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                        <div>
                          <p className="text-white font-medium">MT5 history syncing</p>
                          <p className="text-purple-300 text-sm">
                            {connection?.serverName} · Account {maskAccountNumber(connection?.accountLogin ?? "")}
                          </p>
                          <p className="text-purple-400 text-xs">
                            Last sync: {connection?.lastSynced ? new Date(connection.lastSynced).toLocaleString() : "waiting"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {syncSetup ? (
                    <div className="space-y-3 rounded-lg border border-purple-700 bg-purple-950/60 p-4">
                      <a
                        href="/mt5/ArkJournalSync.mq5"
                        download
                        className="inline-flex items-center rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600"
                      >
                        Download ArkJournalSync.mq5
                      </a>
                      <div>
                        <label className="mb-1 block text-xs text-purple-300">Local sync endpoint</label>
                        <code className="block break-all text-xs text-white">{syncSetup.endpoint}</code>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-purple-300">Local sync key (keep private)</label>
                        {syncTokenVisible ? (
                          <code className="mb-2 block break-all rounded-lg border border-purple-700 bg-purple-900 px-3 py-2 text-xs text-white">
                            {syncSetup.token}
                          </code>
                        ) : (
                          <p className="mb-2 text-xs text-purple-400">Hidden. Copy the key directly into the EA input.</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCopySyncToken}
                            className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-600"
                          >
                            {syncTokenCopied ? "Copied" : "Copy key"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSyncTokenVisible((visible) => !visible)}
                            aria-expanded={syncTokenVisible}
                            className="rounded-lg border border-purple-600 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-800"
                          >
                            {syncTokenVisible ? "Hide key" : "Show key"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p role="alert" className="text-sm text-amber-300">
                      {syncSetupError || "Loading local sync settings…"}
                      {" "}Open Settings from this Mac at http://localhost:3000/settings.
                    </p>
                  )}

                  <ol className="list-decimal space-y-2 pl-5 text-sm text-purple-300">
                    <li>
                      In MT5, log into your account with the investor password. This login stays inside MT5.
                    </li>
                    <li>
                      In MT5 choose <strong>File → Open Data Folder</strong>, then place the downloaded file in
                      <code className="mx-1 text-purple-200">MQL5/Experts</code> and compile it in MetaEditor.
                    </li>
                    <li>
                      In <strong>Tools → Options → Expert Advisors</strong>, allow WebRequest for
                      <code className="mx-1 text-purple-200">http://127.0.0.1:3000</code>.
                    </li>
                    <li>
                      Attach <strong>ArkJournalSync</strong> to a chart. In its Inputs, set the endpoint above
                      and paste the sync key. Enable Algo Trading.
                    </li>
                  </ol>
                  <p className="text-xs text-purple-400">
                    The EA uploads closed deals to this Mac every minute over localhost. Keep MT5 and this
                    app running. Stop/remove the EA in MT5 before disconnecting.
                  </p>
                  {mt5Connected && (
                    <button
                      onClick={handleDisconnect}
                      className="w-full rounded-lg bg-purple-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-purple-800"
                    >
                      <XCircle className="mr-2 inline h-4 w-4" />
                      Disconnect
                    </button>
                  )}
                </div>
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
