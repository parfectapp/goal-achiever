# GOAL ACHIEVER — Tu día en orden

Asistente personal de metas tipo JARVIS: convierte metas grandes (triatlón en 6 meses,
$1M en 10 años) en el plan exacto de hoy. Multi-usuario (familia), carreras sociales
por círculos, y nube familiar para sincronizar entre dispositivos.

**EN VIVO:** https://parfectapp.github.io/goal-achiever/
**Local:** `python3 -m http.server 4276 --directory ~/claude/goal-achiever` → http://localhost:4276

## Backend (nube familiar)

Supabase (proyecto compartido con ABONO). Activación única: pegar `supabase-schema.sql`
en supabase.com → SQL Editor → Run. Luego, en la app: Perfil → Nube familiar → "Crear mi casa"
→ compartir el código CASA-XXXXXX con la familia → cada quien "Unirme" en su dispositivo.
Sincroniza: perfiles, checks, metas, círculos/carreras y empujones. La API key de Claude
y el chat NUNCA suben a la nube (viven solo en cada dispositivo).

## Features y de dónde se copiaron (investigación jul 2026)

| Feature | Copiado de |
|---|---|
| Timeline vertical con línea de "AHORA" | Structured |
| Replaneo del resto del día (bloques pendientes se recorren) | Motion (auto-reshuffle) |
| Briefing matutino generado | Reclaim.ai |
| Cierre del día con resumen y reflexión | Sunsama (shutdown ritual) |
| Scorecard semanal, meta ≥85% de ejecución | 12 Week Year |
| Máximo 3 metas en foco por ciclo | 12 Week Year |
| Backward planning: fecha → milestones hacia atrás | GoalsOnTrack |
| Pace line (a ritmo / atrasado vs tiempo transcurrido) | Strides |
| Racha con seguro (1 día de gracia ganado por consistencia) | Duolingo / Fabulous |
| Rutinas fijas que defienden metas (semana perfecta) | Reclaim (Habits) |
| Carta a tu futuro yo (commitment device) | Fabulous |
| Asistente conversacional con contexto completo | Motion/Reclaim AI + BYOK |

## Asistente

- **Modo local** (sin key): briefing, ¿qué sigue?, progreso, replanear, cierre del día.
- **Modo Claude (BYOK)**: pega tu API key en Perfil → responde Claude (`claude-opus-4-8`)
  con todo tu contexto: metas, pace, plan de hoy, scores, carta. La key vive solo en tu navegador.

## Metas sembradas

1. ◆ Triatlón sprint — 2027-01-10 (750m/20km/5km)
2. ◆ Rentable en trading — 3 meses seguidos PF>1 en journal real (regla: honestidad brutal)
3. ◆ $1M USD — 2036, con calculadora de interés compuesto
4. Ahorrar e invertir 30% de ingresos
5. 1 viaje internacional al año

Archivos: `index.html` (vistas), `styles.css` (tinta+hueso+oro, sin neón), `app.js` (motor).
