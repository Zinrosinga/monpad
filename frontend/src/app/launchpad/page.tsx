"use client";

import { Faucet } from "@/components/LaunchPad";

export default function LaunchPadPage() {
  return (
    <div className="max-w-[40%] mx-auto px-8">
      <div className="space-y-6">
        {/* LaunchPad Component with all features */}
        <Faucet />
      </div>
    </div>
  );
}
