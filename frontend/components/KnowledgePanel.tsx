"use client";

const KNOWLEDGE_ITEMS = [
  { icon: "🏥", label: "650 Branches" },
  { icon: "🧪", label: "Laboratories" },
  { icon: "🩻", label: "Radiology" },
  { icon: "🇨🇳", label: "China AI Trip — 14 Days" },
  { icon: "🎓", label: "Fudan University" },
  { icon: "🔷", label: "Huawei" },
  { icon: "🖥️", label: "United Imaging" },
  { icon: "🔬", label: "AI Endoscopy" },
  { icon: "🧠", label: "Medical Foundation Models" },
  { icon: "🛡️", label: "Cyber Resilience" },
];

export default function KnowledgePanel() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Knowledge Base</p>
      {KNOWLEDGE_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-1.5"
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
