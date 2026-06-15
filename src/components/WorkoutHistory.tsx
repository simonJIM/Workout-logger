/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkoutSession, MuscleGroup } from '../types';
import { MUSCLE_GROUPS, getSecondaryMuscles } from '../presets';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Layers, 
  TrendingUp,
  Bookmark,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus
} from 'lucide-react';

interface WorkoutHistoryProps {
  workouts: WorkoutSession[];
  onDeleteSession: (id: string) => void;
  onEditSession: (session: WorkoutSession) => void;
  onGoToLogWithDate?: (date: string) => void;
}

export default function WorkoutHistory({ 
  workouts, 
  onDeleteSession, 
  onEditSession, 
  onGoToLogWithDate 
}: WorkoutHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMuscleFilter, setActiveMuscleFilter] = useState<MuscleGroup | 'All'>('All');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Track which sessions are collapsed (default is collapsed)
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});

  // Muscle tags theme helper matching frequency
  const getMuscleStyle = (muscle: MuscleGroup) => {
    const defaultStyle = { name: 'Other', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' };
    return MUSCLE_GROUPS.find((mg) => mg.name === muscle) || defaultStyle;
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSessions((prev) => {
      const currentVal = prev[id] !== false; // true if unset, hence default collapsed
      return {
        ...prev,
        [id]: !currentVal
      };
    });
  };

  // Human date formatting helper
  const getFriendlyDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const targetDate = new Date(`${dateStr}T12:00:00`);
        const weekday = targetDate.toLocaleDateString([], { weekday: 'long' });
        // European standard: DD/MM/YYYY
        return `${weekday}, ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Core calendar helper math
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0-indexed

  // First day of current month (0 is Sunday, 1 is Monday... let's align Monday first)
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
  // Total days in current month
  const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  
  // Day of week of the first day (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = firstDayOfMonth.getDay(); 

  // Generate date fields for Monday-start calendar grid
  const calendarDays: { dateString: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Padding days from previous month
  const prevMonthTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();
  const indexStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Align to Monday first

  for (let i = indexStart - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevMonthVal = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const prevYearVal = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const dateStr = `${prevYearVal}-${String(prevMonthVal + 1).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
    calendarDays.push({ dateString: dateStr, dayNum: prevDay, isCurrentMonth: false });
  }

  // Active month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ dateString: dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Padding days for next month to complete standard calendar grid (multiples of 7)
  const remainingCells = 42 - calendarDays.length;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthVal = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYearVal = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    const dateStr = `${nextYearVal}-${String(nextMonthVal + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    calendarDays.push({ dateString: dateStr, dayNum: n, isCurrentMonth: false });
  }

  const getWorkoutsForDate = (dateString: string) => {
    return workouts.filter(w => w.date === dateString);
  };

  // Filter logs chronologically (latest first)
  const filteredWorkouts = workouts.filter((session) => {
    const matchesSearch = 
      session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.notes && session.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.exercises.some((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMuscleGroup =
      activeMuscleFilter === 'All' ||
      session.exercises.some((ex) => 
        ex.muscleGroup === activeMuscleFilter || 
        getSecondaryMuscles(ex.name, ex.muscleGroup).includes(activeMuscleFilter)
      );

    const matchesDate = !selectedDateFilter || session.date === selectedDateFilter;

    return matchesSearch && matchesMuscleGroup && matchesDate;
  }).sort((a, b) => {
    // Sort primarily by date desc, then by time desc
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    if (a.time && b.time) return b.time.localeCompare(a.time);
    return 0;
  });

  // Calculate stats for current filtered list
  const totalSetsCount = filteredWorkouts.reduce((acc, ws) => {
    return acc + ws.exercises.reduce((exAcc, ex) => exAcc + ex.sets.length, 0);
  }, 0);

  const totalVolumeLoad = filteredWorkouts.reduce((acc, ws) => {
    return acc + ws.exercises.reduce((exAcc, ex) => {
      return exAcc + ex.sets.reduce((setAcc, s) => {
        const w = typeof s.weight === 'number' ? s.weight : 0;
        const r = typeof s.reps === 'number' ? s.reps : 0;
        return setAcc + (w * r);
      }, 0);
    }, 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in" id="history-feed-panel">
      
      {/* 📅 Consistency & Frequency Calendar card */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs space-y-4 animate-fade-in" id="consistency-calendar-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center shadow-3xs">
              <Calendar className="h-4.5 w-4.5 text-slate-800 shrink-0" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Consistency Calendar</h3>
              <p className="text-[10px] text-slate-450 font-sans mt-0.5">Visualize workouts done or tap days to filter lists / log dates</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
            {/* Nav controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const prevMonth = new Date(calendarYear, calendarMonth - 1, 1);
                  setCurrentCalendarDate(prevMonth);
                }}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all text-slate-600 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-[11px] font-extrabold text-slate-800 font-sans min-w-[95px] text-center bg-slate-50 border border-slate-150 py-1.5 px-2 rounded-lg">
                {currentCalendarDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </span>

              <button
                onClick={() => {
                  const nextMonth = new Date(calendarYear, calendarMonth + 1, 1);
                  setCurrentCalendarDate(nextMonth);
                }}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all text-slate-600 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="text-[9px] uppercase tracking-wide font-black text-slate-400 border border-dashed border-red-200 bg-red-50/40 px-2 py-1.5 rounded-lg hover:border-red-350 hover:text-red-500 transition-all cursor-pointer"
              >
                Reset Date Select
              </button>
            )}
          </div>
        </div>

        {/* Calendar Core Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]" id="calendar-days-grid">
          {/* Day Names Grid Column titles */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dayName => (
            <div key={dayName} className="font-semibold text-[9.5px] uppercase tracking-wider text-slate-450 py-1 font-sans">
              {dayName}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            const dateWorkouts = getWorkoutsForDate(day.dateString);
            const hasWorkout = dateWorkouts.length > 0;
            const isSelected = selectedDateFilter === day.dateString;
            
            // Stylings
            let dayBg = 'bg-transparent text-slate-700 hover:bg-slate-50/80';
            let borderCls = 'border border-slate-100/50';

            if (!day.isCurrentMonth) {
              dayBg = 'bg-transparent text-slate-300 opacity-30';
            }

            if (hasWorkout) {
              if (isSelected) {
                dayBg = 'bg-slate-900 text-white font-extrabold shadow-sm scale-102 ring-2 ring-slate-950/20';
              } else {
                dayBg = 'bg-slate-50 text-slate-900 border border-slate-350 font-bold hover:bg-slate-100';
              }
            } else if (isSelected) {
              dayBg = 'bg-slate-800 text-white border-slate-950 scale-102';
            }

            return (
              <div
                key={`${day.dateString}-${idx}`}
                onClick={() => {
                  if (hasWorkout) {
                    if (isSelected) {
                      setSelectedDateFilter(null); // Toggle off
                    } else {
                      setSelectedDateFilter(day.dateString); // Filter down to this date
                    }
                  } else {
                    // Empty date - suggest creating a log
                    if (onGoToLogWithDate) {
                      onGoToLogWithDate(day.dateString);
                    }
                  }
                }}
                className={`group relative py-2 sm:py-3 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center select-none ${dayBg} ${borderCls}`}
                title={hasWorkout ? `${dateWorkouts.length} Workout(s): ${dateWorkouts.map(w => w.name).join(', ')}` : 'No workout recorded. Click to log exercises!'}
              >
                <span className="text-xs font-mono">{day.dayNum}</span>
                
                {/* Visual mini-dot on active day */}
                {hasWorkout && !isSelected && (
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mt-1" />
                )}

                {/* Nice clean hover popover title badge for workouts */}
                {hasWorkout && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none min-w-[160px] max-w-[200px] shadow-sm">
                    <div className="bg-slate-950 text-white text-[9px] font-sans rounded-lg p-2 leading-tight text-center border border-slate-800">
                      <p className="font-extrabold border-b border-white/20 pb-1 tracking-wider uppercase mb-1">{day.dateString}</p>
                      {dateWorkouts.map((w) => (
                        <p key={w.id} className="opacity-95 truncate text-left font-medium">
                          • {w.name}
                        </p>
                      ))}
                    </div>
                    <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1.25 border-r border-b border-slate-950" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modern Search and Quick Filter Box */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs space-y-4" id="filters-container">
        <div className="relative" id="history-search-bar">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search workout labels, custom notes, or exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-450 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-sans"
          />
        </div>

        {/* Simple elegant, space-saving Dropdown filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100/60 mt-1" id="muscle-filtering-dropdown-container">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-sans">Filter Target Muscle:</span>
            <div className="relative inline-block">
              <select
                value={activeMuscleFilter}
                onChange={(e) => setActiveMuscleFilter(e.target.value as MuscleGroup | 'All')}
                className="bg-slate-50 border border-slate-200 hover:border-slate-350 text-xs font-bold rounded-xl pl-3 pr-8 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer appearance-none shadow-3xs"
              >
                <option value="All">All Muscles Combined</option>
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg.name} value={mg.name}>
                    {mg.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {activeMuscleFilter !== 'All' && (
            <button 
              onClick={() => setActiveMuscleFilter('All')}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 underline transition-colors cursor-pointer self-start sm:self-auto"
            >
              Clear Filter Selection
            </button>
          )}
        </div>
      </div>

      {/* Main Stream Chronological Feed */}
      <div className="space-y-4" id="chronological-workouts-stream mt-2">
        {filteredWorkouts.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3" id="feed-empty-state">
            <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto shadow-3xs">
              <AlertCircle className="h-6 w-6 text-slate-350" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700">No sessions identified</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery || activeMuscleFilter !== 'All'
                  ? "We couldn't locate logged workouts matching these search conditions. Swap filters to browse logs."
                  : "Start logging your routines to compile a functional training chronological path!"
                }
              </p>
            </div>
            {!searchQuery && activeMuscleFilter === 'All' && onGoToLogWithDate && (
              <button
                onClick={() => onGoToLogWithDate(new Date().toISOString().split('T')[0])}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log first workout</span>
              </button>
            )}
          </div>
        ) : (
          filteredWorkouts.map((session) => {
            const isCollapsed = collapsedSessions[session.id] !== false;
            const friendlyDay = getFriendlyDate(session.date);
            
            // Stats computed specifically for this session
            const sessionSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
            const sessionVolume = session.exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((setAcc, s) => {
                const w = typeof s.weight === 'number' ? s.weight : 0;
                const r = typeof s.reps === 'number' ? s.reps : 0;
                return setAcc + (w * r);
              }, 0);
            }, 0);

            // Fetch distinct muscle group strings hit in this session
            const distinctMuscles = Array.from(new Set(session.exercises.map(ex => ex.muscleGroup)));

            return (
              <div 
                key={session.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow-sm transition-all overflow-hidden"
                id={`workout-feed-card-${session.id}`}
              >
                {/* Card Main Top Bar header */}
                <div 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 border-b border-slate-100 select-none cursor-pointer"
                  onClick={() => toggleCollapse(session.id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {(() => {
                      const dateParts = session.date.split('-');
                      const formattedMinDate = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : '09/06';
                      return (
                        <div className="w-12 h-10 bg-slate-950 text-white rounded-xl flex flex-col items-center justify-center shrink-0 font-mono shadow-2xs font-bold text-[11px] border border-slate-900 select-none">
                          <span>{formattedMinDate}</span>
                        </div>
                      );
                    })()}
                    
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                          {session.name || 'Strength Session'}
                        </h3>
                        <span className="text-[9px] font-sans font-bold text-slate-400 shrink-0 mt-0.5">
                          {isCollapsed ? '(Collapsed)' : ''}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-slate-500 font-medium">
                        <span className="font-extrabold font-sans text-slate-800">{friendlyDay}</span>
                        {session.time && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-0.5 font-mono text-[9.5px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {session.time}
                            </span>
                          </>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-slate-450">{session.exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Toggle Drawer icons (Stop event bubbling correctly for child button clicks) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-0 border-slate-100 pt-2 sm:pt-0">
                    
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {confirmDeleteId === session.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-lg text-red-700 font-bold text-[10px] animate-fade-in shrink-0">
                          <span>Confirm Delete?</span>
                          <button
                            onClick={() => {
                              onDeleteSession(session.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded px-1.5 py-0.5 text-[9px] uppercase font-black transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-1.5 py-0.5 text-[9px] uppercase font-black transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onEditSession(session)}
                            className="p-1.5 hover:bg-slate-100 border border-slate-205 rounded-lg text-slate-600 transition-colors"
                            title="Edit log details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(session.id)}
                            className="p-1.5 hover:bg-red-50 hover:border-red-200 border border-slate-205 rounded-lg text-slate-450 hover:text-red-650 transition-colors"
                            title="Delete log permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleCollapse(session.id)}
                        className="p-1.5 hover:bg-slate-100 border border-slate-205 rounded-lg text-slate-450 hidden sm:block"
                      >
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Exercises Details View */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-4 font-sans text-xs">
                    
                    {/* Optional customized training note block */}
                    {session.notes && (
                      <div className="p-3 bg-neutral-50/70 border border-slate-200/65 rounded-xl leading-relaxed text-[11px] text-slate-600 shadow-3xs flex items-start gap-2 animate-fade-in">
                        <Bookmark className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 text-[10.5px] uppercase font-sans tracking-wide block mb-0.5">Session Note</strong>
                          <span>{session.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Exercises checklist stream */}
                    <div className="space-y-3">
                      {session.exercises.map((ex, exIdx) => {
                        const style = getMuscleStyle(ex.muscleGroup);
                        const isSetsOnly = ex.sets.every(set => 
                          (set.weight === '' || set.weight === 0 || set.weight === undefined) && 
                          (set.reps === '' || set.reps === 0 || set.reps === undefined)
                        );

                        return (
                          <div 
                            key={ex.id} 
                            className="bg-slate-50/40 hover:bg-slate-50/80 transition-colors border border-slate-200/60 p-3 sm:p-4 rounded-xl space-y-2.5 shadow-3xs"
                          >
                            {/* Exercise label + Target Muscle badge */}
                            <div className="flex items-center justify-between font-bold text-xs text-slate-800 gap-2">
                              <span className="truncate flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-mono font-semibold">#{exIdx + 1}</span>
                                <span className="text-slate-900 font-extrabold text-[12.5px] leading-none">{ex.name}</span>
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-widest border rounded-full px-2 py-0.5 shrink-0 ${style.bg} ${style.text} ${style.ring}`}>
                                {ex.muscleGroup}
                              </span>
                            </div>

                            {/* Exercises Table of Sets aligned with Hevy design, or a clean count badge if weight/reps aren't specified */}
                            {isSetsOnly ? (
                              <div className="pt-1 select-none">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-650 rounded-xl text-[11px] font-bold font-sans border border-slate-200/50">
                                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{ex.sets.length} {ex.sets.length === 1 ? 'Set' : 'Sets'} Completed</span>
                                </span>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200/60 text-[8.5px] text-slate-400 uppercase tracking-widest font-black">
                                      <th className="py-1 w-10 text-center">Set</th>
                                      <th className="py-1 pl-3">Weight (kg/lbs)</th>
                                      <th className="py-1 pl-3">Reps</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {ex.sets.map((set, setIdx) => (
                                      <tr key={set.id} className="text-slate-700 font-sans">
                                        {/* Rounded numeric index */}
                                        <td className="py-1.5 text-center">
                                          <span className="inline-block w-5 h-5 bg-slate-200/50 text-slate-500 font-extrabold font-mono text-[9px] rounded-md leading-5">
                                            {setIdx + 1}
                                          </span>
                                        </td>
                                        {/* Decimals / values weights */}
                                        <td className="py-1.5 pl-3 font-mono font-bold text-slate-850">
                                          {set.weight !== '' && set.weight !== undefined ? (
                                            <span className="text-[11.5px]">{set.weight} kg</span>
                                          ) : (
                                            <span className="text-slate-300 font-normal text-[10px]">—</span>
                                          )}
                                        </td>
                                        {/* Reps counts */}
                                        <td className="py-1.5 pl-3 font-mono font-bold text-slate-850">
                                          {set.reps !== '' && set.reps !== undefined ? (
                                            <span className="text-[11.5px] text-slate-900">{set.reps} reps</span>
                                          ) : (
                                            <span className="text-slate-300 font-normal">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                    {/* Quick collapsed actions bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-sans">
                      <div className="flex gap-2.5">
                        <span>Target Areas:</span>
                        <div className="flex flex-wrap gap-1">
                          {distinctMuscles.map(m => (
                            <span key={m} className="font-semibold text-slate-650">{m}</span>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleCollapse(session.id)}
                        className="text-slate-400 hover:text-slate-700 underline font-semibold cursor-pointer"
                      >
                        Collapse card
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
