"use client";

import { SmartAccountInfo } from "@/components/SmartAccountInfo";

export default function DashboardPage() {
  return (
    <div className="max-w-[40%] mx-auto px-8">
      <div className="space-y-6">
        {/* Dashboard Layout */}
        <div className="space-y-6">
          {/* Smart Account Management */}
          <SmartAccountInfo />
        </div>
      </div>
    </div>
  );
}