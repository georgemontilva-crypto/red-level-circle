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
- [x] Checkpoint y entrega al usuario

## Expansión V2: Plataforma Completa de Esports

### Esquema de BD ampliado
- [x] Tabla user_profiles (tipo: player/team_captain/event_creator, bio, avatar, redes sociales)
- [x] Tabla news (título, contenido, imagen, autor, categoría, publicado)
- [x] Tabla rlc_coins (balance por usuario, historial de transacciones)
- [x] Tabla bets (usuario, torneo, equipo apostado, monto, estado, resultado)
- [x] Tabla streams (torneo, plataforma, url, estado en vivo)
- [x] Tabla promotions (banner, título, descripción, link, activo)
- [x] Tabla tournament_results (tabla de posiciones final)
- [x] Ampliar tournaments: banner, reglamento, premios detallados, estado de verificación admin
- [x] Ampliar teams: logo, banner, redes sociales, descripción larga, logros

### Home rediseñado
- [x] Sección hero con próximos torneos y cuenta regresiva
- [x] Carrusel de torneos destacados/activos
- [x] Sección de transmisiones en vivo (streams activos)
- [x] Sección de noticias recientes (últimas 3)
- [x] Banner de promociones rotativo
- [x] Ranking top 5 equipos en home
- [ ] Sección de juegos disponibles en la plataforma (pendiente)

### Tres tipos de registro de usuario
- [ ] Flujo de onboarding: selección de tipo (Jugador / Capitán de Equipo / Creador de Eventos) (pendiente)
- [ ] Perfil de jugador: nickname, juego principal, estadísticas (pendiente)
- [ ] Perfil de capitán: gestión de equipo, roster (pendiente)
- [ ] Perfil de creador: torneos creados, verificación premium (pendiente)
- [ ] Verificación de torneos por admin (panel admin con lista de torneos pendientes) (pendiente)

### Perfiles de equipos
- [x] Página pública de perfil de equipo (/teams/:id)
- [x] Sección de jugadores (roster) con roles
- [ ] Historial de torneos (ganados, perdidos, participaciones) (pendiente)
- [x] Estadísticas: win rate, partidas jugadas, torneos ganados
- [x] Logros/badges del equipo
- [x] Banner y logo del equipo

### Ranking global
- [x] Página de ranking de equipos con puntuación acumulada
- [x] Filtro por juego
- [x] Sistema de puntos por resultado en torneos
- [ ] Top 10 jugadores individuales (pendiente)

### Portal de noticias
- [x] Lista de noticias con categorías (torneos, equipos, juegos, plataforma)
- [x] Página de detalle de noticia
- [ ] Panel admin para crear/editar noticias (pendiente)
- [ ] Noticias relacionadas por categoría (pendiente)

### Centro de apuestas (RLC Coins)
- [x] Moneda interna: RLC Coins (balance en perfil de usuario)
- [x] Wallet: ver balance, historial de transacciones
- [x] Apostar en torneos activos (elegir equipo ganador)
- [ ] Resolución automática de apuestas al declarar ganador (pendiente)
- [ ] Multiplicadores según probabilidad (basado en ranking) (pendiente)
- [ ] Panel admin para gestionar apuestas y ajustar balances (pendiente)

### Página de torneo mejorada
- [ ] Banner personalizable del torneo
- [ ] Sección de reglamento con formato rico
- [ ] Estadísticas del torneo (partidas jugadas, goles, etc.)
- [ ] Bracket visual interactivo (árbol con líneas conectoras)
- [ ] Tabla de posiciones (para formato grupos)
- [ ] Lista de equipos inscritos con links a perfiles
- [ ] Sección de streams del torneo
- [ ] Premios detallados (1°, 2°, 3° lugar)

### Transmisiones en vivo
- [x] Página de streams activos (/streams)
- [x] Embed de Twitch/YouTube en página de torneo
- [ ] Indicador "EN VIVO" en torneos con stream activo (pendiente)
- [ ] Panel para que el creador agregue links de stream (pendiente)

### Tabla de resultados
- [ ] Historial completo de resultados por torneo
- [ ] Filtros por juego, fecha, equipo
- [ ] Exportar resultados (CSV)

## Navegación V3: Menú Lateral Global
- [x] Crear componente SidebarLayout con menú lateral persistente estilo cyberpunk
- [x] Secciones agrupadas: GENERAL, TORNEOS, COMUNIDAD, CUENTA
- [x] Iconos + texto en cada ítem, sección activa resaltada en rojo neón
- [x] Botón cerrar sesión al fondo del sidebar
- [x] Versión colapsable en móvil (hamburger)
- [x] Aplicar en: Home, Tournaments, TournamentDetail, Ranking, News, Streams, Betting, TeamProfile, Dashboard y subpáginas
