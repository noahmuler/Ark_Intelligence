"use client";

import React from "react";
import Dashboard from "@/app/dashboard/page";
import { MainLayout } from "@/components/dashboard/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <Dashboard />
    </MainLayout>
  );
}


