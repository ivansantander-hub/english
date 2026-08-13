import { prisma } from "@english-a1/db";

export interface PreferencesDTO {
  showVideoRecsInPractice: boolean;
  showVideoRecsInProfile: boolean;
  videoLanguagePreference: "auto" | "es" | "en";
}

const SELECT = {
  showVideoRecsInPractice: true,
  showVideoRecsInProfile: true,
  videoLanguagePreference: true,
} as const;

export class PreferencesService {
  async get(userId: string): Promise<PreferencesDTO> {
    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: SELECT });
  }

  async update(userId: string, input: PreferencesDTO): Promise<PreferencesDTO> {
    return prisma.user.update({ where: { id: userId }, data: input, select: SELECT });
  }
}
