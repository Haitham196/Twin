"use client";

import { FormEvent, useState } from "react";

interface Props {
  onComplete: (name: string) => void;
}

export default function UserOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState<"name" | "group">("name");
  const [name, setName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [groupInput, setGroupInput] = useState("");

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("group");
  }

  function handleGroupSubmit(group: boolean) {
    setIsGroup(group);
    if (!group) {
      onComplete(name.trim());
    }
  }

  function handleGroupNames(e: FormEvent) {
    e.preventDefault();
    onComplete(name.trim());
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        {step === "name" ? (
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-3xl mb-2">👋</div>
              <h2 className="text-xl font-semibold text-white">Hello!</h2>
              <p className="text-slate-400 text-sm mt-1">
                I&apos;m Haitham AI. What&apos;s your name?
              </p>
            </div>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name..."
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        ) : isGroup === false && step === "group" && groupInput === "" ? (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h2 className="text-xl font-semibold text-white">Welcome, {name}!</h2>
              <p className="text-slate-400 text-sm mt-1">
                Is it just you, or are there others with you?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleGroupSubmit(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 text-sm font-medium transition-colors"
              >
                Just me
              </button>
              <button
                onClick={() => { setIsGroup(true); setGroupInput(" "); }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium transition-colors"
              >
                Group
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGroupNames} className="flex flex-col gap-5">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h2 className="text-xl font-semibold text-white">Who else is here?</h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter names separated by commas
              </p>
            </div>
            <input
              autoFocus
              type="text"
              value={groupInput.trim() ? groupInput : ""}
              onChange={(e) => setGroupInput(e.target.value)}
              placeholder="Ahmed, Sara, Mohammed..."
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              Start
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
