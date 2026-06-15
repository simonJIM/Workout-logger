/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { WorkoutSession, MuscleGroup } from '../types';
import { MUSCLE_GROUPS } from '../presets';
import { 
  Trophy, 
  TrendingDown, 
  BarChart3, 
  Dumbbell, 
  Activity, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Percent,
  ListFilter,
  X,
  ChevronDown
} from 'lucide-react';

interface TrainingInsightsProps {
  workouts: WorkoutSession[];
}

const ExerciseSparkline = ({ points }: { points: { date: string; maxWeight: number }[] }) => {
  if (points.length === 0) {
    return <span className="text-[10px] text-slate-400 italic font-sans">No weight logged</span>;
  }
  if (points.length < 2) {
    return (
      <div className="text-right flex flex-col items-end">
        <p className="text-xs font-black text-slate-850 font-mono leading-none">{points[0].maxWeight} kg</p>
        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">Max Weight</p>
      </div>
    );
  }

  const weights = points.map(p => p.maxWeight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const diff = maxW - minW === 0 ? 1 : maxW - minW;

  const width = 80;
  const height = 24;
  const padding = 2;

  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((p.maxWeight - minW) / diff) * (height - 2 * padding) - padding;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = weights[weights.length - 1] > weights[0] ? '#10b981' : '#64748b';

  return (
    <div className="flex flex-col items-end justify-center font-sans">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
        {/* Pointer circle */}
        {(() => {
          const lastIdx = points.length - 1;
          const x = width - padding;
          const lastW = points[lastIdx].maxWeight;
          const y = height - ((lastW - minW) / diff) * (height - 2 * padding) - padding;
          return <circle cx={x} cy={y} r="2" fill={strokeColor} />;
        })()}
      </svg>
      <span className="text-[9px] font-black text-slate-700 font-mono mt-0.5 leading-none">
        {weights[0]}kg → {weights[weights.length - 1]}kg
      </span>
    </div>
  );
};

export default function TrainingInsights({ workouts }: TrainingInsightsProps) {
  const [selectedMuscleDepth, setSelectedMuscleDepth] = useState<MuscleGroup | 'All'>('All');
  const [isDeepDiveExpanded, setIsDeepDiveExpanded] = useState(false);
  const [stimulationPeriod, setStimulationPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [deepDiveMetric, setDeepDiveMetric] = useState<'sets' | 'weight'>('sets');

  // Exercise Weight & Reps History states
  const [exerciseHistorySearch, setExerciseHistorySearch] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedHistoryExercise, setSelectedHistoryExercise] = useState<{ name: string; muscle: MuscleGroup; logs: { date: string; workoutName: string; sets: { weight: number | ''; reps: number | '' }[] }[] } | null>(null);

  // Extract all logged exercises and their history
  const exerciseHistoryList = useMemo(() => {
    const map: Record<string, { name: string; muscle: MuscleGroup; logs: { date: string; workoutName: string; sets: { weight: number | ''; reps: number | '' }[] }[] }> = {};

    // Sort workouts chronological order descending so we can easily show latest first (and fallback beneath)
    const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        if (!ex.name.trim()) return;
        const key = ex.name.trim(); 
        const normalizedKey = key.toLowerCase();
        
        // Filter out empty weights and empty reps — only display tracked sets where weight is intentionally logged (compliant with optional bodyweight rule)
        const validSets = ex.sets.filter(s => s.reps !== '' && s.weight !== '' && s.weight !== undefined && s.weight !== null);
        if (validSets.length === 0) return;

        if (!map[normalizedKey]) {
          map[normalizedKey] = {
            name: key,
            muscle: ex.muscleGroup,
            logs: []
          };
        }

        map[normalizedKey].logs.push({
          date: workout.date,
          workoutName: workout.name,
          sets: validSets.map(s => ({ weight: s.weight, reps: s.reps }))
        });
      });
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [workouts]);

  const filteredHistoryList = useMemo(() => {
    return exerciseHistoryList.filter(item => 
      item.name.toLowerCase().includes(exerciseHistorySearch.toLowerCase()) ||
      item.muscle.toLowerCase().includes(exerciseHistorySearch.toLowerCase())
    );
  }, [exerciseHistoryList, exerciseHistorySearch]);

  // Compute weight history helper
  const getWeightHistory = (exName: string) => {
    const points = [] as { date: string; maxWeight: number }[];
    const sortedWorkouts = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
    sortedWorkouts.forEach((session) => {
      const match = session.exercises.find((ex) => ex.name.trim().toLowerCase() === exName.trim().toLowerCase());
      if (match) {
        const weights = match.sets
          .map((s) => s.weight)
          .filter((w) => w !== '' && typeof w === 'number') as number[];
        if (weights.length > 0) {
          points.push({
            date: session.date,
            maxWeight: Math.max(...weights)
          });
        }
      }
    });
    return points;
  };

  // Compute all metrics safely using useMemo
  const stats = useMemo(() => {
    // 1. Initial Empty States Check
    if (!workouts || workouts.length === 0) {
      return {
        totalSessions: 0,
        totalSets: 0,
        totalReps: 0,
        muscleGroupSets: {} as Record<MuscleGroup, number>,
        exerciseStats: {} as Record<string, { count: number; sets: number; muscle: MuscleGroup }>,
        streakWeeks: 0,
        mostTrainedMuscle: null as { name: MuscleGroup; count: number } | null,
        leastTrainedMuscle: null as { name: MuscleGroup; count: number } | null,
        mostPerformedEx: null as { name: string; count: number; sets: number; muscle: MuscleGroup } | null,
        leastPerformedEx: null as { name: string; count: number; sets: number; muscle: MuscleGroup } | null,
      };
    }

    const totalSessions = workouts.length;
    let totalSets = 0;
    let totalReps = 0;

    // Aggregations
    const muscleGroupSets = {
      Chest: 0,
      Back: 0,
      Quads: 0,
      Hamstrings: 0,
      Shoulders: 0,
      Biceps: 0,
      Triceps: 0,
      Calves: 0,
      Glutes: 0
    } as Record<MuscleGroup, number>;

    // key: exercise name -> { count: total times done in sessions, sets: total sets, muscle: MuscleGroup }
    const exerciseStats = {} as Record<string, { count: number; sets: number; muscle: MuscleGroup }>;

    workouts.forEach((session) => {
      // Track session-level exercises unique registry
      const seenExercisesInSession = new Set<string>();

      session.exercises.forEach((ex) => {
        const primaryGroup = ex.muscleGroup;
        const setLength = ex.sets.length;
        totalSets += setLength;

        // Add primary muscle group sets
        if (primaryGroup && primaryGroup in muscleGroupSets) {
          muscleGroupSets[primaryGroup] += setLength;
        }

        // Add reps sum
        ex.sets.forEach((s) => {
          if (s.reps && typeof s.reps === 'number') {
            totalReps += s.reps;
          }
        });

        const exNameClean = ex.name.trim();
        if (exNameClean) {
          if (!exerciseStats[exNameClean]) {
            exerciseStats[exNameClean] = { count: 0, sets: 0, muscle: primaryGroup };
          }
          exerciseStats[exNameClean].sets += setLength;
          if (!seenExercisesInSession.has(exNameClean)) {
            exerciseStats[exNameClean].count += 1;
            seenExercisesInSession.add(exNameClean);
          }
        }
      });
    });

    // 2. Discover Most and Least Trained Muscles
    const muscleListWithVolume = (Object.keys(muscleGroupSets) as MuscleGroup[]).map((m) => ({
      name: m,
      count: muscleGroupSets[m],
    }));

    // Sort by count descending
    const sortedMuscles = [...muscleListWithVolume].sort((a, b) => b.count - a.count);
    const mostTrainedMuscle = sortedMuscles[0].count > 0 ? sortedMuscles[0] : null;
    
    // Lowest muscle that has been hit, or one that has 0 hits (neglected)
    const sortedMusclesAsc = [...muscleListWithVolume].sort((a, b) => a.count - b.count);
    const leastTrainedMuscle = sortedMusclesAsc[0]; // will always pick the true absolute minimum (even if 0)

    // 3. Discover Most and Least Performed Exercises (by sets and then frequency count)
    const exerciseList = Object.keys(exerciseStats).map((name) => ({
      name,
      ...exerciseStats[name],
    }));

    const sortedExercisesDesc = [...exerciseList].sort((a, b) => b.sets - a.sets || b.count - a.count);
    const mostPerformedEx = sortedExercisesDesc.length > 0 ? sortedExercisesDesc[0] : null;

    const sortedExercisesAsc = [...exerciseList].sort((a, b) => a.sets - b.sets || a.count - b.count);
    const leastPerformedEx = sortedExercisesAsc.length > 0 ? sortedExercisesAsc[0] : null;

    return {
      totalSessions,
      totalSets,
      totalReps,
      muscleGroupSets,
      exerciseStats,
      mostTrainedMuscle,
      leastTrainedMuscle,
      mostPerformedEx,
      leastPerformedEx
    };
  }, [workouts]);

  // Filter workouts for interval stimulus calculation
  const filteredWorkoutsForStimulation = useMemo(() => {
    if (stimulationPeriod === 'all') return workouts;
    
    const now = new Date();
    const daysLimit = stimulationPeriod === 'weekly' ? 7 : 30;
    const limitDate = new Date();
    limitDate.setDate(now.getDate() - daysLimit);
    
    return workouts.filter((w) => {
      const wDate = new Date(`${w.date}T12:00:00`);
      return wDate >= limitDate;
    });
  }, [workouts, stimulationPeriod]);

  // Calculate average time in between stimulus for each muscle group
  const averageStimulusIntervals = useMemo(() => {
    const list: MuscleGroup[] = [
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

    const results = [] as {
      muscleGroup: MuscleGroup;
      averageIntervalHours: number | null;
      sessionsCount: number;
      datesCount: number;
      status: 'optimal' | 'extended' | 'infrequent' | 'none';
    }[];

    list.forEach((mg) => {
      // Find all session dates where this muscle was stimulated (had >= 1 set)
      const sessionDates = filteredWorkoutsForStimulation
        .filter((session) =>
          session.exercises.some((ex) => ex.muscleGroup === mg && ex.sets.length > 0)
        )
        .map((session) => session.date)
        .filter((value, index, self) => self.indexOf(value) === index); // unique dates

      // Sort dates chronologically: oldest to newest
      const sortedDates = [...sessionDates].sort((a, b) => a.localeCompare(b));
      
      let averageIntervalHours: number | null = null;
      let status: 'optimal' | 'extended' | 'infrequent' | 'none' = 'none';

      if (sortedDates.length >= 2) {
        let totalDiffMs = 0;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const d1 = new Date(`${sortedDates[i]}T12:00:00`);
          const d2 = new Date(`${sortedDates[i+1]}T12:00:00`);
          totalDiffMs += d2.getTime() - d1.getTime();
        }
        const diffInHours = totalDiffMs / (1000 * 60 * 60) / (sortedDates.length - 1);
        averageIntervalHours = Math.round(diffInHours * 10) / 10; // decimal

        if (averageIntervalHours <= 48.5) {
          status = 'optimal';
        } else if (averageIntervalHours <= 96) {
          status = 'extended';
        } else {
          status = 'infrequent';
        }
      }

      results.push({
        muscleGroup: mg,
        averageIntervalHours,
        sessionsCount: sessionDates.length,
        datesCount: sortedDates.length,
        status: sortedDates.length < 2 ? 'none' : status
      });
    });

    return results;
  }, [workouts]);

  // Handle deep-dive selection
  const deepDiveList = useMemo(() => {
    const list = Object.keys(stats.exerciseStats).map((name) => ({
      name,
      ...stats.exerciseStats[name],
    }));

    if (selectedMuscleDepth === 'All') {
      return [...list].sort((a, b) => b.sets - a.sets);
    }
    return [...list]
      .filter((item) => item.muscle === selectedMuscleDepth)
      .sort((a, b) => b.sets - a.sets);
  }, [stats.exerciseStats, selectedMuscleDepth]);

  // Overall Max sets count for styling percentage bars
  const maxMuscleSets = useMemo(() => {
    const vals = Object.values(stats.muscleGroupSets) as number[];
    const maxVal = Math.max(...vals);
    return maxVal === 0 ? 10 : maxVal;
  }, [stats.muscleGroupSets]);

  // Calculate average sessions/workouts per week
  const averageWorkoutsPerWeek = useMemo(() => {
    if (!workouts || workouts.length === 0) return 0;
    
    // Sort unique dates chronologically
    const uniqueDates = workouts
      .map((w) => w.date)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b));
      
    if (uniqueDates.length === 0) return 0;
    
    const firstDate = new Date(`${uniqueDates[0]}T12:00:00`);
    const lastDate = new Date(`${uniqueDates[uniqueDates.length - 1]}T12:00:00`);
    const today = new Date();
    
    // Calculate weeks elapsed since first workout up to today/lastDate
    const endDate = today.getTime() > firstDate.getTime() ? today : lastDate;
    const diffMs = Math.abs(endDate.getTime() - firstDate.getTime());
    const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
    const numWeeks = Math.max(1, diffMs / oneWeekMs);
    
    const avg = workouts.length / numWeeks;
    return Math.round(avg * 10) / 10;
  }, [workouts]);

  if (!workouts || workouts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs" id="insights-empty-state">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <BarChart3 className="h-8 w-8 text-slate-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Analytics Under Construction</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Please log at least one completed workout session containing set rep logs to activate your interactive dashboard insights drawer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="insights-panel">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="insights-bento-cards">
        
        {/* Most Trained Muscle (Favorite Muscle) */}
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-28 sm:h-30 hover:border-slate-350 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest font-sans">FAVORITE MUSCLE</span>
            <Trophy className="h-3.5 w-3.5 text-slate-350 shrink-0" />
          </div>
          <div className="pt-2">
            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {stats.mostTrainedMuscle ? stats.mostTrainedMuscle.name : 'N/A'}
            </h4>
            <p className="text-[11px] text-slate-550 font-medium font-sans mt-1.5">
              {stats.mostTrainedMuscle 
                ? `${stats.mostTrainedMuscle.count} Sets completed overall` 
                : 'No sets logged yet.'
              }
            </p>
          </div>
        </div>

        {/* Least Trained Muscle (Lagging Muscle) */}
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-28 sm:h-30 hover:border-slate-350 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest font-sans">LAGGING MUSCLE</span>
            <TrendingDown className="h-3.5 w-3.5 text-slate-350 shrink-0" />
          </div>
          <div className="pt-2">
            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {stats.leastTrainedMuscle ? stats.leastTrainedMuscle.name : 'N/A'}
            </h4>
            <p className="text-[11px] text-slate-550 font-medium mt-1.5">
              {stats.leastTrainedMuscle && stats.leastTrainedMuscle.count > 0 
                ? `${stats.leastTrainedMuscle.count} Sets logged — needs focus!` 
                : '0 sets logged (Neglected!)'
              }
            </p>
          </div>
        </div>

        {/* Most Done Exercise (Favorite Lift) */}
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-28 sm:h-30 hover:border-slate-350 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest font-sans">FAVORITE LIFT</span>
            <Dumbbell className="h-3.5 w-3.5 text-slate-350 shrink-0" />
          </div>
          <div className="min-w-0 pt-2">
            <h4 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase" title={stats.mostPerformedEx?.name}>
              {stats.mostPerformedEx ? stats.mostPerformedEx.name : 'N/A'}
            </h4>
            <p className="text-[11px] text-slate-550 font-medium mt-1">
              {stats.mostPerformedEx 
                ? `${stats.mostPerformedEx.sets} sets across ${stats.mostPerformedEx.count} workouts` 
                : 'Log exercises to rank them.'
              }
            </p>
          </div>
        </div>

        {/* Average Workouts Per Week */}
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between h-28 sm:h-30 hover:border-slate-350 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-405 uppercase tracking-widest font-sans">WORKOUT FREQUENCY</span>
            <Calendar className="h-3.5 w-3.5 text-slate-350 shrink-0" />
          </div>
          <div className="pt-2">
            <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {averageWorkoutsPerWeek} / wk
            </h4>
            <p className="text-[11px] text-slate-550 font-medium mt-1.5">
              Across {stats.totalSessions} sessions ({stats.totalSets} total sets)
            </p>
          </div>
        </div>

      </div>

      {/* 1.5 Exercise Weight & Reps History Window */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 font-sans" id="weight-history-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-505" />
              <span>Exercise Weight & Reps History</span>
            </h3>
            <p className="text-[10.5px] text-slate-400">Click any exercise card to review the full chronological log history</p>
          </div>
          
          {/* Quick search input filter for history component */}
          <div className="relative shrink-0 w-full sm:w-64">
            <input
              type="text"
              placeholder="Search exercise history..."
              value={exerciseHistorySearch}
              onChange={(e) => setExerciseHistorySearch(e.target.value)}
              className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-350 transition-all font-sans"
            />
          </div>
        </div>

        {filteredHistoryList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/40 border border-dashed border-slate-255 rounded-xl">
            <p className="text-xs text-slate-400 italic">No exercise logs with reps/weights found to track.</p>
            <p className="text-[10px] text-slate-400 mt-1">Type in reps or weights inside your workout exercises to populate this window!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 font-sans" id="history-exercises-grid">
              {(showAllHistory ? filteredHistoryList : filteredHistoryList.slice(0, 6)).map((item) => {
                // Get the absolute latest logged set for quick preview display
                const latestLog = item.logs[0];
                const bestSetStr = latestLog && latestLog.sets.length > 0 
                  ? `${latestLog.sets[0].weight} kg x ${latestLog.sets[0].reps} reps`
                  : 'N/A';

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedHistoryExercise(item)}
                    className="bg-slate-50/50 hover:bg-slate-100/40 border border-slate-200 hover:border-slate-350 p-4 rounded-xl text-left select-none transition-all cursor-pointer flex flex-col justify-between group h-24 shadow-3xs"
                  >
                    <div className="min-w-0 w-full">
                      <div className="flex items-center justify-between gap-1.5 pr-1">
                        <h4 className="font-extrabold text-slate-800 group-hover:text-slate-900 uppercase tracking-tight text-[11px] truncate">{item.name}</h4>
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider shrink-0 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">{item.muscle}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-405 mt-1 uppercase italic font-bold">Latest Entry:</p>
                      <p className="text-[11px] font-black text-slate-705 font-mono mt-0.5">{bestSetStr}</p>
                    </div>
                    <div className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider mt-1.5 flex items-center gap-0.5 select-none hover:text-slate-800">
                      <span>View full history ({item.logs.reduce((acc, curr) => acc + curr.sets.length, 0)} sets)</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredHistoryList.length > 6 && (
              <div className="flex justify-center pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                >
                  <span>{showAllHistory ? 'Show Less' : `Show All (${filteredHistoryList.length})`}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1.6 Interactive Modal Popup Window for full history logs per exercise */}
      {selectedHistoryExercise && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          onClick={() => setSelectedHistoryExercise(null)}
          id="weight-history-modal"
        >
          <div 
            className="bg-white border border-slate-250 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 select-none">
              <div>
                <span className="text-[9px] font-extrabold text-slate-405 uppercase tracking-widest font-mono select-none">{selectedHistoryExercise.muscle}</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{selectedHistoryExercise.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryExercise(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-405 hover:text-slate-700 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 font-sans">
              {selectedHistoryExercise.logs.map((log, idx) => (
                <div 
                  key={`${log.date}-${idx}`}
                  className="border border-slate-200 rounded-xl bg-slate-50/35 overflow-hidden"
                >
                  {/* Date and Workout Name display bar */}
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-150 flex items-center justify-between text-xs select-none">
                    <span className="font-extrabold text-slate-705 font-mono">
                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md uppercase max-w-[200px] truncate" title={log.workoutName}>
                      {log.workoutName || "Workout Session"}
                    </span>
                  </div>

                  {/* Sets mapping */}
                  <div className="p-3 divide-y divide-slate-100 text-xs bg-white">
                    {log.sets.map((set, sIdx) => (
                      <div 
                        key={sIdx}
                        className="py-2.5 flex items-center justify-between font-sans px-1"
                      >
                        <div className="flex items-center gap-2 select-none">
                          <span className="w-4 h-4 rounded-full bg-slate-50 text-[9px] font-bold text-slate-505 flex items-center justify-center border border-slate-200 shadow-3xs">
                            {sIdx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Set {sIdx + 1}</span>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pr-1 font-sans">Weight:</span>
                            <span className="font-extrabold text-slate-800 font-mono">
                              {set.weight} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[9.5px] text-slate-400 uppercase tracking-wider pr-1 font-sans">Reps:</span>
                            <span className="font-extrabold text-slate-800 font-mono">
                              {set.reps !== '' ? `${set.reps} reps` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer CTA */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryExercise(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-3xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Double Column: Muscle Volume Leaderboard & Stalwarts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Muscle Stimulation Intervals (Left column, span 7) */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs md:col-span-7 space-y-4 animate-fade-in" id="inter-stimulus-analyzer-block">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-905 flex items-center gap-1.5">
                <span>Average Muscle Stimulation Intervals</span>
              </h3>
              
              {/* Stimulation time period key toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Period:</span>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {(['all', 'weekly', 'monthly'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStimulationPeriod(p)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                        stimulationPeriod === p
                          ? 'bg-white text-slate-800 shadow-3xs border border-slate-200/50'
                          : 'text-slate-400 hover:text-slate-600 border border-transparent'
                      }`}
                    >
                      {p === 'all' ? 'All' : p === 'weekly' ? 'Weekly' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-md p-1 px-2 text-[9px] font-bold text-emerald-805 font-sans shrink-0 self-start sm:self-auto">
              Target: ~48 Hours
            </div>
          </div>

          {/* Scientific Hypertrophy Guidance Statement Box - Simple text-based without pictogram */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 select-none">
            <p className="text-[10.5px] text-slate-650 leading-relaxed font-sans font-medium">
              To maximize hypertrophy with proper recovery, stimulate target muscles roughly every <strong className="text-slate-950 font-bold">48 hours</strong> using low-volume intensity resistance workloads.
            </p>
          </div>

          {/* Gaps List Table */}
          <div className="space-y-2.5 font-sans">
            {averageStimulusIntervals.map((item) => {
              const value = item.averageIntervalHours;
              const percent = value ? Math.min(100, Math.max(0, (value / 120) * 100)) : 0;
              
              let badgeStyle = '';
              let textStatus = '';
              let textColor = '';

              if (item.status === 'optimal') {
                badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                textStatus = 'Optimal';
                textColor = 'text-emerald-700';
              } else if (item.status === 'extended') {
                badgeStyle = 'bg-amber-50 text-amber-800 border-amber-100';
                textStatus = 'Extended';
                textColor = 'text-amber-700';
              } else if (item.status === 'infrequent') {
                badgeStyle = 'bg-rose-50 text-rose-850 border-rose-100';
                textStatus = 'Infrequent';
                textColor = 'text-rose-700';
              } else {
                badgeStyle = 'bg-slate-100 text-slate-450 border-slate-200';
                textStatus = 'None';
                textColor = 'text-slate-400';
              }

              return (
                <div 
                  key={item.muscleGroup} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/40 border border-slate-205/60 p-2.5 rounded-xl hover:bg-slate-50 transition-all font-sans"
                >
                  <div className="min-w-0 flex items-center justify-between sm:justify-start gap-2">
                    <h4 className="text-xs font-black text-slate-805 uppercase tracking-tight">{item.muscleGroup}</h4>
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[8px] font-bold ${badgeStyle}`}>
                      {textStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 sm:w-44">
                    {value === null ? (
                      <span className="text-[9px] text-slate-400 font-sans italic">Need 2+ hits</span>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="relative w-24 sm:w-28 h-2 bg-slate-150 rounded-full flex items-center select-none">
                          <div className="absolute left-0 h-full w-[40%] bg-emerald-500/10 rounded-l-full border-r border-dotted border-emerald-400" />
                          <div 
                            className="absolute -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border border-white rounded-full shadow-xs"
                            style={{ left: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="text-right min-w-[40px]">
                      <span className={`text-[11.5px] font-black font-mono leading-none ${textColor}`}>
                        {value === null ? '—' : `${value}h`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular exercises staples (Right column, span 5) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs md:col-span-5 space-y-4" id="exercise-popularity-block">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Exercise Popularity</span>
            </h3>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Staples</span>
          </div>

          {/* Leaderboard mapping top 4 exercises performed */}
          <div className="space-y-3 font-sans">
            {Object.keys(stats.exerciseStats).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No logged records found.</p>
            ) : (
              [...Object.keys(stats.exerciseStats)]
                .map((name) => ({ name, ...stats.exerciseStats[name] }))
                .sort((a, b) => b.sets - a.sets || b.count - a.count)
                .slice(0, 5)
                .map((ex, idx) => (
                  <div 
                    key={ex.name} 
                    className="flex justify-between items-center bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-xs hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-[10px] text-white font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-805 truncate text-left uppercase text-[10px]">{ex.name}</p>
                        <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">{ex.muscle}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-500 font-mono shrink-0">
                      {ex.sets} Sets
                    </span>
                  </div>
                ))
            )}
          </div>

          <div className="pt-2">
            <div className="bg-emerald-50/55 border border-emerald-100 rounded-xl p-3 text-[11px] text-slate-650 leading-relaxed font-sans">
              <strong className="text-emerald-800">Training Balance Guideline:</strong> Alternate sessions prioritizing your <strong className="text-slate-900 font-bold">Lagging Muscle ({stats.leastTrainedMuscle?.name || 'N/A'})</strong> to achieve optimal muscular distribution.
            </div>
          </div>

        </div>

      </div>

      {/* 3. Interactive Deep Dive Component Block */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4 font-sans" id="deep-dive-block">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Exercise Deep Dive Breakdown</span>
            </h3>
            <p className="text-[10px] text-slate-400">See total sets logged per exercise targeting selected muscle group</p>
          </div>

          {/* Controls: Muscle Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Muscle Group Select filter */}
            <div className="flex items-center gap-1.55">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">Muscle:</span>
              <select
                value={selectedMuscleDepth}
                onChange={(e) => setSelectedMuscleDepth(e.target.value as MuscleGroup | 'All')}
                className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                <option value="All">All Muscles Combined</option>
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg.name} value={mg.name}>
                    {mg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {deepDiveList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-250 rounded-xl">
            <p className="text-xs text-slate-400 italic">
              No exercises logged for the muscle group <strong className="text-slate-600 font-bold">{selectedMuscleDepth}</strong> yet.
            </p>
            <p className="text-[10.5px] text-slate-400 mt-2">
              Go to the **Add Workout** tab or click the "+" button in the calendar to log an exercise targeting this profile!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="depth-cards-grid">
              {(isDeepDiveExpanded ? deepDiveList : deepDiveList.slice(0, 6)).map((item) => (
                <div 
                  key={item.name}
                  className="bg-slate-50/40 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-350 p-4 rounded-xl flex items-center justify-between text-xs transition-colors font-sans"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-extrabold text-slate-805 truncate text-left uppercase text-[11px]">{item.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 font-sans">
                      <span className="text-[8px] font-bold text-white bg-slate-600 px-1.5 py-0.2 rounded select-none uppercase tracking-wider">
                        {item.muscle}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • Logged in {item.count} distinct sessions
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-850 font-mono leading-none">{item.sets}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Sets</p>
                  </div>
                </div>
              ))}
            </div>

            {deepDiveList.length > 6 && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeepDiveExpanded(!isDeepDiveExpanded)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{isDeepDiveExpanded ? "Show Fewer Exercises" : `Show All Exercises (${deepDiveList.length})`}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
