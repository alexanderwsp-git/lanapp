import request from 'supertest';
import { app } from '../../index';
import { cognitoService } from '../../auth/cognito';
import { mocked } from 'jest-mock';

jest.mock('../../auth/cognito');

describe('Auth API', () => {
    it('should return 500 if Cognito authentication fails', async () => {
        mocked(cognitoService.authenticateUser).mockRejectedValue(new Error('Invalid credentials'));

        const response = await request(app).post('/api/auth/login').send({
            username: 'wronguser',
            password: 'wrongpass',
        });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid credentials');
    });
});
