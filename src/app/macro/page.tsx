"use client";

import React from "react";
import { MainLayout } from "@/components/dashboard/MainLayout";
import { MacroDesk } from "@/components/dashboard/MacroDesk";

export default function MacroDeskPage() {
  return (
    <MainLayout>
      <div className="p-3 sm:p-4 lg:p-6 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Macro Desk Component */}
          <MacroDesk />
        </div>
      </div>
    </MainLayout>
  );
}
