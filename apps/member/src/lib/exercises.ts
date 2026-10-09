export interface Exercise {
  id: string;
  name: string;
  muscle: "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Cardio";
  equipment: "Barbell" | "Dumbbell" | "Machine" | "Bodyweight" | "Cable" | "Kettlebell";
}

export const EXERCISES: Exercise[] = [
  { id: "bench-press", name: "Bench Press", muscle: "Chest", equipment: "Barbell" },
  { id: "incline-db-press", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbell" },
  { id: "push-up", name: "Push-up", muscle: "Chest", equipment: "Bodyweight" },
  { id: "cable-fly", name: "Cable Fly", muscle: "Chest", equipment: "Cable" },

  { id: "deadlift", name: "Deadlift", muscle: "Back", equipment: "Barbell" },
  { id: "pull-up", name: "Pull-up", muscle: "Back", equipment: "Bodyweight" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Machine" },
  { id: "db-row", name: "Dumbbell Row", muscle: "Back", equipment: "Dumbbell" },

  { id: "squat", name: "Back Squat", muscle: "Legs", equipment: "Barbell" },
  { id: "leg-press", name: "Leg Press", muscle: "Legs", equipment: "Machine" },
  { id: "lunges", name: "Walking Lunges", muscle: "Legs", equipment: "Dumbbell" },
  { id: "rdl", name: "Romanian Deadlift", muscle: "Legs", equipment: "Barbell" },
  { id: "calf-raise", name: "Calf Raise", muscle: "Legs", equipment: "Machine" },

  { id: "ohp", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell" },
  { id: "lateral-raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { id: "face-pull", name: "Face Pull", muscle: "Shoulders", equipment: "Cable" },

  { id: "bicep-curl", name: "Bicep Curl", muscle: "Arms", equipment: "Dumbbell" },
  { id: "tricep-pushdown", name: "Tricep Pushdown", muscle: "Arms", equipment: "Cable" },
  { id: "hammer-curl", name: "Hammer Curl", muscle: "Arms", equipment: "Dumbbell" },

  { id: "plank", name: "Plank", muscle: "Core", equipment: "Bodyweight" },
  { id: "crunch", name: "Crunch", muscle: "Core", equipment: "Bodyweight" },
  { id: "russian-twist", name: "Russian Twist", muscle: "Core", equipment: "Bodyweight" },

  { id: "treadmill", name: "Treadmill Run", muscle: "Cardio", equipment: "Machine" },
  { id: "cycling", name: "Stationary Bike", muscle: "Cardio", equipment: "Machine" },
  { id: "rowing", name: "Rowing Machine", muscle: "Cardio", equipment: "Machine" },
  { id: "jump-rope", name: "Jump Rope", muscle: "Cardio", equipment: "Bodyweight" },
];

export const MUSCLES = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"] as const;
