import { SettingRepository } from '../repositories/settingRepository';
import { Setting } from '../entities/setting';

export class SettingService {
    private settingRepository = new SettingRepository();

    async createSetting(data: Partial<Setting>): Promise<Setting> {
        return this.settingRepository.create(data);
    }

    async getAllSettings(): Promise<Setting[]> {
        return this.settingRepository.findAll();
    }

    async getSettingById(id: string): Promise<Setting | null> {
        return this.settingRepository.findById(id);
    }

    async updateSetting(id: string, data: Partial<Setting>): Promise<Setting | null> {
        return this.settingRepository.update(id, data);
    }

    async deleteSetting(id: string): Promise<boolean> {
        return this.settingRepository.delete(id);
    }

    async getPaginatedSettings(page: number = 1, limit: number = 10, filters: any) {
        return this.settingRepository.getPaginatedSettings(page, limit, filters);
    }
}
