# Gym Tracker

App web y móvil (Expo) para registrar entrenamientos de gym con **carga progresiva semanal** y **plantilla mixta** (rutina base + libertad para cambiar ejercicios).

## Funciones

- Plantilla semanal por día (Lun, Mar, Mié…)
- Registrar peso y repeticiones por serie
- Sugerencia automática de peso la semana siguiente (+2.5 kg por defecto)
- Añadir, quitar o sustituir ejercicios en cada entrenamiento
- Gráficas de progreso por ejercicio
- **Panel de admin**: ver cuántos usuarios usan la app (total, activos 7/30 días, nuevos)

## Requisitos

- Node.js 18+
- Cuenta gratuita en [Supabase](https://supabase.com)

## 1. Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`.
3. Ve a **Project Settings → API** y copia:
   - Project URL
   - anon public key

## 2. Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

## 3. Instalar y ejecutar

```bash
cd gym-tracker
npm install
npm start
```

- **Web**: pulsa `w` o `npm run web`
- **Android**: pulsa `a` (requiere emulador o Expo Go)
- **iOS**: pulsa `i` (Mac + simulador o Expo Go)

## Estadísticas de usuarios (tu pregunta)

Cuando compartas la app web, el **primer usuario registrado** es admin automáticamente.

1. Entra con tu cuenta
2. Ve a **Ajustes → Ver estadísticas de usuarios**

Verás:

| Métrica | Qué mide |
|---------|----------|
| Total registrados | Cuentas creadas |
| Activos 7 días | Abrieron la app en la última semana |
| Activos 30 días | Abrieron la app en el último mes |
| Nuevos 7 días | Registros recientes |

Cada vez que alguien abre la app (web o móvil), se actualiza `last_seen_at` en Supabase.

## Desplegar la web

```bash
npx expo export --platform web
```

Sube la carpeta `dist/` a Vercel, Netlify o similar. Configura las mismas variables `EXPO_PUBLIC_*` en el hosting.

## Estructura

```
app/
  (auth)/       Login y registro
  (tabs)/       Inicio, Entrenar, Plantilla, Progreso, Ajustes
  workout/[id]    Sesión activa (registrar series)
  admin/stats     Panel de usuarios (solo admin)
lib/              Supabase, carga progresiva
hooks/            Datos de gym
supabase/         Schema SQL
```

## Carga progresiva

- Si completas todas las series objetivo → siguiente semana se sugiere **peso + incremento**
- Si no completas → se mantiene el mismo peso
- Ejercicios añadidos fuera de plantilla empiezan sin historial

## Licencia

Privado — uso personal.
