/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutSession } from './types';
import { loadWorkouts, saveWorkouts } from './utils';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutHistory from './components/WorkoutHistory';
import MuscleFrequency from './components/MuscleFrequency';
import MuscleVolume from './components/MuscleVolume';
import TrainingInsights from './components/TrainingInsights';
import { Dumbbell, Calendar, Activity, Layers, Plus, Check, Smartphone, Database, Sparkles, TrendingUp } from 'lucide-react';
import { MuscleGroup } from './types';

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'frequency' | 'volume' | 'log' | 'insights'>('history');
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [prefilledMuscle, setPrefilledMuscle] = useState<MuscleGroup | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Load workouts on first mount
  useEffect(() => {
    setWorkouts(loadWorkouts());
  }, []);

  // Automatically clear notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle saving new or updated workouts
  const handleSaveSession = (newSession: WorkoutSession) => {
    let updatedWorkouts: WorkoutSession[];

    const exists = workouts.some((w) => w.id === newSession.id);
    if (exists) {
      updatedWorkouts = workouts.map((w) => (w.id === newSession.id ? newSession : w));
      setNotification({ message: 'Workout logs updated successfully.', type: 'info' });
    } else {
      updatedWorkouts = [newSession, ...workouts];
      setNotification({ message: 'New workout session logged successfully!', type: 'success' });
    }

    setWorkouts(updatedWorkouts);
    saveWorkouts(updatedWorkouts);
    setEditSession(null);
    // Pivot to history tab so the user can inspect their logged card
    setActiveTab('history');
  };

  // Handle deleting a session
  const handleDeleteSession = (id: string) => {
    const updated = workouts.filter((w) => w.id !== id);
    setWorkouts(updated);
    saveWorkouts(updated);
    setNotification({ message: 'Session log removed.', type: 'info' });
  };

  // Handle editing a session
  const handleEditSession = (session: WorkoutSession) => {
    setEditSession(session);
    setActiveTab('log'); // Redirect to log forms with loaded payload!
  };

  const handleCancelEdit = () => {
    setEditSession(null);
    setActiveTab('history');
  };

  // Helper sets count completed in the last 7 days vs all-time
  const sevenDaysAgoForHeader = new Date();
  sevenDaysAgoForHeader.setDate(sevenDaysAgoForHeader.getDate() - 7);
  sevenDaysAgoForHeader.setHours(0, 0, 0, 0);

  let totalSetsCountForHeader = 0;
  let setsThisWeekCountForHeader = 0;

  workouts.forEach((session) => {
    const sessionDate = new Date(`${session.date}T12:00:00`);
    const isThisWeek = sessionDate >= sevenDaysAgoForHeader;
    
    session.exercises.forEach((ex) => {
      totalSetsCountForHeader += ex.sets.length;
      if (isThisWeek) {
        setsThisWeekCountForHeader += ex.sets.length;
      }
    });
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-805 flex flex-col selection:bg-emerald-500 selection:text-white" id="master-container">
      
      {/* Top Professional Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80" id="app-header">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-4 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <Dumbbell className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                WORKOUT<span className="font-light text-slate-400">LOGGER</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5 tracking-wider">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>A product of Simon Haesaert</span>
              </p>
            </div>
          </div>


        </div>
      </header>

      {/* Main Core Body Segment */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6" id="app-body">
        
        {/* Dynamic Interactive Slide Notification Banner */}
        {notification && (
          <div
            id="toast-notification"
            className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs transition-all shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Tab Buttons Deck Layout */}
        <div className="grid grid-cols-5 bg-slate-100 p-1 sm:p-1.5 rounded-2xl border border-slate-200/80 gap-1 sm:gap-1.5 shadow-3xs mb-2 sm:mb-4" id="navigation-tabs">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 sm:py-3.5 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-805'
            }`}
            id="tab-history"
          >
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-700" />
            <span className="hidden sm:inline">History / Calendar</span>
            <span className="sm:hidden">History</span>
          </button>

          <button
            onClick={() => { setActiveTab('frequency'); setEditSession(null); }}
            className={`py-2.5 sm:py-3.5 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'frequency'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-805'
            }`}
            id="tab-frequency"
          >
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-500" />
            <span className="hidden sm:inline">Muscle Frequency</span>
            <span className="sm:hidden">Frequency</span>
          </button>

          <button
            onClick={() => { setActiveTab('volume'); setEditSession(null); }}
            className={`py-2.5 sm:py-3.5 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'volume'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-805'
            }`}
            id="tab-volume"
          >
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-500" />
            <span className="hidden sm:inline">Muscle Volume</span>
            <span className="sm:hidden">Volume</span>
          </button>

          <button
            onClick={() => { setActiveTab('insights'); setEditSession(null); }}
            className={`py-2.5 sm:py-3.5 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white text-slate-850 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-805'
            }`}
            id="tab-insights"
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-505" />
            <span className="hidden sm:inline">Insights</span>
            <span className="sm:hidden">Insights</span>
          </button>

          <button
            onClick={() => { setActiveTab('log'); setEditSession(null); setPrefilledDate(null); setPrefilledMuscle(null); }}
            className={`py-2.5 sm:py-3.5 rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'log'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-805'
            }`}
            id="tab-log"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-500" />
            <span className="hidden sm:inline">{editSession ? 'Edit Log' : 'Add Workout'}</span>
            <span className="sm:hidden">{editSession ? 'Edit' : 'Add'}</span>
          </button>
        </div>

        {/* Dynamic Panel Frame Router */}
        <div className="min-h-[400px]" id="tab-viewport">
          {activeTab === 'log' && (
            <WorkoutCreator
              onSaveSession={handleSaveSession}
              editSession={editSession}
              onCancelEdit={handleCancelEdit}
              prefilledDate={prefilledDate}
              prefilledMuscle={prefilledMuscle}
            />
          )}

          {activeTab === 'history' && (
            <WorkoutHistory
              workouts={workouts}
              onDeleteSession={handleDeleteSession}
              onEditSession={handleEditSession}
              onGoToLogWithDate={(date) => {
                setPrefilledDate(date);
                setPrefilledMuscle(null);
                setEditSession(null);
                setActiveTab('log');
              }}
            />
          )}

          {activeTab === 'frequency' && (
            <MuscleFrequency
              workouts={workouts}
              onTargetMuscle={(muscle) => {
                setPrefilledMuscle(muscle);
                setPrefilledDate(null);
                setEditSession(null);
                setActiveTab('log');
              }}
            />
          )}

          {activeTab === 'volume' && (
            <MuscleVolume
              workouts={workouts}
            />
          )}

          {activeTab === 'insights' && (
            <TrainingInsights
              workouts={workouts}
            />
          )}
        </div>
      </main>

      {/* Footer Meta Credits Row */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center border-t border-slate-800" id="app-footer">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] uppercase font-bold tracking-widest font-sans">
          <p className="flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
            <span>PWA Ready • Install on Home Screen</span>
          </p>
          <div className="flex gap-4 items-center">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span>Offline Local Storage</span>
            </span>
            <span className="text-emerald-500">• Secure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
