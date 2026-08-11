import type { ExerciseSeed } from "./types.js";

/**
 * Paragraph translation exercises (2-4 sentences each). Evaluated
 * sentence-by-sentence by the AI evaluator; expectedAnswer is a reference
 * translation used only for the rule-based fallback / display, not as the
 * only acceptable phrasing.
 */
export const SEED_PARAGRAPHS: ExerciseSeed[] = [
  {
    id: "pp-001",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Mi hermana trabaja en una escuela. Ella enseña matemáticas a niños de diez años. Todos los días llega a la escuela a las siete y media.",
    expectedAnswer:
      "My sister works at a school. She teaches math to ten-year-old children. Every day she arrives at school at seven thirty.",
    targetConcepts: ["third_person_singular", "work_at", "arrive_at"],
  },
  {
    id: "pp-002",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Yo trabajo en una oficina en el centro. No trabajo los fines de semana. Los viernes trabajo desde casa.",
    expectedAnswer:
      "I work in an office downtown. I don't work on weekends. On Fridays I work from home.",
    targetConcepts: ["present_simple_affirmative", "present_simple_negative", "work_from"],
  },
  {
    id: "pp-003",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "present_simple",
    spanishText:
      "Mi hermano no vive en esta ciudad. Él vive en Barcelona con su esposa. Ellos van al trabajo en bicicleta.",
    expectedAnswer:
      "My brother doesn't live in this city. He lives in Barcelona with his wife. They go to work by bicycle.",
    targetConcepts: ["present_simple_negative", "third_person_singular", "possessive_his", "go_to"],
  },
  {
    id: "pp-004",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Nuestra familia cena junta todas las noches. Mi mamá cocina la cena y mi papá lava los platos. Después, nosotros vemos una película.",
    expectedAnswer:
      "Our family has dinner together every night. My mother cooks dinner and my father washes the dishes. Afterwards, we watch a movie.",
    targetConcepts: ["possessive_our", "third_person_singular", "present_simple_affirmative"],
  },
  {
    id: "pp-005",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "¿Dónde trabaja tu papá? Mi papá trabaja en un hospital. Él no trabaja los domingos.",
    expectedAnswer:
      "Where does your father work? My father works at a hospital. He doesn't work on Sundays.",
    targetConcepts: [
      "present_simple_questions",
      "work_at",
      "present_simple_negative",
      "possessive_your",
    ],
  },
  {
    id: "pp-006",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "prepositions",
    spanishText:
      "Mis amigos y yo escuchamos música los sábados por la tarde. A veces vamos al parque. Ellos no escuchan música en inglés todavía.",
    expectedAnswer:
      "My friends and I listen to music on Saturday afternoons. Sometimes we go to the park. They don't listen to music in English yet.",
    targetConcepts: ["listen_to", "go_to", "present_simple_negative"],
  },
  {
    id: "pp-007",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "possessives",
    spanishText:
      "Su empresa trabaja con clientes internacionales. Sus oficinas están en tres países. Su equipo llega a la oficina a las nueve.",
    expectedAnswer:
      "Their company works with international clients. Their offices are in three countries. Their team arrives at the office at nine.",
    contextHint: "You're talking about the García family's company.",
    targetConcepts: ["possessive_their", "work_at", "arrive_at"],
  },
  {
    id: "pp-008",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Mi hermana no come carne. Ella come muchas verduras y frutas. Su comida favorita es la ensalada.",
    expectedAnswer:
      "My sister doesn't eat meat. She eats a lot of vegetables and fruit. Her favorite food is salad.",
    targetConcepts: ["present_simple_negative", "third_person_singular", "possessive_her"],
  },
  {
    id: "pp-009",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "prepositions",
    spanishText:
      "¿Qué haces después del trabajo? Yo voy al gimnasio tres veces por semana. Los otros días, escucho podcasts en casa.",
    expectedAnswer:
      "What do you do after work? I go to the gym three times a week. On the other days, I listen to podcasts at home.",
    targetConcepts: ["present_simple_questions", "go_to", "listen_to"],
  },
  {
    id: "pp-010",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "prepositions",
    spanishText:
      "Mi jefe trabaja desde casa los lunes y los jueves. Los otros días, él llega a la oficina temprano. Su horario es muy flexible.",
    expectedAnswer:
      "My boss works from home on Mondays and Thursdays. On the other days, he arrives at the office early. His schedule is very flexible.",
    targetConcepts: ["work_from", "arrive_at", "possessive_his", "third_person_singular"],
  },
  {
    id: "pp-011",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "present_simple",
    spanishText:
      "Nosotros no vivimos cerca de la escuela. Nuestros hijos van a la escuela en autobús. El autobús llega a las siete y media.",
    expectedAnswer:
      "We don't live near the school. Our children go to school by bus. The bus arrives at seven thirty.",
    targetConcepts: ["present_simple_negative", "possessive_our", "go_to", "arrive_at"],
  },
  {
    id: "pp-012",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "¿Dónde trabaja tu hermana? Mi hermana trabaja en un banco en el centro. Ella no trabaja los sábados.",
    expectedAnswer:
      "Where does your sister work? My sister works at a bank downtown. She doesn't work on Saturdays.",
    targetConcepts: [
      "present_simple_questions",
      "possessive_your",
      "work_at",
      "present_simple_negative",
    ],
  },
  {
    id: "pp-013",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Mi abuelo camina en el parque todas las mañanas. Él no maneja un carro. Su casa está cerca del parque.",
    expectedAnswer:
      "My grandfather walks in the park every morning. He doesn't drive a car. His house is near the park.",
    targetConcepts: ["present_simple_affirmative", "present_simple_negative", "possessive_his"],
  },
  {
    id: "pp-014",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "present_simple",
    spanishText:
      "Ustedes trabajan mucho esta semana. ¿Trabajan también los fines de semana? Nosotros no trabajamos los domingos.",
    expectedAnswer:
      "You work a lot this week. Do you also work on weekends? We don't work on Sundays.",
    targetConcepts: [
      "present_simple_affirmative",
      "present_simple_questions",
      "present_simple_negative",
    ],
  },
  {
    id: "pp-015",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "prepositions",
    spanishText:
      "Mi hija estudia inglés en una escuela nueva. Ella escucha música en inglés para practicar. Su maestra es de Canadá.",
    expectedAnswer:
      "My daughter studies English at a new school. She listens to music in English to practice. Her teacher is from Canada.",
    targetConcepts: ["third_person_singular", "listen_to", "possessive_her"],
  },
  {
    id: "pp-016",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "possessives",
    spanishText:
      "Tu equipo gana casi todos los partidos. ¿Cómo practican ustedes? Nuestro equipo practica tres veces por semana.",
    expectedAnswer:
      "Your team wins almost every game. How do you practice? Our team practices three times a week.",
    targetConcepts: ["possessive_your", "present_simple_questions", "possessive_our"],
  },
  {
    id: "pp-017",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 2,
    grammarTopic: "prepositions",
    spanishText:
      "El tren llega a la estación a las ocho. Yo voy a la estación a pie. No llego tarde nunca.",
    expectedAnswer:
      "The train arrives at the station at eight. I go to the station on foot. I never arrive late.",
    targetConcepts: ["arrive_at", "go_to", "present_simple_negative"],
  },
  {
    id: "pp-018",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "possessives",
    spanishText:
      "Mis padres no hablan inglés muy bien. Ellos estudian inglés los martes por la noche. Su maestro es muy paciente.",
    expectedAnswer:
      "My parents don't speak English very well. They study English on Tuesday nights. Their teacher is very patient.",
    targetConcepts: ["present_simple_negative", "possessive_their"],
  },
  {
    id: "pp-019",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "prepositions",
    spanishText:
      "¿Trabajas desde casa todos los días? Yo trabajo desde casa los lunes y los viernes. Los otros días, trabajo en la oficina.",
    expectedAnswer:
      "Do you work from home every day? I work from home on Mondays and Fridays. On the other days, I work in the office.",
    targetConcepts: ["present_simple_questions", "work_from", "work_at"],
  },
  {
    id: "pp-020",
    type: "paragraph_translation",
    level: "A1",
    difficulty: 3,
    grammarTopic: "possessives",
    spanishText:
      "Nuestra vecina trabaja en un hospital cerca de aquí. Ella llega a trabajar muy temprano. Su turno empieza a las seis de la mañana.",
    expectedAnswer:
      "Our neighbor works at a hospital near here. She arrives at work very early. Her shift starts at six in the morning.",
    targetConcepts: ["possessive_our", "work_at", "arrive_at", "possessive_her"],
  },
];
