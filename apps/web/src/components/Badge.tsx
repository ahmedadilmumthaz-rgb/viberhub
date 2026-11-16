import React from 'react';
import { cn } from '../lib/utils';
import {
  CampaignStatus,
  CampaignItemStatus,
  ConsentStatus,
  DestinationType,
  MemberRole
} from '@viberhub/shared';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  status?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  className
}) => {
  let computedVariant = variant;

  if (status) {
    switch (status) {
      case CampaignStatus.APPROVED:
      case CampaignItemStatus.COMPLETED_MANUALLY:
      case ConsentStatus.GRANTED:
        computedVariant = 'success';
        break;
      case CampaignStatus.IN_REVIEW:
      case CampaignItemStatus.REVIEWED:
        computedVariant = 'warning';
        break;
      case CampaignStatus.DRAFT:
      case CampaignItemStatus.PREPARED:
      case ConsentStatus.UNKNOWN:
        computedVariant = 'info';
        break;
      case CampaignStatus.ARCHIVED:
      case CampaignItemStatus.CANCELLED:
      case ConsentStatus.WITHDRAWN:
        computedVariant = 'neutral';
        break;
      default:
        computedVariant = 'default';
    }
  }

  const styles = {
    default: 'bg-violet-100 text-violet-800 border-violet-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        styles[computedVariant],
        className
      )}
    >
      {children || status?.replace(/_/g, ' ')}
    </span>
  );
};
