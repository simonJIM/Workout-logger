/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkoutSession, MuscleGroup } from './types';

// Pre-hydrate with illustrative workout entries so the app comes alive instantly
const SEED_WORKOUTS: WorkoutSession[] = [
  {
    id: 'seed-upper-body',
    date: '2026-06-05',
    name: 'Upper Body Pump',
    notes: 'Incredible mind-muscle connection today. Chest presses feel explosive and triceps were fully activated.',
    exercises: [
      {
        id: 'seed-ex-u1',
        name: 'Incline Dumbbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { id: 'set-u1-1', weight: 28, reps: 10 },
          { id: 'set-u1-2', weight: 30, reps: 8 },
          { id: 'set-u1-3', weight: 30, reps: 8 }
        ]
      },
      {
        id: 'seed-ex-u2',
        name: 'Lat Pulldown',
        muscleGroup: 'Back',
        sets: [
          { id: 'set-u2-1', weight: 60, reps: 12 },
          { id: 'set-u2-2', weight: 65, reps: 10 },
          { id: 'set-u2-3', weight: 65, reps: 10 }
        ]
      },
      {
        id: 'seed-ex-u3',
        name: 'Seated Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        sets: [
          { id: 'set-u3-1', weight: 20, reps: 10 },
          { id: 'set-u3-2', weight: 22, reps: 8 }
        ]
      },
      {
        id: 'seed-ex-u4',
        name: 'Standing Barbell Curl',
        muscleGroup: 'Biceps',
        sets: [
          { id: 'set-u4-1', weight: 30, reps: 12 },
          { id: 'set-u4-2', weight: 35, reps: 10 }
        ]
      },
      {
        id: 'seed-ex-u5',
        name: 'Skull Crushers',
        muscleGroup: 'Triceps',
        sets: [
          { id: 'set-u5-1', weight: 25, reps: 12 },
          { id: 'set-u5-2', weight: 30, reps: 10 }
        ]
      }
    ]
  },
  {
    id: 'seed-lower-body',
    date: '2026-06-04',
    name: 'Lower Body Absolute Power',
    notes: 'Focused on explosive depth for squats. RDL hamstring stretch felt deep and stable.',
    exercises: [
      {
        id: 'seed-ex-l1',
        name: 'Barbell Back Squat',
        muscleGroup: 'Quads',
        sets: [
          { id: 'set-l1-1', weight: 90, reps: 8 },
          { id: 'set-l1-2', weight: 100, reps: 6 },
          { id: 'set-l1-3', weight: 105, reps: 5 }
        ]
      },
      {
        id: 'seed-ex-l2',
        name: 'Romanian Deadlift',
        muscleGroup: 'Hamstrings',
        sets: [
          { id: 'set-l2-1', weight: 70, reps: 10 },
          { id: 'set-l2-2', weight: 80, reps: 8 },
          { id: 'set-l2-3', weight: 80, reps: 8 }
        ]
      },
      {
        id: 'seed-ex-l3',
        name: 'Leg Extensions',
        muscleGroup: 'Quads',
        sets: [
          { id: 'set-l3-1', weight: 45, reps: 12 },
          { id: 'set-l3-2', weight: 50, reps: 12 }
        ]
      }
    ]
  },
  {
    id: 'seed-1',
    date: '2026-06-03',
    name: 'Push Hypertrophy',
    notes: 'Feeling strong. Bench press felt heavy but manageable. Tricep pump was real.',
    exercises: [
      {
        id: 'seed-ex-1',
        name: 'Barbell Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { id: 'set-1-1', weight: 80, reps: 10 },
          { id: 'set-1-2', weight: 85, reps: 8 },
          { id: 'set-1-3', weight: 85, reps: 6 }
        ]
      },
      {
        id: 'seed-ex-2',
        name: 'Dumbbell Shoulder Press',
        muscleGroup: 'Shoulders',
        sets: [
          { id: 'set-2-1', weight: 24, reps: 10 },
          { id: 'set-2-2', weight: 26, reps: 8 }
        ]
      },
      {
        id: 'seed-ex-3',
        name: 'Dumbbell Lateral Raise',
        muscleGroup: 'Shoulders',
        sets: [
          { id: 'set-3-1', weight: 12, reps: 15 },
          { id: 'set-3-2', weight: 12, reps: 12 }
        ]
      },
      {
        id: 'seed-ex-4',
        name: 'Tricep Rope Pushdown',
        muscleGroup: 'Triceps',
        sets: [
          { id: 'set-4-1', weight: 30, reps: 12 },
          { id: 'set-4-2', weight: 35, reps: 10 }
        ]
      }
    ]
  },
  {
    id: 'seed-2',
    date: '2026-06-01',
    name: 'Heavy Pull Day',
    notes: 'Completed deadlifts raw, no straps. Focus on back-off lat pulldowns.',
    exercises: [
      {
        id: 'seed-ex-5',
        name: 'Deadlift',
        muscleGroup: 'Back',
        sets: [
          { id: 'set-5-1', weight: 120, reps: 5 },
          { id: 'set-5-2', weight: 130, reps: 5 },
          { id: 'set-5-3', weight: 140, reps: 3 }
        ]
      },
      {
        id: 'seed-ex-6',
        name: 'Pull-Up',
        muscleGroup: 'Back',
        sets: [
          { id: 'set-6-1', weight: 0, reps: 10 },
          { id: 'set-6-2', weight: 0, reps: 8 }
        ]
      },
      {
        id: 'seed-ex-7',
        name: 'Dumbbell Bicep Curl',
        muscleGroup: 'Biceps',
        sets: [
          { id: 'set-7-1', weight: 16, reps: 12 },
          { id: 'set-7-2', weight: 16, reps: 10 }
        ]
      }
    ]
  }
];

