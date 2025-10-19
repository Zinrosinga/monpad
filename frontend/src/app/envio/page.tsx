"use client";

import MonPadEvents from "@/components/MonPadEvents";

export default function EnvioDashboardPage() {
  return (
    <div className="max-w-[80%] mx-auto px-8">
      <div className="space-y-6">
        {/* MonPad Events Component */}
        <MonPadEvents />
      </div>
    </div>
  );
}
