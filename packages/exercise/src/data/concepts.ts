export interface ConceptSeed {
  key: string;
  name: string;
  grammarTopic: string;
  parentKey?: string;
}

/**
 * Flat + lightly-nested concept taxonomy for the Present Simple module.
 * `grammarTopic` groups concepts for exercise filtering; `parentKey` lets a
 * concept (e.g. arrive_at) roll up into a broader one (prepositions) for
 * dashboard aggregation without duplicating rows.
 */
export const CONCEPT_SEEDS: ConceptSeed[] = [
  {
    key: "present_simple_affirmative",
    name: "Present Simple — Affirmative",
    grammarTopic: "present_simple",
  },
  {
    key: "present_simple_negative",
    name: "Present Simple — Negative",
    grammarTopic: "present_simple",
  },
  {
    key: "present_simple_questions",
    name: "Present Simple — Questions",
    grammarTopic: "present_simple",
  },
  {
    key: "third_person_singular",
    name: "Third Person Singular (-s)",
    grammarTopic: "present_simple",
  },

  { key: "prepositions", name: "Prepositions", grammarTopic: "prepositions" },
  { key: "arrive_at", name: "arrive at", grammarTopic: "prepositions", parentKey: "prepositions" },
  { key: "go_to", name: "go to", grammarTopic: "prepositions", parentKey: "prepositions" },
  { key: "listen_to", name: "listen to", grammarTopic: "prepositions", parentKey: "prepositions" },
  { key: "work_at", name: "work at", grammarTopic: "prepositions", parentKey: "prepositions" },
  { key: "work_from", name: "work from", grammarTopic: "prepositions", parentKey: "prepositions" },

  { key: "possessives", name: "Possessives", grammarTopic: "possessives" },
  { key: "possessive_my", name: "my", grammarTopic: "possessives", parentKey: "possessives" },
  { key: "possessive_your", name: "your", grammarTopic: "possessives", parentKey: "possessives" },
  { key: "possessive_his", name: "his", grammarTopic: "possessives", parentKey: "possessives" },
  { key: "possessive_her", name: "her", grammarTopic: "possessives", parentKey: "possessives" },
  { key: "possessive_our", name: "our", grammarTopic: "possessives", parentKey: "possessives" },
  { key: "possessive_their", name: "their", grammarTopic: "possessives", parentKey: "possessives" },
];
