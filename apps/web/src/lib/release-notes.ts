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
    version: "1.3.0",
    date: "2026-08-12",
    type: "minor",
    title: "AI cost and model control in Admin",
    titleEs: "Costo de IA y control del modelo en Admin",
    notes: [
      "Admin now shows exactly what every AI call costs — total spend, a breakdown by feature and model, and every recent request.",
      "You can change which model each AI feature uses right from Admin — no more editing an env var and redeploying.",
      "The model picker shows real prices from OpenRouter, sorted cheapest first.",
    ],
    notesEs: [
      "Admin ahora muestra exactamente cuánto cuesta cada llamada a la IA — gasto total, desglose por función y por modelo, y cada solicitud reciente.",
      "Puedes cambiar qué modelo usa cada función de IA directamente desde Admin — ya no hay que editar una variable de entorno y redesplegar.",
      "El selector de modelo muestra precios reales de OpenRouter, ordenados del más barato al más caro.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-08-12",
    type: "minor",
    title: "A profile that studies your practice",
    titleEs: "Un perfil que estudia tu práctica",
    notes: [
      "New Profile page (tap your avatar) with an \"Analyze my practice\" button.",
      "Get real recommendations based on your actual accuracy, recent mistakes, and what you skip — not generic advice.",
      "Every analysis is saved, so you can look back and see how the picture has changed.",
    ],
    notesEs: [
      "Nueva página Profile (toca tu avatar) con un botón \"Analizar mi práctica\".",
      "Recibe recomendaciones reales basadas en tu precisión, tus errores recientes y lo que saltas — no consejos genéricos.",
      "Cada análisis queda guardado, para que puedas ver cómo ha cambiado el panorama con el tiempo.",
    ],
  },
  {
    version: "1.1.3",
    date: "2026-08-12",
    type: "patch",
    title: "Fixed it for real this time",
    titleEs: "Ahora sí quedó arreglado",
    notes: [
      "Switching to a different browser tab and back was still resetting your exercise — now it doesn't.",
    ],
    notesEs: [
      "Cambiar a otra pestaña del navegador y volver todavía reiniciaba tu ejercicio — ya no.",
    ],
  },
  {
    version: "1.1.2",
    date: "2026-08-12",
    type: "patch",
    title: "Practice stays put when you switch tabs",
    titleEs: "Practice se queda como estaba al cambiar de pestaña",
    notes: [
      "Switching to Talk, Progress, or Mistakes and coming back used to give you a brand-new question — fixed.",
      "Your current exercise, draft answer, and daily-practice progress now stay exactly as you left them.",
      "Skipping an exercise now clears the answer box instead of carrying over the old draft.",
    ],
    notesEs: [
      "Cambiar a Talk, Progress o Mistakes y volver te daba una pregunta nueva — ya está arreglado.",
      "Tu ejercicio actual, tu respuesta a medio escribir, y tu progreso en la práctica diaria ahora se quedan tal como los dejaste.",
      "Saltar un ejercicio ahora limpia el cuadro de respuesta en vez de arrastrar el borrador anterior.",
    ],
  },
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
