"use client";

import React from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
  Monitor
} from "lucide-react";

export default function Settings() {
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
