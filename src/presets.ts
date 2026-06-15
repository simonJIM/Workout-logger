/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExercisePreset, MuscleGroup } from './types';

export const EXERCISE_PRESETS: ExercisePreset[] = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Incline Press', muscleGroup: 'Chest' },
  { name: 'Chest Fly (Machine/Cable)', muscleGroup: 'Chest' },
  { name: 'Push-Up', muscleGroup: 'Chest' },
  { name: 'Dips (Chest Focus)', muscleGroup: 'Chest' },
  { name: 'Dumbbell Chest Fly', muscleGroup: 'Chest' },
  { name: 'Low to High Cable Chest Fly', muscleGroup: 'Chest' },
  { name: 'Smith Machine Incline Press', muscleGroup: 'Chest' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back' },
  { name: 'Pull-Up', muscleGroup: 'Back' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'Machine Row', muscleGroup: 'Back' },

  // Quads
  { name: 'Barbell Back Squat', muscleGroup: 'Quads' },
  { name: 'Leg Press', muscleGroup: 'Quads' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Quads' },
  { name: 'Leg Extensions', muscleGroup: 'Quads' },
  { name: 'Walking Lunge', muscleGroup: 'Quads' },
  { name: 'Smith Machine Squat', muscleGroup: 'Quads' },

  // Hamstrings
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings' },
  { name: 'Glute-Ham Raise', muscleGroup: 'Hamstrings' },
  { name: 'Hamstring Curl', muscleGroup: 'Hamstrings' },
  { name: 'Stiff Legged Deadlift', muscleGroup: 'Hamstrings' },

  // Calves
  { name: 'Calf Raises', muscleGroup: 'Calves' },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves' },
  { name: 'Standing Calf Raise', muscleGroup: 'Calves' },
  { name: 'Donkey Calf Raise', muscleGroup: 'Calves' },

  // Glutes
  { name: 'Barbell Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Machine Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Smith Machine Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Cable Kickbacks', muscleGroup: 'Glutes' },
  { name: 'Stepups', muscleGroup: 'Glutes' },

  // Shoulders
  { name: 'Overhead Press (OHP)', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Face Pull', muscleGroup: 'Shoulders' },
  { name: 'Reverse Fly (Rear Delt)', muscleGroup: 'Shoulders' },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders' },

  // Biceps
  { name: 'Dumbbell Bicep Curl', muscleGroup: 'Biceps' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Chin-Up', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },
  { name: 'Strict Curl', muscleGroup: 'Biceps' },

  // Triceps
  { name: 'Tricep Rope Pushdown', muscleGroup: 'Triceps' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },
  { name: 'Close Grip Bench Press', muscleGroup: 'Triceps' },
  { name: 'Dips (Triceps Focus)', muscleGroup: 'Triceps' },
  { name: 'JM Press', muscleGroup: 'Triceps' }

];

export const MUSCLE_GROUPS: { name: string; color: string; bg: string; text: string; ring: string }[] = [
  { name: 'Chest', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Back', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-705', ring: 'ring-slate-200' },
  { name: 'Quads', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-707', ring: 'ring-slate-200' },
  { name: 'Hamstrings', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Shoulders', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Biceps', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Triceps', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Calves', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
  { name: 'Glutes', color: '#475569', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' }
];

export function getSecondaryMuscles(exerciseName: string, primary: MuscleGroup): MuscleGroup[] {
  return [];
}

