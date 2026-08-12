export type ReleaseType = "major" | "minor" | "patch";

export interface ReleaseNote {
  version: string;
  date: string; // YYYY-MM-DD
  type: ReleaseType;
  title: string;
  titleEs: string;
  notes: string[];
  notesEs: string[];
}

/** Newest first. The footer's version link always reads RELEASE_NOTES[0].version. */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "1.1.1",
    date: "2026-08-12",
    type: "patch",
    title: "A cleaner header, and a real bottom menu",
    titleEs: "Un encabezado más limpio, y un menú inferior de verdad",
    notes: [
      "The header was crowded — it's cleaner now, and tapping the logo takes you home.",
      "Navigation moved to a menu bar at the bottom, easier to reach.",
      "Logging out now has its own proper menu instead of a plain link.",
    ],
    notesEs: [
      "El encabezado estaba saturado — ahora es más limpio, y tocar el logo te lleva al inicio.",
      "La navegación se movió a una barra abajo, más fácil de alcanzar.",
      "Cerrar sesión ahora tiene su propio menú en vez de un simple enlace.",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-08-12",
    type: "minor",
    title: "Skip exercises, and release notes",
    titleEs: "Saltar ejercicios, y notas de versión",
    notes: [
      "You can now skip the current exercise in Practice without answering it.",
      "A skipped exercise won't immediately come back as your next one.",
      "This release notes page — tap the version number in the footer any time.",
    ],
    notesEs: [
      "Ahora puedes saltar el ejercicio actual en Practice sin responderlo.",
      "Un ejercicio que acabas de saltar no vuelve a aparecer de inmediato.",
      "Esta página de notas de versión — toca el número de versión en el pie de página cuando quieras.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-08-12",
    type: "major",
    title: "English Line, first tracked release",
    titleEs: "English Line, primera versión registrada",
    notes: [
      "The full learning loop: exercises, AI-backed feedback in English and Spanish, and a practice map that tracks your progress.",
      "Accounts with email + PIN, so your progress is saved and private.",
      "A warm, distinctive look with a real dark mode.",
    ],
    notesEs: [
      "El ciclo de aprendizaje completo: ejercicios, retroalimentación con IA en inglés y español, y un mapa de práctica que sigue tu progreso.",
      "Cuentas con correo + PIN, para que tu progreso quede guardado y privado.",
      "Una apariencia cálida y distintiva, con modo oscuro real.",
    ],
  },
];
