/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Quads'
  | 'Hamstrings'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Calves'
  | 'Glutes';

export interface SetLog {
  id: string;
  weight: number | ''; // weight in kg/lbs (stored as number, or empty string during input)
  reps: number | '';   // reps (stored as number, or empty string during input)
}

export interface ExerciseLog {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM (optional)
  name: string; // e.g. "Push Day", "Upper Body"
  notes?: string;
  exercises: ExerciseLog[];
}

export interface ExercisePreset {
  name: string;
  muscleGroup: MuscleGroup;
}
