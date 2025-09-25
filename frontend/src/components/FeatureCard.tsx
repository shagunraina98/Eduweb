import React from 'react';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="rounded-xl border border-textSecondary/20 bg-card p-6 hover:border-textSecondary/30 transition-colors shadow-sm">
      <div className="text-primary mb-3 text-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
      <p className="mt-2 text-textSecondary text-sm leading-relaxed">{description}</p>
    </div>
  );
}
