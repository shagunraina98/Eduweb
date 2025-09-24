import React from 'react';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors shadow-sm">
      <div className="text-sky-400 mb-3 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-slate-300 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
