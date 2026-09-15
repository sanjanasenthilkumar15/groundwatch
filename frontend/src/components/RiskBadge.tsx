import React from 'react';
import { getRiskBadgeClass, getRiskIcon } from '../lib/utils';

export default function RiskBadge({ level }: { level: string }) {
  if (!level) return null;
  const className = getRiskBadgeClass(level);
  const icon = getRiskIcon(level);
  
  return (
    <span className={className}>
      <span style={{ fontSize: '1.2em', lineHeight: 1, marginTop: '-1px' }}>{icon}</span>
      {level}
    </span>
  );
}
