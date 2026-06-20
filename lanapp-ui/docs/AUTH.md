# Autenticación (Cognito, invite-only)

Lanapp usa **AWS Cognito** con registro solo por invitación (`allow_admin_create_user_only = true`).

## Flujo

1. **Bootstrap (una vez):** crear el primer admin en Cognito (consola AWS o CLI) y asignarlo al grupo `lanapp_admin`.
2. **Login:** `/login` con email + contraseña (`InitiateAuth` — solo vars `COGNITO_*`, sin AWS access keys).
3. **Invitar usuarios:** admin en `/users` → Cognito envía email con contraseña temporal (requiere IAM vía **ECS task role** en prod).
4. **Recuperar contraseña:** `/forgot-password` → código por email → `/reset-password`.
5. **Registro público:** no disponible. `/register` explica el flujo invite-only.

## Variables de entorno (contenedor / `.env`)

### lanapp-ui — login, forgot, reset (sin AWS keys)

| Variable | Requerida | Notas |
|----------|-----------|-------|
| `COGNITO_USER_POOL_ID` | Sí | Terraform output |
| `COGNITO_CLIENT_ID` | Sí | Terraform output |
| `COGNITO_CLIENT_SECRET` | Sí | Terraform output |
| `AWS_REGION` | Sí | e.g. `us-east-1` |
| `NEXT_PUBLIC_SKIP_AUTH` | Dev: `true` | `false` en prod |

**No** poner `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY` en el contenedor.

### Invitar usuarios en local (opcional)

Login/forgot **no** necesitan IAM. `/users` (invitar) **sí** — en local una de estas opciones:

1. **`aws configure`** con un usuario/rol que tenga permisos `cognito-idp:AdminCreateUser`, etc.
2. **`AWS_PROFILE=mi-perfil`** en `lanapp-ui/.env` si usas SSO o varios perfiles.
3. En **ECS prod**: automático vía task role `mexp-lanapp-front-task-role` (sin keys en env).

No pongas `AWS_ACCESS_KEY_ID` en el task definition del contenedor.

### lanapp API (`.env`)

| Variable | Dev local | Producción |
|----------|-----------|------------|
| `SKIP_AUTH` | `true` | `false` |
| `COGNITO_USER_POOL_ID` | — | mismo pool |
| `COGNITO_CLIENT_ID` | — | mismo client |

## Terraform

El app client debe incluir `ALLOW_USER_PASSWORD_AUTH` en `explicit_auth_flows` ([`5_cognito.tf`](../../webapp-infra/iac/src/v1/5_cognito.tf)). Aplicar con `terraform apply` antes de desplegar el código nuevo.

## Verificación manual (Cognito real)

1. `terraform apply` (habilitar `ALLOW_USER_PASSWORD_AUTH`).
2. Desactivar bypass: `NEXT_PUBLIC_SKIP_AUTH=false` (UI) y `SKIP_AUTH=false` (API).
3. Configurar solo vars `COGNITO_*` + región (sin AWS access keys).
4. Crear admin en Cognito + grupo `lanapp_admin`.
5. Login → cambiar contraseña temporal → dashboard.
6. En prod: `/users` → invitar operario (task role).
7. `/forgot-password` → reset → login.
8. Logout → permanece en `/login`.

## Bootstrap admin (AWS CLI)

```bash
POOL_ID=<user-pool-id>
EMAIL=admin@example.com

aws cognito-idp admin-create-user \
  --user-pool-id "$POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL

aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$POOL_ID" \
  --username "$EMAIL" \
  --group-name lanapp_admin
```

## Rutas API (Next.js)

| Ruta | IAM requerido |
|------|---------------|
| `POST /api/auth/login` | No (solo `COGNITO_*`) |
| `POST /api/auth/set-password` | No |
| `POST /api/auth/forgot-password` | No |
| `POST /api/auth/reset-password` | No |
| `POST /api/auth/logout` | No |
| `GET /api/auth/me` | No (verifica JWT) |
| `POST /api/admin/users` | Sí (task role en ECS) |

## Modo dev (`SKIP_AUTH=true`)

Con `NEXT_PUBLIC_SKIP_AUTH=true` (UI) y `SKIP_AUTH=true` (API), login, forgot, reset y logout responden sin Cognito.
