import { prisma } from "@english-a1/db";

export interface PreferencesDTO {
  showVideoRecsInPractice: boolean;
  showVideoRecsInProfile: boolean;
}

export class PreferencesService {
  async get(userId: string): Promise<PreferencesDTO> {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { showVideoRecsInPractice: true, showVideoRecsInProfile: true },
    });
  }

  async update(userId: string, input: PreferencesDTO): Promise<PreferencesDTO> {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: { showVideoRecsInPractice: true, showVideoRecsInProfile: true },
    });
  }
}
