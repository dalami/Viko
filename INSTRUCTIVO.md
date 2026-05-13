# VIKO — Guía de puesta en marcha completa

## 1. CREAR EL PROYECTO EN SUPABASE

1. Ir a **supabase.com** → New Project
2. Completar:
   - Name: `viko-app`
   - Database Password: (guardala en un lugar seguro)
   - Region: elegí **South America (São Paulo)** para menor latencia
3. Esperar que el proyecto se cree (~2 min)

---

## 2. CONFIGURAR LA BASE DE DATOS

1. En tu proyecto Supabase → ir a **SQL Editor** → **New Query**
2. Copiar y pegar todo el contenido del archivo `supabase/schema.sql`
3. Hacer clic en **Run** (o Ctrl+Enter)
4. Deberías ver: "Success. No rows returned"

Esto crea:
- Tabla `emprendimientos` (perfiles de cada negocio)
- Tabla `productos` (catálogo de cada emprendimiento)
- Políticas de seguridad (RLS) para que cada uno solo edite lo suyo
- Un trigger que actualiza `updated_at` automáticamente

---

## 3. OBTENER LAS KEYS DE SUPABASE

1. En Supabase → **Project Settings** → **API**
2. Copiar:
   - **Project URL** → ej: `https://abcdefgh.supabase.co`
   - **anon public** key → la key larga que empieza con `eyJ...`

---

## 4. CONFIGURAR VARIABLES DE ENTORNO

En la raíz del proyecto, crear un archivo `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...TU_ANON_KEY
```

> **Nunca subas `.env.local` a Git.** Ya está en el `.gitignore`.

---

## 5. INSTALAR Y CORRER EN LOCAL

```bash
npm install
npm run dev
```

Abrir **http://localhost:3000** — debería redirigir a `/directorio`.

---

## 6. CONFIGURAR AUTH EN SUPABASE

1. En Supabase → **Authentication** → **Settings**
2. En **Site URL**: poner `http://localhost:3000` (para desarrollo)
3. En **Redirect URLs**: agregar `http://localhost:3000/dashboard`
4. Deshabilitar "Email confirmations" para testear más rápido (en **Auth → Settings → Email**)

> En producción, volver a activar la confirmación de email.

---

## 7. DEPLOYAR EN VERCEL

### Primera vez:
1. Subir el proyecto a GitHub
2. Ir a **vercel.com** → New Project → importar el repo
3. En **Environment Variables**, agregar:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. Click **Deploy**

### Actualizaciones:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Vercel detecta el push y hace el deploy automáticamente.

---

## 8. ACTUALIZAR LA URL EN SUPABASE (PRODUCCIÓN)

Cuando tengas la URL de Vercel (ej: `https://viko-app.vercel.app`):

1. Supabase → **Authentication** → **Settings**
2. **Site URL**: `https://viko-app.vercel.app`
3. **Redirect URLs**: `https://viko-app.vercel.app/dashboard`

---

## 9. ESTRUCTURA DE RUTAS

| Ruta | Descripción |
|------|-------------|
| `/directorio` | Directorio público — lo ven todos |
| `/emprendimiento/[slug]` | Perfil público de cada emprendimiento |
| `/login` | Login del emprendedor |
| `/register` | Registro de nuevo emprendimiento |
| `/dashboard` | Panel privado (requiere login) |

---

## 10. AGREGAR EMPRENDIMIENTOS EXISTENTES (MIGRACIÓN)

Para migrar los emprendimientos del `data.js` actual, en **Supabase → SQL Editor**:

```sql
-- Primero crear un usuario admin ficticio o usar el tuyo propio
-- Luego insertar así:
INSERT INTO emprendimientos (user_id, nombre, rubro, tagline, desc, ubicacion, whatsapp, instagram, plan, envios, visible, images)
VALUES 
  ('TU_USER_ID', 'Don Diego', 'Gastronomía', 'Sous vide premium...', 'Descripción...', 'Pinamar', '5492254414211', 'dondiegopinamar', 'premium', false, true, ARRAY['img/...']);
```

> Para el `user_id`, buscalo en **Authentication → Users** después de crear tu cuenta.

---

## 11. PERSONALIZAR PRECIO DEL PLAN

En `src/app/(public)/directorio/DirectorioClient.tsx`, buscar:

```tsx
<div className={styles.planPrice}>$9900<span>/mes</span></div>
```

Cambiarlo al precio que quieras.

---

## 12. AGREGAR DOMINIO PROPIO

1. Comprar dominio (ej: `viko.ar` en NIC.ar)
2. En Vercel → Project → **Domains** → agregar el dominio
3. Seguir las instrucciones de DNS que te da Vercel
4. Actualizar la Site URL en Supabase con el dominio real

---

## RESUMEN DE ARCHIVOS CLAVE

```
src/
├── app/
│   ├── (auth)/login/        → Página de login
│   ├── (auth)/register/     → Registro de emprendedor
│   ├── (dashboard)/dashboard/ → Panel privado
│   └── (public)/
│       ├── directorio/      → Directorio público
│       └── emprendimiento/  → Perfil público
├── components/dashboard/    → Vistas del panel (Perfil, Productos, Métricas, Landing)
├── lib/
│   ├── supabase.ts          → Cliente para el browser
│   └── server.ts            → Cliente para el servidor
└── styles/                  → CSS modules compartidos
supabase/
└── schema.sql               → SQL para crear las tablas
```

---

## PRÓXIMOS PASOS SUGERIDOS (ROADMAP)

1. **Subida de imágenes** → Activar Supabase Storage y conectarlo al panel
2. **Métricas reales** → Crear tabla `visitas` y trackear clics en WhatsApp/Instagram
3. **Cobro de planes** → Integrar MercadoPago con webhooks para actualizar el campo `plan`
4. **Dominio propio** → Plan Pro donde el emprendedor conecta `sudominio.com`
