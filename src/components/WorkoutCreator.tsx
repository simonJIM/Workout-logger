/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkoutSession, ExerciseLog, SetLog, MuscleGroup, ExercisePreset } from '../types';
import { EXERCISE_PRESETS, MUSCLE_GROUPS } from '../presets';
import { Plus, Trash2, Dumbbell, Save, RefreshCw, X, HelpCircle, Check, ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

interface WorkoutCreatorProps {
  onSaveSession: (session: WorkoutSession) => void;
  editSession: WorkoutSession | null;
  onCancelEdit: () => void;
  prefilledDate?: string | null;
  prefilledMuscle?: MuscleGroup | null;
}

export default function WorkoutCreator({ onSaveSession, editSession, onCancelEdit, prefilledDate, prefilledMuscle }: WorkoutCreatorProps) {
  // Prep today's date in local formatted timezone YYYY-MM-DD
  const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Prep today's time in local format HH:MM
  const getTodayTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // State parameters
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getTodayTime());
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  
  // State for active autocomplete search lists
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExSearchIdx, setActiveExSearchIdx] = useState<number | null>(null);

  const [exerciseToMuscleMap, setExerciseToMuscleMap] = useState<Record<string, MuscleGroup>>({});
  const [customPresets, setCustomPresets] = useState<ExercisePreset[]>([]);
  const [newCustomPresetName, setNewCustomPresetName] = useState('');
  const [newCustomPresetMuscle, setNewCustomPresetMuscle] = useState<MuscleGroup>('Chest');
  const [showCustomManager, setShowCustomManager] = useState(false);

  // Drag and drop state for exercise reordering
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Load exercise-muscle mappings and custom exercise presets on mount
  useEffect(() => {
    const savedMap = localStorage.getItem('exercise_to_muscle_mappings');
    if (savedMap) {
      try {
        const parsed = JSON.parse(savedMap);
        // Force correct 'Calves' association for default calf exercises to override old stale cache
        const calfExs = ['calf raises', 'seated calf raise', 'standing calf raise', 'donkey calf raise', 'calf raise'];
        calfExs.forEach(name => {
          if (parsed[name] === 'Hamstrings' || !parsed[name]) {
            parsed[name] = 'Calves';
          }
        });
        setExerciseToMuscleMap(parsed);
        localStorage.setItem('exercise_to_muscle_mappings', JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }
    const savedCustomPresets = localStorage.getItem('custom_exercise_presets');
    if (savedCustomPresets) {
      try {
        setCustomPresets(JSON.parse(savedCustomPresets));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAddCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomPresetName.trim()) return;

    const nameLower = newCustomPresetName.trim().toLowerCase();
    const isDuplicate = EXERCISE_PRESETS.some(p => p.name.toLowerCase() === nameLower) || 
                        customPresets.some(p => p.name.toLowerCase() === nameLower);
    
    if (isDuplicate) {
      alert("This exercise preset already exists in the default or custom list!");
      return;
    }

    const newPreset: ExercisePreset = {
      name: newCustomPresetName.trim(),
      muscleGroup: newCustomPresetMuscle
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('custom_exercise_presets', JSON.stringify(updated));
    setNewCustomPresetName('');
  };

  const handleDeleteCustomPreset = (nameToDelete: string) => {
    const updated = customPresets.filter(p => p.name !== nameToDelete);
    setCustomPresets(updated);
    localStorage.setItem('custom_exercise_presets', JSON.stringify(updated));
  };

  const allAvailableExercises = [...EXERCISE_PRESETS, ...customPresets];

  const saveExerciseMuscleMapping = (exName: string, mGroup: MuscleGroup) => {
    if (!exName.trim()) return;
    const cleanedName = exName.trim().toLowerCase();
    setExerciseToMuscleMap((prev) => {
      const updated = {
        ...prev,
        [cleanedName]: mGroup
      };
      localStorage.setItem('exercise_to_muscle_mappings', JSON.stringify(updated));
      return updated;
    });
  };

  // Initialize or re-hydrate when editing an existing workout
  useEffect(() => {
    if (editSession) {
      setDate(editSession.date);
      setTime(editSession.time || getTodayTime());
      setName(editSession.name);
      setNotes(editSession.notes || '');
      // Deep clone to avoid mutating parent state
      const clonedExercises = JSON.parse(JSON.stringify(editSession.exercises)) as ExerciseLog[];
      clonedExercises.forEach((ex, idx) => {
        if (!ex.id) {
          ex.id = `ex-loaded-${idx}-${Date.now()}-${Math.random()}`;
        }
        if (ex.sets) {
          ex.sets.forEach((set, sIdx) => {
            if (!set.id) {
              set.id = `set-loaded-${idx}-${sIdx}-${Date.now()}-${Math.random()}`;
            }
          });
        }
      });
      setExercises(clonedExercises);
    } else {
      resetForm();
      if (prefilledDate) {
        setDate(prefilledDate);
      }
      if (prefilledMuscle) {
        // Find a matching preset or start empty
        const matched = allAvailableExercises.find((p) => p.muscleGroup === prefilledMuscle);
        const nameToUse = matched ? matched.name : '';
        const newEx = {
          id: `ex-${Date.now()}-${Math.random()}`,
          name: nameToUse,
          muscleGroup: prefilledMuscle,
          sets: [
            { id: `set-${Date.now()}-1`, weight: '' as const, reps: '' as const }
          ]
        };
        setExercises([newEx]);
      }
    }
  }, [editSession, prefilledDate, prefilledMuscle]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newExs = [...exercises];
    const temp = newExs[draggedIdx];
    newExs[draggedIdx] = newExs[index];
    newExs[index] = temp;
    setDraggedIdx(index);
    setExercises(newExs);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const resetForm = () => {
    setDate(getTodayDate());
    setTime(getTodayTime());
    setName('');
    setNotes('');
    setExercises([]);
    setSearchQuery('');
    setActiveExSearchIdx(null);
  };

  // Add a blank exercise block
  const handleAddExercise = (presetName?: string, presetGroup?: MuscleGroup) => {
    const newEx: ExerciseLog = {
      id: `ex-${Date.now()}-${Math.random()}`,
      name: presetName || '',
      muscleGroup: presetGroup || 'Chest',
      sets: [
        { id: `set-${Date.now()}-1`, weight: '', reps: '' } // start with one blank set
      ]
    };
    setExercises([...exercises, newEx]);
    setSearchQuery('');
    setActiveExSearchIdx(null);
  };

  // Delete exercise block
  const handleDeleteExercise = (exId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exId));
  };

  // Modify exercise name or group
  const handleExerciseChange = (exId: string, updates: Partial<ExerciseLog>) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exId) {
          const merged = { ...ex, ...updates };

          // Auto-fill muscle group if exercise name is changed and we have a map or preset
          if (updates.name !== undefined && updates.name.trim()) {
            const queryKey = updates.name.trim().toLowerCase();
            const matchedPreset = allAvailableExercises.find(p => p.name.toLowerCase() === queryKey);
            if (matchedPreset) {
              merged.muscleGroup = matchedPreset.muscleGroup;
            } else {
              const mappedMuscle = exerciseToMuscleMap[queryKey];
              if (mappedMuscle) {
                merged.muscleGroup = mappedMuscle;
              }
            }
          }

          // If muscle group is changed explicitly, save the custom association
          if (updates.muscleGroup !== undefined && merged.name.trim()) {
            saveExerciseMuscleMapping(merged.name, updates.muscleGroup);
          }

          return merged;
        }
        return ex;
      })
    );
  };

  // Add blank set to an exercise
  const handleAddSet = (exId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exId) {
          // Dynamic copy logic: copy values of the previous set if it exists for easy progressive logging!
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: SetLog = {
            id: `set-${Date.now()}-${Math.random()}`,
            weight: lastSet ? lastSet.weight : '',
            reps: lastSet ? lastSet.reps : ''
          };
          return {
            ...ex,
            sets: [...ex.sets, newSet]
          };
        }
        return ex;
      })
    );
  };

  // Remove set from an exercise
  const handleDeleteSet = (exId: string, setId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exId) {
          // Don't let sets decrease below 1
          if (ex.sets.length <= 1) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((set) => set.id !== setId)
          };
        }
        return ex;
      })
    );
  };

  // Edit Set properties inline
  const handleSetChange = (exId: string, setId: string, field: 'weight' | 'reps', val: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id === exId) {
          return {
            ...ex,
            sets: ex.sets.map((set) => {
              if (set.id === setId) {
                // If weight or reps, try parsing numeric entry or leave standard empty string
                const numVal = val === '' ? '' : parseFloat(val);
                return {
                  ...set,
                  [field]: isNaN(Number(numVal)) ? '' : numVal
                };
              }
              return set;
            })
          };
        }
        return ex;
      })
    );
  };

  // Select autocomplete match
  const handleSelectAutocomplete = (exId: string, name: string, muscle: MuscleGroup) => {
    handleExerciseChange(exId, { name, muscleGroup: muscle });
    saveExerciseMuscleMapping(name, muscle);
    setActiveExSearchIdx(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify list holds log logs
    if (exercises.length === 0) {
      alert("Please add at least one exercise to your session log.");
      return;
    }

    // Clean blank exercises
    const cleanedExercises = exercises.map((ex) => {
      // Ensure name is set, default to custom if left empty
      const exName = ex.name.trim() || 'Custom Resistance Exercise';
      // Clean sets: keep empty weight and reps optional (as '') instead of forcing to 0
      const cleanedSets = ex.sets.map((set) => ({
        ...set,
        weight: set.weight === '' ? '' : set.weight,
        reps: set.reps === '' ? '' : set.reps
      }));

      // Automatically save mapping on submit as well
      saveExerciseMuscleMapping(exName, ex.muscleGroup);

      return {
        ...ex,
        name: exName,
        sets: cleanedSets
      };
    });

    const sessionData: WorkoutSession = {
      id: editSession ? editSession.id : `session-${Date.now()}`,
      date,
      time: time || undefined,
      name: name.trim() || 'Strength Training',
      notes: notes.trim(),
      exercises: cleanedExercises
    };

    onSaveSession(sessionData);
    resetForm();
  };

  return (
    <form onSubmit={handleSave} className="space-y-6" id="creator-panel">
      {/* Date & Title Header Box */}
      <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4" id="creator-header">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-slate-400" />
          <span>{editSession ? 'Edit Workout Session' : 'Log New Exercise Session'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Date:</label>
            <input
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Start Time:</label>
            <input
              type="time"
              value={time}
              required
              onChange={(e) => setTime(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Session Label / Title:</label>
            <input
              type="text"
              placeholder="e.g. Legs A, Push Hypertrophy, Upper Body"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Training Notes */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Workflow/Session Notes:</label>
          <textarea
            rows={2}
            placeholder="Add general workout details, pre-workout focus, or fatigue notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
          />
        </div>

        {/* Custom Exercises Manager */}
        <div className="border-t border-slate-105 pt-3.5" id="custom-exercises-manager">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCustomManager(!showCustomManager)}
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 uppercase tracking-widest font-sans flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>⚙️ Configure Custom Exercise Library</span>
              <span className="text-[9px] lowercase font-normal text-slate-350">
                ({showCustomManager ? "hide options" : "reveal options"})
              </span>
            </button>
          </div>

          {showCustomManager && (
            <div className="mt-2.5 bg-slate-50/50 p-4 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Custom exercise name (e.g., Cable Pullover)"
                  value={newCustomPresetName}
                  onChange={(e) => setNewCustomPresetName(e.target.value)}
                  className="flex-grow w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-805 placeholder:text-slate-350 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <select
                    value={newCustomPresetMuscle}
                    onChange={(e) => setNewCustomPresetMuscle(e.target.value as MuscleGroup)}
                    className="bg-white border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  >
                    {MUSCLE_GROUPS.map((mg) => (
                      <option key={mg.name} value={mg.name}>
                        {mg.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomPreset}
                    className="bg-slate-950 border border-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-slate-900 cursor-pointer transition-colors w-full sm:w-auto shrink-0 select-none animate-fade-in"
                  >
                    + Create
                  </button>
                </div>
              </div>

              {customPresets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto font-sans">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.name}
                      className="flex items-center gap-1.5 text-[10.5px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-650"
                    >
                      <span className="font-medium text-slate-800">{preset.name}</span>
                      <span className="text-[8px] font-black text-white bg-slate-750 px-1 py-0.5 rounded select-none uppercase tracking-wider">
                        {preset.muscleGroup}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPreset(preset.name)}
                        className="text-slate-355 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                        title="Delete Preset"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4" id="exercises-container">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Exercises Log ({exercises.length})
          </h4>
          
          {/* Quick inline preset insertion block */}
          <div className="text-[11px] text-slate-400 font-medium font-sans">
            💡 Add sets copy previous values automatically
          </div>
        </div>

        {exercises.map((ex, exIdx) => {
          const selectedGroupStyle = MUSCLE_GROUPS.find((mg) => mg.name === ex.muscleGroup) || {
            name: 'Other',
            color: '#71717a',
            bg: 'bg-slate-100',
            text: 'text-slate-600',
            ring: 'ring-slate-200/50'
          };

          // Filter autocomplete matches
          const showAutocomplete = activeExSearchIdx === exIdx && searchQuery.length > 0;
          const filteredPresets = allAvailableExercises.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
              // Avoid duplicates already added in this exercise block
              ex.name !== p.name
          ).slice(0, 5);

          return (
            <div
              key={ex.id}
              id={`editor-exercise-${ex.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, exIdx)}
              onDragOver={(e) => handleDragOver(e, exIdx)}
              onDragEnd={handleDragEnd}
              className={`bg-white border p-3.5 sm:p-5 rounded-2xl shadow-sm space-y-4 relative transition-all duration-200 ${
                draggedIdx === exIdx 
                  ? 'border-emerald-500 border-dashed bg-emerald-50/10 opacity-60 scale-[0.98]' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3" id={`exercise-${ex.id}-title-bar`}>
                <div className="flex-1 space-y-2 relative">
                  <div className="flex items-center gap-2 select-none">
                    <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-550 p-1 rounded hover:bg-slate-50" title="Drag to reorder card">
                      <GripVertical className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="w-5 h-5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-500 flex items-center justify-center border border-slate-200 shadow-3xs">
                      {exIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exercise Detail</span>
                    
                    {/* Sliding / Rearranging Up and Down handle triggers */}
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-4">
                      <button
                        type="button"
                        disabled={exIdx === 0}
                        onClick={() => {
                          const newExs = [...exercises];
                          const temp = newExs[exIdx];
                          newExs[exIdx] = newExs[exIdx - 1];
                          newExs[exIdx - 1] = temp;
                          setExercises(newExs);
                        }}
                        className={`p-1 rounded-md border transition-colors ${
                          exIdx === 0
                            ? 'text-slate-200 border-slate-100 cursor-not-allowed bg-slate-50/10'
                            : 'text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50 cursor-pointer'
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={exIdx === exercises.length - 1}
                        onClick={() => {
                          const newExs = [...exercises];
                          const temp = newExs[exIdx];
                          newExs[exIdx] = newExs[exIdx + 1];
                          newExs[exIdx + 1] = temp;
                          setExercises(newExs);
                        }}
                        className={`p-1 rounded-md border transition-colors ${
                          exIdx === exercises.length - 1
                            ? 'text-slate-200 border-slate-100 cursor-not-allowed bg-slate-50/10'
                            : 'text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50 cursor-pointer'
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Autocomplete Name Field */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Incline Bench Press, Deadlift"
                      value={ex.name}
                      onFocus={() => {
                        setActiveExSearchIdx(exIdx);
                        setSearchQuery(ex.name);
                      }}
                      onChange={(e) => {
                        handleExerciseChange(ex.id, { name: e.target.value });
                        setSearchQuery(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />

                    {/* Autocomplete dropdown cards list */}
                    {showAutocomplete && filteredPresets.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-250 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100">
                        {filteredPresets.map((preset) => (
                          <div
                            key={preset.name}
                            onClick={() => handleSelectAutocomplete(ex.id, preset.name, preset.muscleGroup)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer flex justify-between items-center"
                          >
                            <span>{preset.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{preset.muscleGroup}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Muscle Group Categorizer */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Muscle Targets</span>
                    <select
                      value={ex.muscleGroup}
                      onChange={(e) => handleExerciseChange(ex.id, { muscleGroup: e.target.value as MuscleGroup })}
                      className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
                    >
                      {MUSCLE_GROUPS.map((mg) => (
                        <option key={mg.name} value={mg.name}>
                          {mg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove Exercise Row */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(ex.id)}
                    className="p-2.5 mt-4 bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-655 rounded-xl text-slate-450 transition-colors cursor-pointer self-start sm:self-auto"
                    title="Remove Exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Set logging table */}
              <div className="space-y-2.5" id={`sets-grid-ex-${ex.id}`}>
                <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] sm:grid-cols-[3.25rem_1fr_1fr_2.5rem] gap-1.5 sm:gap-3 px-1 text-[9px] tracking-wider text-slate-400 font-bold uppercase font-sans text-center">
                  <span className="text-left pl-1">Set</span>
                  <span>Reps</span>
                  <span>Weight <span className="text-[8px] font-normal lowercase italic text-slate-400 font-sans">(opt)</span></span>
                  <span>Remove</span>
                </div>

                <div className="space-y-2">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2.5rem_1fr_1fr_2rem] sm:grid-cols-[3.25rem_1fr_1fr_2.5rem] gap-1.5 sm:gap-3 items-center"
                    >
                      {/* Set count badge */}
                      <span className="text-xs font-bold text-slate-500 text-center bg-slate-50 py-2 rounded-lg border border-slate-200">
                        {setIdx + 1}
                      </span>

                      {/* Reps Input */}
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) => handleSetChange(ex.id, set.id, 'reps', e.target.value)}
                        className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-1 sm:px-3 py-2 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                      />

                      {/* Weight Input */}
                      <input
                        type="number"
                        placeholder="Weight"
                        value={set.weight}
                        onChange={(e) => handleSetChange(ex.id, set.id, 'weight', e.target.value)}
                        className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-1 sm:px-3 py-2 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                      />

                      {/* Remove Set Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSet(ex.id, set.id)}
                        disabled={ex.sets.length <= 1}
                        className={`p-1.5 rounded-lg text-center mx-auto transition-colors focus:outline-none ${
                          ex.sets.length <= 1
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-red-500 hover:bg-slate-50'
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Row Set CTA */}
                <div className="grid grid-cols-[2.5rem_1fr_1fr_2rem] sm:grid-cols-[3.25rem_1fr_1fr_2.5rem] gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="text-xs font-bold text-slate-450 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-dashed border-slate-300 hover:border-emerald-300 transition-all flex items-center justify-center cursor-pointer h-9 shadow-3xs"
                    title="Add Set (Copy Last)"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <div className="flex items-center text-[10.5px] text-slate-400 font-sans pl-1 col-span-3">
                    Add next set (progressive copy)
                  </div>
                </div>
              </div>
            </div>
          );
        })}



        {/* Global Add Exercise Button */}
        <div className="flex gap-3 pt-2" id="action-buttons-drawer">
          <button
            type="button"
            onClick={() => handleAddExercise()}
            className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 text-emerald-600" />
            <span>Add Custom Exercise</span>
          </button>
        </div>
      </div>

      {/* Primary Action Saving Bar */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-200" id="form-actions-foot">
        <button
          type="submit"
          className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-slate-200 text-sm"
        >
          <Save className="h-4 w-4" />
          <span>{editSession ? 'Apply Workout Edits' : 'Save Session Log'}</span>
        </button>

        {editSession ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-6 py-4 bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={resetForm}
            className="p-4 bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="Reset Form Fields"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
