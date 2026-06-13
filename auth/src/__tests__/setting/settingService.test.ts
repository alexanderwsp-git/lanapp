import { SettingService } from '../../services/settingService';
import { mockSettingRepository } from '../../__mocks__/settingRepository';
import { Setting } from '../../entities/setting';

jest.mock('../../repositories/settingRepository', () => ({
    SettingRepository: jest.fn(() => mockSettingRepository),
}));

describe('SettingService', () => {
    let settingService: SettingService;

    beforeEach(() => {
        settingService = new SettingService();
    });

    it('should create a new setting', async () => {
        const settingData: Partial<Setting> = {
            name: 'Dark Mode',
            type: 'boolean',
            config: 'true',
        };
        const mockSetting = { ...settingData, id: 'uuid-123' } as Setting;

        mockSettingRepository.create.mockResolvedValue(mockSetting);

        const result = await settingService.createSetting(settingData);
        expect(result).toEqual(mockSetting);
        expect(mockSettingRepository.create).toHaveBeenCalledWith(settingData);
    });

    it('should fetch all settings', async () => {
        const mockSettings = [
            { id: 'uuid-1', name: 'Theme', type: 'string', config: 'dark' },
        ] as Setting[];

        mockSettingRepository.findAll.mockResolvedValue(mockSettings);

        const result = await settingService.getAllSettings();
        expect(result).toEqual(mockSettings);
        expect(mockSettingRepository.findAll).toHaveBeenCalled();
    });

    it('should return a setting by ID', async () => {
        const mockSetting = {
            id: 'uuid-1',
            name: 'Font Size',
            type: 'string',
            config: '16px',
        } as Setting;

        mockSettingRepository.findById.mockResolvedValue(mockSetting);

        const result = await settingService.getSettingById('uuid-1');
        expect(result).toEqual(mockSetting);
        expect(mockSettingRepository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('should update a setting', async () => {
        const updatedSetting = {
            id: 'uuid-1',
            name: 'Updated Name',
        } as Setting;

        mockSettingRepository.update.mockResolvedValue(updatedSetting);

        const result = await settingService.updateSetting('uuid-1', {
            name: 'Updated Name',
        });
        expect(result).toEqual(updatedSetting);
        expect(mockSettingRepository.update).toHaveBeenCalledWith('uuid-1', {
            name: 'Updated Name',
        });
    });

    it('should delete a setting', async () => {
        mockSettingRepository.delete.mockResolvedValue(true);

        const result = await settingService.deleteSetting('uuid-1');
        expect(result).toBe(true);
        expect(mockSettingRepository.delete).toHaveBeenCalledWith('uuid-1');
    });
});
