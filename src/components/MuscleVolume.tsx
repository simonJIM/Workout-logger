/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutSession, MuscleGroup } from '../types';
import { MUSCLE_GROUPS } from '../presets';
import { Layers, Calendar, ChevronDown, ChevronUp, BarChart3, TrendingUp, Compass, ChevronRight } from 'lucide-react';

interface MuscleVolumeProps {
  workouts: WorkoutSession[];
}

type PeriodFilter = '7days' | '30days' | '365days' | 'all';

interface ExerciseGroupContribution {
  name: string;
  totalSets: number;
  setsDetail: { reps: number; weight?: number | '' }[];
}

export default function MuscleVolume({ workouts }: MuscleVolumeProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Benchmark Date definitions
  const now = new Date();
  
  // 1. Filter workouts matching selected period boundary
  const filteredWorkouts = workouts.filter((session) => {
    const sessionDate = new Date(`${session.date}T12:00:00`);
    
    if (period === '7days') {
      const boundaryDate = new Date();
      boundaryDate.setDate(now.getDate() - 7);
      boundaryDate.setHours(0, 0, 0, 0);
      return sessionDate >= boundaryDate;
    }
    
    if (period === '30days') {
      const boundaryDate = new Date();
      boundaryDate.setDate(now.getDate() - 30);
      boundaryDate.setHours(0, 0, 0, 0);
      return sessionDate >= boundaryDate;
    }

    if (period === '365days') {
      const boundaryDate = new Date();
      boundaryDate.setDate(now.getDate() - 365);
      boundaryDate.setHours(0, 0, 0, 0);
      return sessionDate >= boundaryDate;
    }

    return true; // All-time history
  });

  // 2. Perform set calculations for each muscle group based on filtered workouts
  const statsMap: Record<MuscleGroup, { sets: number; reps: number; exercisesCount: number }> = {
    Chest: { sets: 0, reps: 0, exercisesCount: 0 },
    Back: { sets: 0, reps: 0, exercisesCount: 0 },
    Quads: { sets: 0, reps: 0, exercisesCount: 0 },
    Hamstrings: { sets: 0, reps: 0, exercisesCount: 0 },
    Shoulders: { sets: 0, reps: 0, exercisesCount: 0 },
    Biceps: { sets: 0, reps: 0, exercisesCount: 0 },
    Triceps: { sets: 0, reps: 0, exercisesCount: 0 },
    Calves: { sets: 0, reps: 0, exercisesCount: 0 },
    Glutes: { sets: 0, reps: 0, exercisesCount: 0 }
  };

  const exerciseContributions: Record<MuscleGroup, Record<string, { totalSets: number; setsDetail: { reps: number; weight?: number | '' }[] }>> = {
    Chest: {}, Back: {}, Quads: {}, Hamstrings: {}, Shoulders: {}, Biceps: {}, Triceps: {}, Calves: {}, Glutes: {}
  };

  let totalSetsPeriod = 0;
  let totalRepsPeriod = 0;

  filteredWorkouts.forEach((session) => {
    session.exercises.forEach((ex) => {
      let group = ex.muscleGroup;
      if (group as string === 'Legs') group = 'Quads';
      if (group as string === 'Arms') group = 'Biceps';
      if (!statsMap[group]) return;

      statsMap[group].exercisesCount += 1;

      if (!exerciseContributions[group][ex.name]) {
        exerciseContributions[group][ex.name] = { totalSets: 0, setsDetail: [] };
      }
      
      ex.sets.forEach((set) => {
        const r = typeof set.reps === 'number' ? set.reps : 0;
        statsMap[group].sets += 1;
        statsMap[group].reps += r;
        totalSetsPeriod += 1;
        totalRepsPeriod += r;

        exerciseContributions[group][ex.name].totalSets += 1;
        exerciseContributions[group][ex.name].setsDetail.push({
          reps: r,
          weight: set.weight
        });
      });
    });
  });

  // Convert to formatted arrays sorted descending by Sets count
  const volumeSummaries = Object.entries(statsMap).map(([group, data]) => {
    return {
      muscleGroup: group as MuscleGroup,
      setsCount: data.sets,
      repsCount: data.reps,
      exercisesCount: data.exercisesCount,
      percentage: totalSetsPeriod > 0 ? Math.round((data.sets / totalSetsPeriod) * 100) : 0,
      contributions: Object.entries(exerciseContributions[group as MuscleGroup]).map(([exName, details]) => ({
        name: exName,
        totalSets: details.totalSets,
        setsDetail: details.setsDetail
      })).sort((a, b) => b.totalSets - a.totalSets)
    };
  }).sort((a, b) => b.setsCount - a.setsCount);

  // Compute boundaries for relative width scaling
  const maxSetsInPeriod = Math.max(...volumeSummaries.map((v) => v.setsCount), 1);

  const getMuscleStyle = (name: MuscleGroup) => {
    return MUSCLE_GROUPS.find((mg) => mg.name === name) || {
      name: 'Other',
      color: '#64748b',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      ring: 'ring-slate-200/50'
    };
  };

  // Toggle expanded details
  const toggleGroup = (muscle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [muscle]: !prev[muscle]
    }));
  };

  // 3. Smart training index algorithm (Evaluate and supply biomechanical advice!)
  const chestSets = statsMap['Chest'].sets;
  const backSets = statsMap['Back'].sets;
  const quadSets = statsMap['Quads'].sets;
  const hamstringSets = statsMap['Hamstrings'].sets;
  const shoulderSets = statsMap['Shoulders'].sets;
  const bicepSets = statsMap['Biceps'].sets;
  const tricepSets = statsMap['Triceps'].sets;

  let adviceTitle = 'Balanced Protocol';
  let adviceDesc = 'Your logged activities show progress. Keep targeting your body with compound lifts!';
  let adviceColor = 'slate';

  if (totalSetsPeriod > 0) {
    if (quadSets === 0 && hamstringSets === 0) {
      adviceTitle = 'Squat Warning / Skill Index';
      adviceDesc = "Skipping lower body lowers metabolic response and core stabilization. Add some compound movements for Quads and Hamstrings during your next gym entry.";
      adviceColor = 'amber';
    } else if (chestSets > backSets * 2 && chestSets >= 4) {
      adviceTitle = 'Push/Pull Skeletal Index';
      adviceDesc = "Your chest and press volume is considerably exceeding back pull focus. To protect shoulder rotators, log some high-density back sets like rows or pullups.";
      adviceColor = 'amber';
    } else if (bicepSets > tricepSets * 2 && bicepSets >= 4) {
      adviceTitle = 'Bicep Dominance Detected';
      adviceDesc = "Your elbow flexion volume is exceeding tricep extensions. Couple bicep curls with compound extensions or pushdowns to maintain athletic elbow function.";
      adviceColor = 'amber';
    } else if (quadSets > hamstringSets * 2 && quadSets >= 4) {
      adviceTitle = 'Quad Dominant Knee Pressure';
      adviceDesc = "High quad loading with sparse hamstring work can cause front knee pressure. Supplement Squats with hamstrings pulls such as Romanian Deadlifts.";
      adviceColor = 'amber';
    } else {
      adviceTitle = 'Optimized Symmetrical Loading';
      adviceDesc = "Excellent sets coverage! Your volume distribution supports symmetrical muscle hypertrophy and joint stabilization.";
      adviceColor = 'emerald';
    }
  } else {
    adviceTitle = 'Calibrating Advice Engine';
    adviceDesc = 'We will analyze push/pull balance, arm symmetry, and knee stabilization once workouts are logged.';
  }

  return (
    <div className="space-y-6 animate-fade-in" id="volume-panel">
      {/* Top Filter Buttons Selector */}
      <div className="bg-white border border-slate-200 p-3.5 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="period-nav-card">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-600" />
            <span>Muscle Training Volume Monitor</span>
          </h3>
          <p className="text-xs text-slate-405 font-sans">Compare sets intensity and target allocations across chosen calendar frames.</p>
        </div>

        {/* Period Pills Filter Grid */}
        <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto" id="period-select-deck">
          {(['7days', '30days', '365days', 'all'] as PeriodFilter[]).map((p) => {
            const label = p === '7days' ? 'Weekly' : p === '30days' ? 'Monthly' : p === '365days' ? 'Yearly' : 'All-Time';
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`py-1.5 px-2 sm:px-3.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center" id="empty-volume-state">
          <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-md font-bold text-slate-700">No training volume calculated</h3>
          <p className="text-xs text-slate-450 max-w-xs mx-auto mt-1 leading-relaxed font-sans">
            Once you log sets, your weekly and monthly muscle training volume splits will display here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="volume-layout-grid">
          
          {/* Main Visual Volume Set Tracker (Left Col, 2/3 wide) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6" id="volume-progress-card">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Sets Completed per Muscle Group</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Click any muscle row below to see reps &amp; contributory exercises</p>
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-emerald-100 font-sans shrink-0">
                {totalSetsPeriod} Total Sets
              </span>
            </div>

            {totalSetsPeriod === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs animate-pulse">
                No exercise sets completed during this specific period window. Try logging actions!
              </div>
            ) : (
              <div className="space-y-3 cursor-pointer" id="volume-progress-bars">
                {volumeSummaries.map((item) => {
                  const style = getMuscleStyle(item.muscleGroup);
                  const barWidth = Math.max(3, Math.round((item.setsCount / maxSetsInPeriod) * 100));
                  const isExpanded = !!expandedGroups[item.muscleGroup];

                  return (
                    <div 
                      key={item.muscleGroup}
                      onClick={() => toggleGroup(item.muscleGroup)}
                      className="group border border-transparent hover:border-slate-150 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all"
                    >
                      {/* Row Title Specs */}
                      <div className="flex justify-between items-center text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                          <span className="font-extrabold text-slate-905">{item.muscleGroup}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            ({item.exercisesCount} logged)
                          </span>
                        </div>
                        
                        <div className="font-sans font-bold flex items-center gap-2.5 text-[11px]">
                          <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-mono">
                            {item.setsCount} {item.setsCount === 1 ? 'Set' : 'Sets'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Visual Graphic Bar */}
                      <div className="w-full bg-slate-100 border border-slate-200/40 h-3.5 rounded-lg overflow-hidden p-[1px] flex mt-2">
                        <div
                          className="h-full rounded-lg transition-all duration-500 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: style.color
                          }}
                        />
                      </div>

                      {/* Interactive Expand Details Block for Reps + Contributed Exercises */}
                      {isExpanded && (
                        <div 
                          className="mt-3.5 pl-4 border-l-2 p-3 bg-white border-slate-250 rounded-r-xl space-y-3 animate-fade-in"
                          onClick={(e) => e.stopPropagation()} // halt bubbling
                        >
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">
                            <span>Exercises Contribution</span>
                            <span>Total Volume: {item.repsCount} Reps</span>
                          </div>

                          {item.contributions.length === 0 ? (
                            <span className="text-xs text-slate-400 italic block">No workout details captured.</span>
                          ) : (
                            <div className="space-y-2">
                              {item.contributions.map((ct) => (
                                <div key={ct.name} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0 gap-1.5">
                                  <span className="font-bold text-slate-800">{ct.name}</span>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono">
                                      {ct.totalSets} {ct.totalSets === 1 ? 'set' : 'sets'}
                                    </span>
                                    <span className="text-slate-400 text-[10px]">reps:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {ct.setsDetail.map((det, idx) => (
                                        <span key={idx} className="bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700 font-mono">
                                          {det.reps}{det.weight ? `@${det.weight}lb` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Metrics & Biomechanical Analytics column (Right Col, 1/3 wide) */}
          <div className="space-y-6" id="volume-side-analytics">
            
            {/* KPI statistics list cards */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4" id="volume-period-metrics">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Period Statistics</h4>
              
              <div className="space-y-3" id="period-kpi-entries">
                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Workouts Logged</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">{filteredWorkouts.length}</span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium font-sans">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <span>Total Reps</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">{totalRepsPeriod}</span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 border border-slate-150 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium font-sans">
                    <span>Average Sets / Session</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {filteredWorkouts.length > 0
                      ? Math.round((totalSetsPeriod / filteredWorkouts.length) * 10) / 10
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Biomechanical Index Advisory Card */}
            <div className={`border p-6 rounded-2xl shadow-sm space-y-4 ${
              adviceColor === 'amber' 
                ? 'bg-amber-50/20 border-amber-100/80 text-amber-900' 
                : adviceColor === 'emerald'
                  ? 'bg-emerald-50/20 border-emerald-100/80 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-850'
            }`} id="biomechanical-advisor-card">
              
              <div className="flex items-start gap-2.5">
                <Compass className={`h-5 w-5 mt-0.5 shrink-0 ${
                  adviceColor === 'amber' 
                    ? 'text-amber-500' 
                    : adviceColor === 'emerald'
                      ? 'text-emerald-500'
                      : 'text-slate-400'
                }`} />
                
                <div className="space-y-1">
                  <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-slate-400">Biomechanical Balance Index</span>
                  <p className="text-sm font-bold tracking-tight text-slate-900 mt-1">{adviceTitle}</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans pt-1">
                    {adviceDesc}
                  </p>
                </div>
              </div>

              {/* Ratios chart representations */}
              {totalSetsPeriod > 0 && (
                <div className="pt-3 border-t border-slate-150 space-y-2 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Chest Press sets:</span>
                    <span className="font-mono font-bold text-slate-800">{chestSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Back Pull sets:</span>
                    <span className="font-mono font-bold text-slate-800">{backSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quads sets:</span>
                    <span className="font-mono font-bold text-slate-800">{quadSets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hamstrings sets:</span>
                    <span className="font-mono font-bold text-slate-800">{hamstringSets}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}
