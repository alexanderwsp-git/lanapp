import { z } from 'zod';

export const AuthSchema = z.object({
    username: z.string().min(3, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    email: z.string().email('Invalid email format').optional(),
});

export const RegisterSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export const CognitoIdTokenSchema = z.object({
    email: z.string().email(),
    username: z.string().optional(),
    'cognito:username': z.string().optional(),
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(10, 'Refresh token is required'),
});

export const UpdateUserSchema = z.object({
    attributes: z
        .array(
            z.object({
                Name: z.string(),
                Value: z.string(),
            })
        )
        .min(1, 'At least one attribute is required'),
});

export const ConfirmUserSchema = z.object({
    username: z.string().min(3, 'Username is required'),
    confirmationCode: z.string().min(6, 'Confirmation code is required'),
});

export const AccessTokenSchema = z.object({
    accessToken: z.string().min(10, 'Access token is required'),
});

export const ResendConfirmationSchema = z.object({
    username: z.string().min(3, 'Username is required'),
});

export const ForgotPasswordSchema = z.object({
    username: z.string().min(3, 'Username is required'),
});

export const ResetPasswordSchema = z.object({
    username: z.string().min(3, 'Username is required'),
    confirmationCode: z.string().min(6, 'Confirmation code is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const DisableUserSchema = z.object({
    username: z.string().min(3, 'Username is required'),
});
