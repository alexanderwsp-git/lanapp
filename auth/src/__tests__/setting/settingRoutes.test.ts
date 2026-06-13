import request from 'supertest';
import { app } from '../../index';
import { SettingRepository } from '../../repositories/settingRepository';
import { Setting } from '../../entities/setting';
import { mockSettingRepository } from '../../__mocks__/settingRepository';

jest.spyOn(SettingRepository.prototype, 'create').mockImplementation(mockSettingRepository.create);
jest.spyOn(SettingRepository.prototype, 'findAll').mockImplementation(
    mockSettingRepository.findAll
);
jest.spyOn(SettingRepository.prototype, 'findById').mockImplementation(
    mockSettingRepository.findById
);
jest.spyOn(SettingRepository.prototype, 'update').mockImplementation(mockSettingRepository.update);
jest.spyOn(SettingRepository.prototype, 'delete').mockImplementation(mockSettingRepository.delete);

describe('Setting API Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // ✅ Reset mocks before each test
    });

    it('should create a new setting', async () => {
        const settingData: Partial<Setting> = {
            name: 'Dark Mode',
            type: 'boolean',
            config: 'true',
            status: 'Active',
        };
        const mockSetting = {
            ...settingData,
            id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed23',
        } as Setting;

        mockSettingRepository.create.mockResolvedValue(mockSetting);

        const response = await request(app).post('/api/settings').send(settingData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSetting);
        expect(mockSettingRepository.create).toHaveBeenCalledWith(settingData);
    });

    it('should return error when try a new setting', async () => {
        const settingData: Partial<Setting> = {
            name: 'Dark Mode',
            type: 'boolean',
        };

        const response = await request(app).post('/api/settings').send(settingData);

        expect(response.status).toBe(207);
        expect(response.body.success).toBe(false);
    });

    it('should return all settings', async () => {
        const mockSettings = [
            {
                id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
                name: 'Theme',
                type: 'string',
                config: 'dark',
                status: 'Active',
            },
        ] as Setting[];

        mockSettingRepository.findAll.mockResolvedValue(mockSettings);

        const response = await request(app).get('/api/settings');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSettings);
        expect(mockSettingRepository.findAll).toHaveBeenCalled();
    });

    it('should return 207 with the wrong ID', async () => {
        const response = await request(app).get('/api/settings/1b9d6bcd-bbfd-4b2d-9b5d-wrong');

        expect(response.status).toBe(207);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe(`Invalid request parameters`);
    });

    it('should return a single setting by ID', async () => {
        const mockSetting = {
            id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
            name: 'Font Size',
            type: 'string',
            config: '16px',
            status: 'Active',
        } as Setting;

        mockSettingRepository.findById.mockResolvedValue(mockSetting);

        const response = await request(app).get(
            '/api/settings/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSetting);
        expect(mockSettingRepository.findById).toHaveBeenCalledWith(
            '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        );
    });

    it('should update a setting', async () => {
        const updatedSetting = {
            id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
            name: 'Updated Name',
        } as Setting;

        mockSettingRepository.update.mockResolvedValue(updatedSetting);

        const response = await request(app)
            .put('/api/settings/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
            .send({
                name: 'Updated Name',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(updatedSetting);
        expect(mockSettingRepository.update).toHaveBeenCalledWith(
            '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
            {
                name: 'Updated Name',
            }
        );
    });

    it('should delete a setting', async () => {
        mockSettingRepository.delete.mockResolvedValue(true);

        const response = await request(app).delete(
            '/api/settings/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        );

        expect(response.status).toBe(204);
        expect(mockSettingRepository.delete).toHaveBeenCalledWith(
            '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
        );
    });
});
