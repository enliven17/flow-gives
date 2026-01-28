/**
 * ProjectStats Component
 * 
 * Displays detailed statistics and metrics for a crowdfunding project
 */

import { Project } from '@/lib/models/project';
import { formatFlow, calculateFundingPercentage, calculateTimeRemaining } from '@/lib/utils/format';

export interface ProjectStatsProps {
  project: Project;
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const percentFunded = calculateFundingPercentage(project.totalRaised, project.fundingGoal);
  const timeRemaining = calculateTimeRemaining(project.deadline);
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  const isActive = project.status === 'active';
  const isFunded = project.status === 'funded';
  const isExpired = project.status === 'expired';

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Raised */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 rounded-xl p-4 border border-accent-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-text-muted uppercase tracking-wide">Raised</p>
          </div>
          <p className="text-2xl font-black text-accent-primary">
            {formatFlow(project.totalRaised)}
          </p>
          <p className="text-xs text-text-muted mt-1">FLOW</p>
        </div>

        {/* Funding Goal */}
        <div className="bg-background-tertiary/50 rounded-xl p-4 border border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-xs text-text-muted uppercase tracking-wide">Goal</p>
          </div>
          <p className="text-2xl font-black text-text-primary">
            {formatFlow(project.fundingGoal)}
          </p>
          <p className="text-xs text-text-muted mt-1">FLOW</p>
        </div>

        {/* Contributors */}
        <div className="bg-background-tertiary/50 rounded-xl p-4 border border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-xs text-text-muted uppercase tracking-wide">Backers</p>
          </div>
          <p className="text-2xl font-black text-text-primary">
            {project.contributorCount}
          </p>
          <p className="text-xs text-text-muted mt-1">supporters</p>
        </div>

        {/* Time Remaining */}
        <div className={`rounded-xl p-4 border ${
          isActive && daysRemaining > 7
            ? 'bg-accent-success/10 border-accent-success/20'
            : isActive && daysRemaining > 0
            ? 'bg-accent-warning/10 border-accent-warning/20'
            : 'bg-text-muted/10 border-text-muted/20'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-5 h-5 ${
              isActive && daysRemaining > 0 ? 'text-accent-success' : 'text-text-muted'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-text-muted uppercase tracking-wide">Time Left</p>
          </div>
          <p className={`text-2xl font-black ${
            isActive && daysRemaining > 0 ? 'text-accent-success' : 'text-text-muted'
          }`}>
            {daysRemaining > 0 ? daysRemaining : 0}
          </p>
          <p className="text-xs text-text-muted mt-1">days</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-text-primary">
            {percentFunded.toFixed(1)}% funded
          </span>
          <span className="text-sm text-text-secondary">
            {formatFlow(project.fundingGoal - project.totalRaised)} FLOW to go
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-background-tertiary rounded-full h-6 overflow-hidden shadow-inner border border-border-default">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                percentFunded >= 100
                  ? 'bg-gradient-to-r from-accent-success via-accent-primary to-accent-success'
                  : 'bg-gradient-to-r from-accent-primary via-accent-success to-accent-primary'
              }`}
              style={{ width: `${Math.min(percentFunded, 100)}%` }}
            >
              <div className="h-full w-full bg-gradient-to-t from-white/20 to-transparent"></div>
            </div>
          </div>
          {percentFunded >= 100 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                🎉 FUNDED!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background-tertiary/50 border border-border-default">
        <div className={`w-2 h-2 rounded-full ${
          isActive ? 'bg-accent-success animate-pulse' :
          isFunded ? 'bg-accent-primary' :
          'bg-text-muted'
        }`}></div>
        <span className="text-sm font-medium text-text-primary">
          {isActive && 'Campaign Active'}
          {isFunded && 'Successfully Funded'}
          {isExpired && 'Campaign Ended'}
          {project.status === 'draft' && 'Draft'}
        </span>
      </div>
    </div>
  );
}
