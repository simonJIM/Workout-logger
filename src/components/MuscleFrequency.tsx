/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutSession, MuscleGroup } from '../types';
import { MUSCLE_GROUPS, EXERCISE_PRESETS, getSecondaryMuscles } from '../presets';
import { Clock, Target, Dumbbell, Activity, Info, Calendar } from 'lucide-react';

interface MuscleFrequencyProps {
  workouts: WorkoutSession[];
  onTargetMuscle: (muscle: MuscleGroup) => void;
}

export default function MuscleFrequency({ workouts, onTargetMuscle }: MuscleFrequencyProps) {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);

  // Current local benchmark date/time
  const now = new Date();

  // 1. Calculate stimulation recency in hours for all 9 muscle groups
  const allGroupsList: MuscleGroup[] = [
    'Chest',
    'Back',
    'Quads',
    'Hamstrings',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Calves',
    'Glutes'
  ];

  const muscleFrequencyData = allGroupsList.map((group) => {
    // Filter workouts that have at least one set targeting this group as primary or secondary
    const sessionsWithGroup = workouts.filter((s) =>
      s.exercises.some((ex) => {
        const isPrimary = ex.muscleGroup === group;
        const isSecondary = getSecondaryMuscles(ex.name, ex.muscleGroup).includes(group);
        return (isPrimary || isSecondary) && ex.sets.length > 0;
      })
    );

    // Primary only sessions
    const primarySessionsWithGroup = workouts.filter((s) =>
      s.exercises.some((ex) => ex.muscleGroup === group && ex.sets.length > 0)
    );

    // Secondary only sessions
    const secondarySessionsWithGroup = workouts.filter((s) =>
      s.exercises.some((ex) => {
        const isPrimary = ex.muscleGroup === group;
        const isSecondary = getSecondaryMuscles(ex.name, ex.muscleGroup).includes(group);
        return isSecondary && !isPrimary && ex.sets.length > 0;
      })
    );

    if (sessionsWithGroup.length === 0) {
      return {
        muscleGroup: group,
        lastHitDate: null,
        hoursSinceLastHit: null,
        status: 'cold' as const,
        sessionsCount: 0,
        primaryCount: 0,
        secondaryCount: 0,
        recentSessions: []
      };
    }

    // Sort by date descending
    const sortedSessions = [...sessionsWithGroup].sort((a, b) => b.date.localeCompare(a.date));
    const latestSession = sortedSessions[0];

    // Compute accurate hours since
    const sessionDateStr = `${latestSession.date}T12:00:00`; // safe noon representation
    const latestDate = new Date(sessionDateStr);
    
    // Calculate difference
    const diffInMs = now.getTime() - latestDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const hoursSinceLastHit = diffInHours < 0 ? 0 : Math.round(diffInHours);

    // active: and <= 72h, cold: > 72h or never trained
    let status: 'optimal' | 'warning' | 'cold' = 'cold';
    if (hoursSinceLastHit <= 48) {
      status = 'optimal';
    } else if (hoursSinceLastHit <= 72) {
      status = 'warning';
    } else {
      status = 'cold';
    }

    return {
      muscleGroup: group,
      lastHitDate: latestSession.date,
      hoursSinceLastHit,
      status,
      sessionsCount: sessionsWithGroup.length,
      primaryCount: primarySessionsWithGroup.length,
      secondaryCount: secondarySessionsWithGroup.length,
      recentSessions: sortedSessions.slice(0, 3) // last 3 logs for detailed timeline
    };
  });

  // Sort: Earliest (Coldest/Never Hit) first -> Most recent (Latest Hit) last.
  // Never hit (hoursSinceLastHit === null) represents the absolute "earliest" (infinite hours ago), so they go first.
  const sortedMuscleFrequency = [...muscleFrequencyData].sort((a, b) => {
    const hoursA = a.hoursSinceLastHit === null ? Infinity : a.hoursSinceLastHit;
    const hoursB = b.hoursSinceLastHit === null ? Infinity : b.hoursSinceLastHit;
    return hoursB - hoursA; // Descending: Infinity first, then 120h, down to 1h
  });

  // Keep a selected muscle group context
  const activeDetailGroup = selectedGroup 
    ? muscleFrequencyData.find(m => m.muscleGroup === selectedGroup) 
    : sortedMuscleFrequency[0]; // default to first sorted (coldest)

  const getFillColor = (group: MuscleGroup) => {
    const isSelected = activeDetailGroup?.muscleGroup === group;
    if (isSelected) {
      return '#334155'; // Sleek dark slate highlight for classrooms
    }
    return '#ffffff'; // neutral empty white
  };

  const getMuscleStyle = (name: MuscleGroup) => {
    return MUSCLE_GROUPS.find((mg) => mg.name === name) || {
      name: 'Other',
      color: '#475569',
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      ring: 'ring-slate-200/50'
    };
  };

  const getHoursText = (group: MuscleGroup) => {
    const item = muscleFrequencyData.find(m => m.muscleGroup === group);
    if (!item || item.hoursSinceLastHit === null) return 'Cold';
    return `${item.hoursSinceLastHit}h`;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="frequency-panel">
      {/* Dynamic Header Deck description */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs" id="freq-intro-card">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
          <Clock className="h-4 w-4 text-slate-700" />
          <span>Time elapsed since stimulus & Hypertrophy Optimization</span>
        </h3>
        <p className="text-xs text-slate-500 font-sans mt-1.5 leading-relaxed">
          Track hours elapsed since each muscle was last stimulated. To support optimal hypertrophy with proper recovery, strive to stimulate each target muscle group roughly once every <strong className="text-slate-900 font-bold">48 hours</strong> with a focused, low-volume, high-intensity resistance workload.
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center" id="empty-frequency-state">
          <Dumbbell className="h-10 w-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No muscle stimulation logs tracked yet</h3>
          <p className="text-xs text-slate-450 max-w-xs mx-auto mt-1 leading-relaxed font-sans">
            Add a training session with compound or isolation logs to unlock the interactive biometric anatomy map and frequency index.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="frequency-layout-grid">
          
          {/* Unified Index List of ALL Muscles (Left Col, 5/12 wide) */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-3" id="muscles-frequency-list">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Muscle Stimulation Index</h4>
              <span className="text-[9.5px] font-sans text-slate-405 italic">Sorted Coldest to Warmest</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-1 lg:max-h-[580px] lg:overflow-y-auto pr-1">
              {sortedMuscleFrequency.map((item) => {
                const isSelected = activeDetailGroup?.muscleGroup === item.muscleGroup;

                // Simple text indicator (active) or (cold) next to hours ago based on user rules
                const isCold = item.hoursSinceLastHit === null || item.hoursSinceLastHit > 72;
                const statusLabel = isCold ? '(cold)' : '(active)';

                // Visual dot indicator representing status - purely monochrome
                const dotColor = isCold ? 'bg-slate-200 border border-slate-350 shrink-0' : 'bg-slate-900 shrink-0';

                return (
                  <button
                    key={item.muscleGroup}
                    onClick={() => setSelectedGroup(item.muscleGroup)}
                    className={`w-full p-2.5 sm:p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 group truncate ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-1 ring-slate-950' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : dotColor}`} />
                      <div className="truncate">
                        <span className="font-extrabold text-[11px] sm:text-xs block truncate leading-tight">
                          {item.muscleGroup}
                        </span>
                        
                        <span className={`text-[9.5px] sm:text-[10.5px] font-mono leading-tight whitespace-nowrap block mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-450'}`}>
                          {item.hoursSinceLastHit === null 
                            ? `Never ` 
                            : `${item.hoursSinceLastHit}h `
                          }
                          <span className={`font-bold ${isSelected ? 'text-slate-200' : isCold ? 'text-slate-450' : 'text-emerald-600'}`}>
                            {statusLabel}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 sm:mt-0 self-end sm:self-auto">
                      <span className={`text-[8.5px] font-sans font-bold uppercase ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.sessionsCount} {item.sessionsCount === 1 ? 'log' : 'logs'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modern Tactical Bioclocks Dashboard (Right Col) */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-4 animate-fade-in" id="anatomy-vector-container">
            
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between" id="anatomy-vector-card">
              
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800 tracking-tight uppercase">Muscle Stimulation Bioclocks SUMMARY</h5>
                  <p className="text-[10px] text-slate-450 font-sans">Visual time tracker of hours elapsed since last targeted stimulus session</p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md p-1 px-2.5 text-[8.5px] text-slate-500 font-sans shadow-3xs">
                  <span className="font-extrabold uppercase tracking-wide" id="custom-anatomy-badge">Biometric Dial Matrix</span>
                </div>
              </div>


              {/* Interactive Bioclock Dials Grid (Replaces old pictogram) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4" id="bioclocks-grid-matrix">
                {allGroupsList.map((group) => {
                  const item = muscleFrequencyData.find((m) => m.muscleGroup === group) || {
                    muscleGroup: group,
                    lastHitDate: null,
                    hoursSinceLastHit: null,
                    status: 'cold',
                    sessionsCount: 0,
                    primaryCount: 0,
                    secondaryCount: 0
                  };

                  const isSelected = activeDetailGroup?.muscleGroup === group;
                  const hours = item.hoursSinceLastHit;
                  
                  let strokeColor = 'text-slate-300';
                  let statusBg = 'bg-slate-100 text-slate-600';
                  let statusText = 'Cold';
                  let progressPercent = 0; // percentage of target 48h remaining

                  if (hours === null) {
                    strokeColor = 'text-slate-200';
                    statusBg = 'bg-slate-100 text-slate-500';
                    statusText = 'Unstimulated';
                    progressPercent = 0;
                  } else if (hours <= 48) {
                    progressPercent = Math.max(5, Math.round(((48 - hours) / 48) * 100));
                    strokeColor = 'text-emerald-500';
                    statusBg = 'bg-emerald-50 text-emerald-805 font-bold border border-emerald-100';
                    statusText = 'Active (<=48h)';
                  } else if (hours <= 72) {
                    progressPercent = Math.max(5, Math.round(((72 - hours) / 24) * 100));
                    strokeColor = 'text-amber-500';
                    statusBg = 'bg-amber-50 text-amber-805 font-bold border border-amber-100';
                    statusText = 'Recovered';
                  } else {
                    progressPercent = 0;
                    strokeColor = 'text-slate-300';
                    statusBg = 'bg-slate-100 text-slate-500 border border-slate-200';
                    statusText = 'Stimulus Dry';
                  }

                  return (
                    <div
                      key={group}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer h-36 select-none ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm ring-1 ring-slate-950'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider block truncate w-full">
                        {group}
                      </span>

                      {/* Precise Circular Dial representation */}
                      <div className="relative flex items-center justify-center w-12 h-12 my-1 shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            className={isSelected ? 'text-slate-800' : 'text-slate-150'}
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            cx="18"
                            cy="18"
                            r="15"
                          />
                          <circle
                            className={`${isSelected && strokeColor === 'text-slate-900' ? 'text-white' : strokeColor} transition-all duration-300`}
                            strokeDasharray={`${hours === null ? '4 4' : `${progressPercent}, 100`}`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            cx="18"
                            cy="18"
                            r="15"
                          />
                        </svg>
                        
                        {/* Center elapsed indicator */}
                        <div className="absolute flex flex-col items-center select-none">
                          <span className={`text-[10.5px] font-black font-mono leading-none ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {hours === null ? '—' : `${hours}h`}
                          </span>
                        </div>
                      </div>

                      {/* Stimulus Warmth text status */}
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                        isSelected ? 'bg-slate-800 text-slate-200 border border-slate-700' : statusBg
                      }`}>
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status details indicators below map matching selected muscle list on the left */}
              {activeDetailGroup && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in" id="selected-anatomic-indicator">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                       <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{activeDetailGroup.muscleGroup} Info</span>
                       <span className="text-[10px] font-bold text-slate-400 font-mono">
                         ({activeDetailGroup.sessionsCount} total hits — {activeDetailGroup.primaryCount} primary, {activeDetailGroup.secondaryCount} secondary)
                       </span>
                     </div>
                     <p className="text-[11px] text-slate-505 font-sans leading-relaxed">
                       {activeDetailGroup.hoursSinceLastHit === null 
                         ? 'Never trained before. Ready to be logged!' 
                         : `Last set (primary or secondary) was logged ${activeDetailGroup.hoursSinceLastHit} hours ago.`
                       }
                     </p>
                   </div>

                  <button
                    onClick={() => onTargetMuscle(activeDetailGroup.muscleGroup)}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start md:self-auto text-center"
                  >
                    <Target className="h-3.5 w-3.5" />
                    <span>Log {activeDetailGroup.muscleGroup}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
