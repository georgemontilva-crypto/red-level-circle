# Red Level Circle - TODO

## Fase 1: Base de datos y estilos
- [x] Esquema de base de datos: tablas tournaments, teams, team_members, tournament_registrations, registration_audit_log, tournament_matches
- [x] Estilos globales cyberpunk/neon en index.css (fondo negro, acentos rojo neón)
- [x] Fuentes tech modernas (Google Fonts: Orbitron, Rajdhani, Share Tech Mono)
- [x] Componentes UI base con estética neon (inputs, botones, cards)

## Fase 2: Autenticación y roles
- [x] Sistema de roles: user, premium, admin en la tabla users
- [x] Página de login con diseño cyberpunk (imagen lateral + formulario)
- [x] Protección de rutas por rol (premiumProcedure)
- [x] Upgrade a premium (simulado con notificación)

## Fase 3: API Backend
- [x] Router de torneos (CRUD completo + cambio de estado + inicio)
- [x] Router de equipos (CRUD completo)
- [x] Router de inscripciones (estados: Pendiente, Aprobado, Rechazado, Cancelado)
- [x] Router de resultados y brackets (matches, updateResult, declareWinner)
- [x] Validaciones de requisitos de torneo

## Fase 4: Vista pública
- [x] Landing page con torneos destacados y estética cyberpunk
- [x] Lista pública de torneos disponibles con filtros
- [x] Página de detalle de torneo con información completa
- [x] Formulario de inscripción de equipo con validaciones

## Fase 5: Dashboard Premium
- [x] Layout con navegación lateral estilo cyberpunk (PremiumLayout)
- [x] Dashboard principal con estadísticas y acciones rápidas
- [x] Formulario de creación de torneo (juego, bracket, reglas, fechas, premios)
- [x] Vista de gestión individual de torneo (TournamentManage)
- [x] Página de mis torneos (MyTournaments)

## Fase 6: Gestión de inscripciones
- [x] Tabla de inscripciones con columnas: equipo, fecha, estado, mensaje
- [x] Filtros por estado (Pendiente, Aprobado, Rechazado, Cancelado, Todos)
- [x] Barra de búsqueda por nombre de equipo
- [x] Acciones: Aprobar, Rechazar, Cancelar (con mensaje opcional)
- [x] Resumen visual de conteos por estado
- [x] Historial completo de inscripciones con auditoría (modal de historial)

## Fase 7: Ejecución de torneos
- [x] Generación automática de brackets (single/double elimination, grupos)
- [x] Visualización del bracket por rondas
- [x] Carga de resultados de partidas (scores + ganador)
- [x] Declaración del ganador del torneo
- [x] Cambio de estado del torneo (draft → inscripciones → en curso → finalizado)

## Fase 8: Calidad y entrega
- [x] Tests unitarios con Vitest (13 tests, 2 archivos)
- [x] Estados de carga y error en toda la UI
- [x] Diseño responsivo (desktop, tablet, móvil)
- [ ] Checkpoint y entrega al usuario