export function loadWorkouts(): WorkoutSession[] {
  // If the new seed package V4 (upper/lower split focus) hasn't been set, override to seed
  const seededV4 = localStorage.getItem('seeded_v4');
  const data = localStorage.getItem('workout_sessions');
  if (!data || !seededV4) {
    saveWorkouts(SEED_WORKOUTS);
    localStorage.setItem('seeded_v4', 'true');
    return SEED_WORKOUTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse workouts from localStorage, using seeds', e);
    return SEED_WORKOUTS;
  }
}

export function saveWorkouts(workouts: WorkoutSession[]): void {
  localStorage.setItem('workout_sessions', JSON.stringify(workouts));
}

export interface MuscleSummary {
  muscleGroup: MuscleGroup;
  totalSets: number;
  totalReps: number;
  setsThisWeek: number; // Sets in the last 7 days
  percentage: number;  // Percentage of total sets
}

export interface MuscleStimulationStatus {
  muscleGroup: MuscleGroup;
  lastHitDate: string | null;
  hoursSinceLastHit: number | null;
  status: 'optimal' | 'warning' | 'cold'; // optimal <= 48, warning 48-72, cold > 72 or never
}

export function calculateMuscleAnalytics(workouts: WorkoutSession[]): {
  muscleSummaries: MuscleSummary[];
  totalWorkoutsCount: number;
  totalSetsCount: number;
  averageSetsPerSession: number;
  totalSetsThisWeek: number;
  stimulationStatuses: MuscleStimulationStatus[];
} {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const statsMap: Record<MuscleGroup, { totalSets: number; totalReps: number; setsThisWeek: number }> = {
    Chest: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Back: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Quads: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Hamstrings: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Shoulders: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Biceps: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Triceps: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Calves: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
    Glutes: { totalSets: 0, totalReps: 0, setsThisWeek: 0 },
  };

  let totalSetsCount = 0;
  let totalSetsThisWeek = 0;

  workouts.forEach((session) => {
    const sessionDate = new Date(`${session.date}T12:00:00`);
    const isThisWeek = sessionDate >= sevenDaysAgo;

    session.exercises.forEach((ex) => {
      let group = ex.muscleGroup;
      if (group as string === 'Legs') group = 'Quads';
      if (group as string === 'Arms') group = 'Biceps';
      if (!statsMap[group]) return; // Skip Cardio/Other or unmapped groups

      ex.sets.forEach((set) => {
        const r = typeof set.reps === 'number' ? set.reps : 0;
        
        statsMap[group].totalSets += 1;
        statsMap[group].totalReps += r;
        totalSetsCount += 1;

        if (isThisWeek) {
          statsMap[group].setsThisWeek += 1;
          totalSetsThisWeek += 1;
        }
      });
    });
  });

  const muscleSummaries = Object.entries(statsMap).map(([group, data]) => {
    return {
      muscleGroup: group as MuscleGroup,
      totalSets: data.totalSets,
      totalReps: data.totalReps,
      setsThisWeek: data.setsThisWeek,
      percentage: totalSetsCount > 0 ? Math.round((data.totalSets / totalSetsCount) * 100) : 0,
    };
  }).sort((a, b) => b.totalSets - a.totalSets); // Sort by sets descending

  // 48-Hour Stimulation recency check
  const stimulationStatuses = (['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Calves', 'Glutes'] as MuscleGroup[]).map(group => {
    const hittingSessions = workouts.filter(session =>
      session.exercises.some(ex => {
        let exGroup = ex.muscleGroup;
        if (exGroup as string === 'Legs') exGroup = 'Quads';
        if (exGroup as string === 'Arms') exGroup = 'Biceps';
        return exGroup === group && ex.sets.length > 0;
      })
    );

    if (hittingSessions.length === 0) {
      return {
        muscleGroup: group,
        lastHitDate: null,
        hoursSinceLastHit: null,
        status: 'cold' as const
      };
    }

    const sorted = [...hittingSessions].sort((a, b) => b.date.localeCompare(a.date));
    const latestSession = sorted[0];

    // parse both as midnight local/noon local to be resilient and timezone safe
    const latestDate = new Date(`${latestSession.date}T12:00:00`);
    const todayDate = new Date();
    todayDate.setHours(12, 0, 0, 0);

    const diffInMs = todayDate.getTime() - latestDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const hoursSinceLastHit = diffInHours < 0 ? 0 : Math.round(diffInHours);

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
      status
    };
  });

  return {
    muscleSummaries,
    totalWorkoutsCount: workouts.length,
    totalSetsCount,
    averageSetsPerSession: workouts.length > 0 ? Math.round((totalSetsCount / workouts.length) * 10) / 10 : 0,
    totalSetsThisWeek,
    stimulationStatuses
  };
}
