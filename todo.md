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

## Dropdowns V3: Estilo Cyberpunk Coherente
- [x] Aplicar estilos cyberpunk al componente Select de shadcn/ui (fondo negro, borde rojo neón, hover rojo)
- [x] Reemplazar selects nativos en CreateTournament.tsx
- [x] Reemplazar selects nativos en ManageRegistrations.tsx
- [x] Reemplazar selects nativos en Tournaments.tsx, Ranking.tsx y otras páginas con filtros

## Ecosistema de Monetización V4

### Esquema de BD
- [x] Tabla shop_items (productos físicos/digitales: nombre, descripción, imagen, precio RLC, stock, categoría)
- [x] Tabla shop_orders (usuario, item, cantidad, estado: pending/delivered/cancelled, fecha)
- [x] Tabla cosmetics (marcos/auras de perfil: nombre, tipo, imagen_preview, imagen_frame, precio RLC, rareza)
- [x] Tabla user_cosmetics (usuario, cosmetic, activo, fecha de compra)
- [x] Tabla reward_tasks (tipo: video/ad, título, descripción, recompensa RLC, url_contenido, duración_segundos)
- [x] Tabla user_reward_claims (usuario, task, completado, fecha)
- [x] Tabla brand_ads (marca, título, descripción, imagen, url_destino, activo, destacado, fecha_inicio, fecha_fin)

### Backend
- [x] Router shop: list, buy, getOrders, updateOrderStatus (admin)
- [x] Router cosmetics: list, buy, getMyCosmetics, setActive
- [x] Router rewards: listTasks, claimReward (con validación anti-spam)
- [x] Router ads: list, getActive, create (admin), trackClick

### Frontend
- [x] Página /shop/cosmetics — Tienda de cosméticos estilo Discord: grid de marcos/auras con preview en avatar
- [x] Página /shop — Tienda de productos con cards, precio RLC, botón comprar y notificación al admin
- [x] Página /rewards — Centro de recompensas con lista de tareas (ver video/ad → ganar RLC)
- [x] Reproductor de video/ad con temporizador y botón de reclamar al finalizar
- [x] Página /ads — Sección de publicidad para marcas estilo Epic Games (banners grandes, cards premium)
- [x] Sección TIENDA en SidebarLayout (Cosméticos, Productos, Recompensas, Publicidad)
- [x] Integración de marco/aura activo en avatar del usuario en el sidebar
- [ ] Panel admin: gestión de pedidos pendientes con notificación push (pendiente)

## Perfiles de Usuario y Panel Admin V5

### Perfiles de usuario
- [x] Ampliar tabla users: avatarUrl, bio, nickname, bannerUrl, socialLinks
- [x] Router profile: getProfile, updateProfile, uploadAvatar
- [x] Página pública /profile/:id con avatar, banner, cosméticos equipados, bio, stats
- [ ] Página /settings para editar perfil propio (foto, bio, nickname, redes) (pendiente)
- [x] Mostrar avatar con marco/aura activo en perfil público
- [x] Acceso rápido a perfil propio desde el sidebar

### Panel Admin Maestro (/admin)
- [x] Layout del panel admin con sub-navegación por tabs
- [x] Sección: Tienda de Productos (agregar/editar/eliminar items, ver pedidos, marcar entregado)
- [x] Sección: Cosméticos (agregar/editar/eliminar marcos y auras)
- [x] Sección: Publicidades (cargar banners para marcas, activar/pausar)
- [x] Sección: Rewards (cargar videos/enlaces YouTube, configurar duración y recompensa RLC)
- [x] Sección: Usuarios (lista, buscar, cambiar rol, asignar RLC manualmente)
- [x] Sección: Torneos (aprobar/rechazar torneos pendientes de verificación)
- [x] Sección: Noticias (crear/editar/publicar artículos del portal)
- [x] Notificaciones de pedidos pendientes en el panel admin

## Fix Responsivo V6
- [x] Corregir desbordamiento horizontal en móvil (overflow-x hidden global + tipografía responsiva)
- [x] Ajustar padding-top en páginas públicas (Tournaments, Ranking, News, Streams, TeamProfile)
- [x] Ajustar padding responsivo en PremiumLayout, MyTournaments, MyTeams, ManageRegistrations, CreateTournament

## Nuevas Funcionalidades V6
- [x] Página /settings para editar perfil propio (foto, banner, nickname, bio, redes sociales)
- [x] Endpoint profile.uploadImage para subir avatar y banner a S3
- [x] Endpoint profile.updateMine con soporte para profileType
- [x] Modal de onboarding para nuevos usuarios sin nickname (2 pasos: nickname + tipo de perfil)
- [x] Enlace a Configuración en el sidebar (junto al botón de cerrar sesión)
- [x] Componente BracketView interactivo con visualización en árbol y líneas conectoras SVG
- [x] Toggle Bracket/Lista en TournamentManage
- [x] Bracket público en TournamentDetail

## Perfil Público y Comunidad V7
- [x] Tabla user_follows (followerId, followingId) en schema.ts + migración
- [x] Endpoint community.listUsers (paginado, buscable, público)
- [x] Endpoints follows: follow, unfollow, getFollowers, getFollowing, isFollowing
- [x] Rediseñar UserProfile estilo Discord: banner full-width + avatar superpuesto, responsivo móvil
- [x] Mostrar contadores de seguidores/seguidos en el perfil
- [x] Botón Follow/Unfollow en perfil público (solo para usuarios autenticados)
- [x] Página /community con grid de usuarios registrados + búsqueda + follow
- [x] Enlace a /community en el sidebar (sección COMUNIDAD)
- [x] Tests para los nuevos endpoints (29 tests pasando)

## Fix Avatar Perfil V7.1
- [x] Corregir posición del avatar: debe quedar superpuesto sobre el borde inferior del banner (estilo Discord)

## Fix Avatar Posición V7.2
- [x] Avatar debe quedar en la esquina inferior-izquierda del banner, sobresaliendo hacia abajo, y el nombre debajo del avatar

## Equipos Públicos + Super Admin V8
- [x] Campos avatar/banner/description en tabla teams (schema + migración)
- [x] Endpoint teams.uploadImage para subir avatar y banner del equipo a S3
- [x] Endpoint teams.publicProfile con torneos, logros y jugadores con stats automáticas
- [x] Página pública /team/:id con banner, avatar, jugadores, torneos inscritos/ganados/perdidos
- [x] Estadísticas automáticas por jugador: torneos jugados, ganados, perdidos (desde registrations/matches)
- [x] Subida de imagen en Settings (avatar + banner del usuario) con preview
- [x] Subida de imagen en MyTeams (logo + banner del equipo)
- [x] Panel super admin mejorado: tab Overview con métricas globales, tab Equipos con verificación
- [x] Endpoint admin.stats con 8 métricas globales + usuarios recientes
- [x] Endpoint admin.listTeams y admin.verifyTeam
- [x] 29 tests pasando

## Home Epic Games + Creadores V9
- [x] Tabla content_creators (userId, status: pending/approved/rejected, bio, youtube, twitch, twitter, instagram, tiktok, subscribers, category)
- [x] Endpoint creators.submitApplication (solicitar ser creador)
- [x] Endpoint creators.listApproved (público)
- [x] Endpoint creators.listPending (admin)
- [x] Endpoint creators.review (aprobar/rechazar con nota admin)
- [x] Rediseñar Home: hero banner full-width + sidebar derecho con torneos patrocinados (estilo Epic Games)
- [x] Sección "Noticias Recientes" en Home
- [x] Sección "Torneos Activos" en Home (carrusel horizontal)
- [x] Sección "Nuevos Jugadores" en Home (usuarios recientes)
- [x] Carrusel "Quizás Conozcas" en Home (usuarios con follows en común o recientes)
- [x] Sección "Creadores Oficiales" en Home con tarjetas y redes sociales
- [x] Página /creators con grid de creadores aprobados + formulario de registro
- [x] Enlace a /creators en el sidebar (sección COMUNIDAD)
- [x] Sección admin para aprobar/rechazar solicitudes de creadores (tab CREADORES en AdminPanel)
- [x] 29 tests pasando

## Fix Admin Torneos + Banner V10
- [x] Corregir panel admin: adminListPendingTournaments filtraba por 'draft' en lugar de 'pending_approval'
- [x] Corregir typo en nombre de función adminApproveTournamentt -> adminApproveTournament
- [x] Torneos pending_approval/draft NO son visibles públicamente (solo creador y admin)
- [x] Agregar campo de banner en formulario CreateTournament con preview y subida a S3
- [x] 29 tests pasando

## Edición de Torneos V11
- [x] Endpoint tournaments.update (solo el creador o admin puede editar)
- [x] Página /dashboard/edit-tournament/:id con formulario de 3 pasos pre-cargado con datos del torneo
- [x] Botón "Editar" en TournamentManage y en MyTournaments
- [x] Soporte para cambiar el banner del torneo en la edición

## Banner de Fondo en TournamentDetail V12
- [x] Mostrar banner del torneo como fondo con opacidad en la página de detalle del torneo

## Fix Ruta /my-teams V12
- [x] Corregir error 404 en la ruta /my-teams (ruta correcta es /dashboard/teams, corregidos enlaces en Dashboard, TournamentDetail y TeamProfile)

## Sistema de Equipos Rediseñado V13
- [x] Endpoint teams.searchUsers para buscar jugadores por @nickname o nombre
- [x] Endpoint teams.addMember: solo el capitán puede añadir jugadores registrados en la plataforma
- [x] Endpoint teams.removeMember: solo el capitán puede eliminar jugadores
- [x] Endpoint teams.myMemberships y teams.membershipOf: saber a qué equipo pertenece un usuario
- [x] Mostrar equipo actual en el perfil público del jugador (UserProfile)
- [x] Rediseñar MyTeams: formulario de creación + gestión de roster con búsqueda por @nickname, añadir/eliminar miembros
- [x] Rediseñar TeamProfile público: fichas de jugadores con avatar, rol, juego, ID de juego, estadísticas individuales
- [x] Al inscribirse en torneo, validar que todos los miembros del equipo están registrados en la plataforma (ya existía)

## Mejoras Visuales V14
- [x] Agrandar tarjetas de torneos activos en el Home (w-72, h-44, con hover animado y badges de juego)
- [x] Rediseñar TournamentDetail: banner hero 420px a pantalla completa con título, organizador, info y botón CTA superpuestos
- [x] El banner del inicio lo sube el admin desde su panel (no auto-generado)

## Correcciones Home V15
- [x] Quitar banner hero automático del inicio (ahora solo muestra anuncios configurados por el admin)
- [x] Arreglar tarjeta de torneo: punto verde + etiqueta de estado debajo del título, antes del precio; badge de juego en esquina superior derecha
- [x] Corregir 404 al hacer click en tarjeta de torneo: ruta era /tournament/:id, corregida a /tournaments/:id en Home, TeamProfile y HeroSection

## Sección de Juegos en Home V17
- [ ] Tabla `games` en BD con campos: id, name, imageUrl, slug, isActive, sortOrder, createdAt
- [ ] Endpoints: games.list (público), games.create/update/delete (admin)
- [ ] Subir imágenes de Valorant, League of Legends, Marvel Rivals, Honor of Kings a S3
- [ ] Sembrar los 4 juegos iniciales en la BD con sus imágenes de S3
- [ ] Reemplazar sección "Torneos Activos" en Home por tarjetas de juegos tipo portada
- [ ] Al hacer click en un juego, ir a /tournaments?game=NombreJuego
- [ ] Filtro por juego funcional en la página de Torneos
- [ ] Panel admin: gestión de juegos (crear, editar, eliminar, subir imagen)

## Sección de Juegos + Gestión Admin V17
- [ ] Tab de juegos en panel admin (crear/editar/eliminar juegos con imagen)
- [ ] Foto de perfil (logo) y banner en formulario de crear equipo
- [x] Sección "Torneos por Juego" en Home con tarjetas tipo portada
- [x] Filtro por juego en /tournaments acepta nombre del juego desde el Home
- [x] Endpoint games.delete para eliminar juegos desde admin

## Gestión de Juegos + Equipo Imágenes V18
- [x] Tab JUEGOS en panel admin: crear/editar/eliminar juegos con subida de imagen (portada y logo)
- [x] Campos de logo y banner en formulario "Crear Equipo" de MyTeams con subida a S3
- [x] Resolución automática de apuestas al declarar ganador (ya estaba implementada en V2)

## Fix React Hooks Error V20
- [x] Corregir error "Rendered more hooks than during the previous render" en AdminPanel: hooks useQuery movidos antes del return condicional
- [x] 29 tests pasando

## Upload de Imágenes en Tienda y Cosméticos V21
- [x] Reemplazar campo "URL de imagen" en ShopTab por botón de subida de archivo (imagen del producto)
- [x] Agregar tab COSMÉTICOS en panel admin con upload de previewImage y frameImage (PNG transparente)
- [x] Endpoint admin.uploadImage para subir imágenes desde el admin a S3
- [x] Endpoints cosmetics.adminCreate/adminUpdate/adminDelete para gestión desde admin

## Flujo de Compra de Cosméticos V22
- [x] Modal de confirmación de compra estilo Discord con imagen del cosmético, precio en RLC y saldo actual
- [x] Validación de saldo: si no alcanza mostrar error "Saldo insuficiente", si alcanza debitar y habilitar
- [x] Galería de cosméticos en el perfil del usuario (sección "MI COLECCIÓN" en /shop/cosmetics)
- [x] Botón "Equipar" para aplicar marco/aura sobre la foto de perfil
- [x] Marco/aura (frameImage PNG transparente) visible públicamente en el avatar del usuario en sidebar y perfil público

## Mejoras de Cosméticos V23
- [x] Al comprar cosmético, redirigir al perfil del usuario en tab "Cosméticos" para equiparlo desde ahí
- [x] Centrar correctamente el overlay del marco/aura sobre el avatar en el perfil (transform: translate(-50%,-50%))
- [x] En la galería de cosméticos del perfil, mostrar la imagen con sus proporciones reales (aspect-square, object-cover)
- [x] Tab cosméticos en perfil propio muestra todos los cosméticos con botón de equipar; en perfil ajeno solo los equipados
- [x] Soporte de ?tab=cosmetics en URL del perfil para abrir directamente ese tab

## Quick Fix V24
- [x] Foto y nombre del usuario en el sidebar son clickeables y llevan al perfil

## Quick Fix V25
- [x] Ampliar el ancho del perfil de usuario para que ocupe todo el espacio disponible (quitar max-w-2xl)

## Quick Fix V26
- [x] Perfil ocupa todo el ancho disponible y el banner queda pegado arriba sin padding

## Quick Fix V27
- [x] Ajustar ancho del perfil a max-w-5xl centrado (banner pegado arriba, contenido centrado)

## Quick Fix V28
- [x] Reducir tamaño de las tarjetas de cosméticos en la galería del perfil (grilla 3-5 columnas, tarjetas más pequeñas con proporciones correctas)

## Quick Fix V29
- [x] Outline del cosmético equipado: más fino y que no se corte (outline 1px en lugar de ring-2)
- [x] Imagen del cosmético: object-cover para que llene la tarjeta sin espacios negros
- [x] Rareza mostrada con colores: gris (Común), azul (Raro), morado (Épico), dorado (Legendario)

## Quick Fix V30
- [x] Agregar padding inferior a la grilla de cosméticos para que el outline no se corte

## UserAvatar Component V31
- [x] Crear componente UserAvatar reutilizable con soporte de frameImage como overlay
- [x] Incluir activeFrame (frameImage) en los endpoints de listado de usuarios (community, ranking, followers, following, team members)
- [x] Aplicar UserAvatar en la página de Comunidad
- [x] Aplicar UserAvatar en la página de Ranking (ya tenía implementación)
- [x] Aplicar UserAvatar en tarjetas de equipos (MyTeams, TeamProfile)
- [x] Aplicar UserAvatar en Home (UserCard, CreatorCard, nuevos usuarios)
- [x] Aplicar UserAvatar en Creators.tsx
- [x] Aplicar UserAvatar en UserProfile (lista seguidores/seguidos)

## Fix Avatar Creadores + Verificación V32
- [x] Corregir z-index del avatar en tarjetas de creadores (Creators.tsx y Home.tsx) para que aparezca delante del banner
- [x] Campo isVerified en tabla users (schema + migración)
- [x] Endpoint verification.request (usuario solicita verificación, guarda en tabla)
- [x] Endpoint verification.list (admin lista solicitudes pendientes)
- [x] Endpoint verification.review (admin aprueba/rechaza con nota)
- [x] Badge de verificado (imagen oficial azul) en perfil público, tarjetas de creadores y comunidad
- [x] Botón "Solicitar verificación" en /settings del usuario
- [x] Tab VERIFICACIONES en panel admin con lista de solicitudes pendientes
- [x] Componente VerifiedBadge reutilizable con imagen oficial subida a S3

## Quitar estrella creadores V35
- [x] Quitar la estrella amarilla en Creators.tsx y Home.tsx, dejar solo VerifiedBadge junto al nombre

## Botón flotante creadores V36
- [x] Quitar banner expandible de solicitud de creador en Creators.tsx
- [x] Agregar botón flotante pequeño en esquina inferior derecha (solo en /creators)
- [x] Al hacer click, abrir modal con el formulario de solicitud de creador con animación suave

## Rediseño Recompensas estilo Discord V37
- [x] Rediseñar la UI de recompensas al estilo Discord Quests (tarjetas con thumbnail, sponsor, misión, botón)
- [x] Reproductor de video: deshabilitar pausa y adelantar (solo reproducción lineal)
- [x] Contador del video sincronizado con currentTime del elemento video (no timer independiente)
- [x] Modal de recompensa ganada al terminar el video (estilo Discord: coin animado, saldo actualizado, botón tienda)
- [x] Campos thumbnailUrl, sponsorName, expiresAt en tabla rewardTasks (schema + migración)
- [x] Header bar con tabs Todas/Reclamadas y balance de RLC Coins
- [x] Hero section con título y balance destacado
- [x] Grid de tarjetas estilo Discord Quests (3 columnas, thumbnail 16:9, sponsor, fecha, CTA)

## VideoPlayerModal Discord Style V38
- [x] Modal más grande (min(900px, 90vw)), video ocupa todo el ancho
- [x] Barra de progreso bloqueada (no se puede adelantar con click/drag)
- [x] Botones con colores RLC rojos (reclamar recompensa usa oklch rojo RLC)
- [x] Footer con info de la misión y botón de reclamar al estilo Discord
- [x] Rediseñar QuestCard al estilo Discord: sponsor badge con checkmark verde, título en rojo RLC, botón con tiempo restante (mm:ss), info fuera del thumbnail
- [x] Botón de acción en tarjeta muestra tiempo restante en formato mm:ss estilo Discord
- [x] Badge 'Patrocinado por ✅ [Empresa]' visible fuera del thumbnail con checkmark verde
- [x] Agregar campos thumbnailUrl, sponsorName, sponsorLogoUrl y expiresAt al formulario de creación de tareas en AdminPanel
- [x] Reemplazar campos URL thumbnail y URL logo en AdminPanel por upload de imagen directo con preview
- [x] Ocultar controles nativos de YouTube en el iframe del modal (controls=0)
- [x] Cambiar botón "Reanudar" a "Ver Video" en tarjetas QuestCard con color rojo RLC
- [x] Usar logo del sponsor en el círculo del ícono de misión en QuestCard
- [x] Botón "Reanudar" en modal también usa color rojo RLC
- [x] Contador del modal se pausa cuando el video se pausa (YouTube IFrame API)
- [x] Ocultar panel "Más videos" que aparece al pausar (rel=0 + enablejsapi)
- [x] Corregir barra de progreso que no avanza al reproducir video YouTube
- [x] Botón en modal: 'Ver video (Xm Xs restantes)' mientras corre, 'Reclamar recompensa' cuando termina
- [x] Corregir barra roja y botón que no cambia de estado en modal YouTube
- [x] Eliminar badge de monedas de la esquina superior derecha en Rewards
- [x] Sincronizar video YouTube y contador: playVideo/pauseVideo via postMessage al hacer clic en overlay
- [x] Auto-play al abrir modal: ytPlaying=true desde inicio, video arranca automáticamente
- [x] Mejorar responsividad del modal de video en móvil
- [x] Agregar tabla section_banners al schema para banners por sección
- [x] Reemplazar campo URL imagen de portada en NewsTab por ImageUploader
- [x] Reemplazar campos URL imagen en AdsTab por ImageUploader
- [x] Crear tab "Banners" en AdminPanel para gestionar banners de secciones
- [ ] Crear tab "Publicidades" mejorada con orden de prioridad drag & drop
- [ ] Mostrar banners de sección en las páginas correspondientes
- [x] HeroSection del inicio usa imagen de section_banners[home] en lugar de publicidades
- [ ] Eliminar bloque de texto/descripción y fondo oscuro debajo del SectionBanner en todas las páginas
- [x] Texto de cada sección superpuesto sobre la imagen del SectionBanner (título + descripción encima del banner)
- [x] Sistema de publicidad rediseñado: carousel auto-slide (featured), grid cards pequeñas, cards anchas
- [x] Panel admin para gestionar anuncios por tipo (featured/card/wide) con subida de imagen
- [x] Agregar Equipos al menú lateral y crear página pública de listado de equipos
- [x] Edición inline de banners de sección directamente en la página (solo admins)
- [x] Aumentar altura banner en escritorio y preview en tiempo real del texto
- [x] Cambiar tipografía de lectura por una más legible en toda la plataforma
- [x] Corregir enlaces rotos en Dashboard (Torneos Creados y Ver Todos daban 404)
- [x] Reemplazar font-mono (Share Tech Mono) por Inter para mejor legibilidad en toda la plataforma
- [x] Event Bus interno para desacoplar lógica (tournament.full, mission.approved, creator.verified, etc.)
- [x] Tabla notifications en BD para notificaciones de usuarios
- [x] Automatización de torneos: brackets auto al llenarse + notificar equipos
- [x] UI de notificaciones: campana en header con badge de no leídas
- [ ] Rediseñar Home con sección de estadísticas de plataforma
- [ ] Agregar sección de actividad reciente al inicio
- [ ] Agregar top jugadores/equipos al inicio
- [x] Agregar sección de creadores destacados al inicio
- [x] Agregar sección de misiones disponibles al inicio
- [x] Agregar sección de noticias recientes al inicio
- [x] Endpoints tRPC para estadísticas, actividad reciente y top jugadores

## Rediseño Home Completo V_Next
- [x] Rediseñar Home con sección de estadísticas de plataforma (4 stat cards)
- [x] Agregar sección de actividad reciente al inicio (torneos, equipos, usuarios)
- [x] Agregar top jugadores/equipos al inicio (leaderboard)
- [x] Agregar sección de creadores destacados al inicio
- [x] Agregar sección de misiones disponibles al inicio
- [x] Agregar sección de noticias recientes al inicio

## Reorganización Home V_Community
- [ ] Banner hero sin textos superpuestos (limpio)
- [ ] Tarjeta de torneo con info estilo communitygaming: tipo bracket, formato (1v1/5v5), slots (11/64), organizador, fecha y premio
- [ ] Lista de juegos solo MOBAs/team vs team (League of Legends, Valorant, Honor of Kings, Marvel Rivals, etc.)
- [ ] Misiones disponibles en scroll horizontal completo (recuadro completo visible)
- [ ] Creadores de contenido: tarjetas más grandes, scroll horizontal, 4 en escritorio
- [ ] Sección combinada Equipos + Personas: equipos a la izquierda (top 8 con scroll interno), personas a la derecha (top 8 con scroll interno)
- [ ] Auto-refresh de la sección combinada cada 30 segundos para mostrar nuevos equipos/personas
- [ ] Click en equipo lleva a /teams/:id, click en persona lleva a /profile/:id
- [ ] Sección Creadores: layout 2 columnas (scroll horizontal izquierda + banner publicitario derecha)
- [ ] Componente TournamentCard universal (bracket, formato, slots, organizador, fecha, premio)
- [ ] Aplicar TournamentCard universal en todas las páginas de torneos
- [ ] Traducir toda la UI al español
- [ ] Sección Creadores: layout 2 columnas (scroll horizontal + banner publicitario)
- [x] Tarjetas de creadores y misiones: mismo tamaño que el banner publicitario
- [x] Banner publicitario: ancho completo de su espacio, solo imagen sin cuerpo de texto
- [x] Banner publicitario de ancho completo separado de Creadores
- [x] Corregir desplegable campanita que se sale del ancho de la pantalla
- [x] Eliminar sección Creadores Oficiales del Home
- [x] Banner publicitario: altura fija que respete el alto de la imagen
- [x] Ocultar flechas de navegación en móvil en HScrollSection
- [x] Eliminar barra de scroll horizontal visible en secciones del Home
- [x] Corregir posición del dropdown de notificaciones: abrir hacia la derecha del botón
- [ ] Corregir posicionamiento dropdown notificaciones: alinear con icono campana usando position fixed

## Migración gameSlug (Fase 1 + 2)
- [x] Auditar valores legacy en tournaments.game y teams.game
- [x] Fase 1: añadir gameSlug nullable a tournaments y teams en schema + db:push
- [x] Fase 2: script de backfill idempotente con mapeo de normalización
- [x] Proteger slug inmutable si hay torneos/equipos asociados en games.upsert

## Migración gameSlug Fase 4 (Filtros por slug)
- [x] Actualizar getTournaments en db.ts con gameSlug + fallback legacy
- [x] Añadir gameSlug al input de tournaments.list en routers.ts
- [x] Actualizar Tournaments.tsx para usar slug en filtros y URLs
- [x] Actualizar Home.tsx para generar URLs con slug en lugar de nombre

## Migración gameSlug Fase 3 (Dual-write)
- [x] Añadir helper resolveGameSlug en db.ts
- [x] Dual-write en createTournament y updateTournament
- [x] Dual-write en createTeam y updateTeam

## Migración gameSlug Fase 4b (Filtros por slug en equipos)
- [x] Actualizar getTeamRanking en db.ts con gameSlug + fallback legacy
- [x] Añadir gameSlug a teams.list, teams.ranking y ranking.teams en routers.ts
- [x] Actualizar Ranking.tsx para usar gameSlug en el query
- [x] Actualizar Teams.tsx: reemplazar array hardcodeado GAMES por juegos de la BD con slugs

## Sistema de Fichas de Jugador y Roster Competitivo V-Roster

- [ ] Añadir campo rosterPhoto a tabla users en schema.ts y migrar con pnpm db:push
- [ ] Endpoint profile.uploadRosterPhoto: subir foto de roster solo si usuario tiene equipo aprobado
- [ ] Exponer rosterPhoto en getTeamPublicProfile y getUserPublicProfile
- [ ] Settings.tsx: sección de foto de roster con validación de equipo aprobado
- [ ] PlayerCard en TeamProfile.tsx: foto de roster formato carta (aspect-ratio 2/3), fallback a avatar
- [ ] PlayerCard: mostrar rol dinámico según juego del equipo
- [ ] PlayerCard: mostrar elo y región competitiva del jugador
- [ ] Ranking.tsx: TOP 5 equipos como cards visuales cuando hay datos
- [ ] Ranking.tsx: confirmar que no muestra campeón/posiciones con status no_results
- [ ] TeamProfile.tsx: banner full-width sin margen lateral
- [ ] UserProfile.tsx: avatar circular 288x288px en vista de perfil público
- [ ] Tests vitest para uploadRosterPhoto y validación de membresía aprobada

## Sistema de Fichas de Jugador y Roster Competitivo

- [x] Añadir campo rosterPhoto (text) a la tabla users en schema.ts y migrar con pnpm db:push
- [x] Añadir función hasApprovedTeamMembership en db.ts (verifica inscripción aprobada en torneo)
- [x] Actualizar updateUserProfile en db.ts para aceptar rosterPhoto
- [x] Añadir rosterPhoto a getUserPublicProfile en db.ts
- [x] Añadir rosterPhoto a getTeamPublicProfile en db.ts (miembros del equipo)
- [x] Añadir endpoint profile.uploadRosterPhoto en routers.ts (protegido, valida equipo aprobado)
- [x] Añadir endpoint profile.hasApprovedTeam en routers.ts
- [x] Actualizar profile.updateMine para aceptar gameRole, elo, competitiveRegion, rosterPhoto
- [x] Añadir componente RosterPhotoUpload en Settings.tsx con validación de equipo aprobado
- [x] Rediseñar PlayerCard en TeamProfile.tsx: foto de roster formato carta (2:3), rol/elo/región
- [x] Añadir componente Top5Cards en Ranking.tsx (solo cuando rankingStatus !== no_results y >=2 equipos)
- [x] Aumentar avatar en UserProfile.tsx a 128px (circular, con frame/aura escalados)
- [x] Añadir sección "Ficha Competitiva" en overview de UserProfile.tsx (foto roster + rol + elo + región)
- [x] Escribir tests de vitest para hasApprovedTeamMembership, rosterPhoto, TOP5, winRate (17 tests)

## Roster Card Generada Automáticamente (Feb 2026)
- [x] Campo rosterImageUrl añadido al schema de users y migrado
- [x] Sharp instalado para composición de imágenes en servidor
- [x] Módulo rosterCard.ts: genera card 600x900 con foto, overlay, nick, rol, logo y tag del equipo
- [x] Endpoint profile.uploadRosterCard: valida membresía aprobada, genera card y guarda en S3
- [x] URL de foto original guardada en rosterPhoto; URL de card compuesta en rosterImageUrl
- [x] Settings.tsx: uploader simplificado (solo foto), muestra preview de la card generada
- [x] TeamProfile.tsx PlayerCard: usa rosterImageUrl con fallback a rosterPhoto
- [x] UserProfile.tsx ficha competitiva: usa rosterImageUrl con fallback a rosterPhoto
- [x] 19 tests de vitest pasando para el sistema de roster card

## Perfil Competitivo (Tab FICHA)
- [x] Añadir campos gameId y competitiveScore al schema (users)
- [x] Migrar schema con pnpm db:push
- [x] Actualizar db.ts: getUserPublicProfile, updateUserProfile, getTeamPublicProfile con gameId y competitiveScore
- [x] Actualizar routers.ts: profile.updateMine acepta gameId y competitiveScore
- [x] Añadir tab "FICHA" en UserProfile.tsx con botón EDITAR para perfil propio
- [x] Componente RosterTab: formulario de edición inline (juego, rol, elo, región, gameId, puntaje)
- [x] RosterTab: badge de rol como fuente de verdad (sin duplicar texto)
- [x] RosterTab: uploader de foto de roster integrado con preview de card generada
- [x] RosterTab: vista pública con badges visuales de rol, elo, región, gameId, puntaje
- [x] Actualizar Settings.tsx: añadir inputs de gameId y competitiveScore al formulario competitivo
- [x] 65 tests pasando, 0 errores TypeScript

## Selectores Dinámicos de Rol/Rango V18
- [x] Actualizar shared/gameRoles.ts: añadir svgPath a roles, añadir rangos por juego (GameRankData, GAME_RANKS, getRanksForGame)
- [x] Crear componente RoleSelector.tsx: dropdown custom con iconos SVG, pill rojo, panel flotante animado
- [x] Crear componente RankSelector.tsx: dropdown custom con puntos de color por rango, panel flotante animado
- [x] Reemplazar select nativo de ROL en tab FICHA de UserProfile.tsx con RoleSelector
- [x] Reemplazar input de texto de ELO/RANGO con RankSelector (opciones dinámicas por juego)
- [x] Reset de rol y rango al cambiar de juego principal
- [x] Actualizar badges de rol/rango en vista pública del tab FICHA con colores de rango
- [x] Actualizar badge de rol en barra de meta-info del perfil con icono SVG
- [x] Actualizar badge de rango en barra de meta-info con color del rango
- [x] 65 tests pasando, 0 errores TypeScript

## Unificación Visual Dropdowns Perfil Competitivo V19
- [x] Crear componente genérico GameDropdown con estilo pill rojo, panel flotante animado
- [x] Refactorizar RoleSelector y RankSelector para usar GameDropdown como base
- [x] Reemplazar select nativo de Juego principal con GameDropdown
- [x] Reemplazar select nativo de Región competitiva con GameDropdown
- [x] Todos los 4 dropdowns con altura, padding y tipografía consistentes

## Rediseño Ficha Competitiva (Roster Card) V20
- [x] Rediseñar rosterCard.ts: nueva tipografía UI moderna, layout con jerarquía clara
- [x] Imagen del jugador en zona superior (62% de la card)
- [x] Nick destacado con fuente grande y limpia
- [x] Info secundaria (nombre real + país) debajo del nick
- [x] Badges en una sola línea (rol, rango, región) sin duplicar texto
- [x] Icono SVG del rol en lugar del logo del equipo
- [x] Reducir ruido visual: menos colores, más espaciado, tipografía consistente
- [x] Actualizar RosterCardOptions para recibir elo, country, mainGame, gameRoleLabel
- [x] Actualizar el router para pasar los nuevos campos a generateRosterCard
- [x] Actualizar tests de rosterCard para reflejar el nuevo diseño
- [x] RosterCard: eliminar contenido extra debajo de la foto (badge CAP desbordado), aumentar tamaño de tipografía del panel derecho
- [x] Fix TeamProfile.tsx: usar rosterPhoto (foto original) en lugar de rosterImageUrl (tarjeta completa legacy) como photoUrl de RosterCard

## Streams Browse por Juego V_STREAMS
- [x] Añadir campo `game` a tabla streams en schema + migración
- [x] Query getStreamsByGame: agrupados por juego, máx 5 por grupo con window functions
- [x] tRPC procedure streams.byGame (public)
- [x] Componente StreamCard premium esports
- [x] Página /streams rediseñada estilo Twitch Browse por categoría
- [x] Ruta /streams/:id para página individual del stream
- [x] Tests para getStreamsByGame

## Streams de Creadores V_CREATOR_STREAMS
- [x] Schema: añadir userId, type (tournament|creator), gameSlug a tabla streams + migración
- [x] server/db.ts: createCreatorStream, stopCreatorStream, getActiveStreamByUser, actualizar getStreamsByGame con type
- [x] routers.ts: streams.startCreatorStream (creatorProcedure), streams.stopCreatorStream, streams.myActiveStream
- [x] UI Creators.tsx: sección "Transmitir ahora" con formulario (título, juego, plataforma, URL) y estado de stream activo
- [x] StreamCard: badge TORNEO vs CREADOR diferenciador
- [x] Tests para nuevos procedures de streams de creadores

## Limpieza y mejoras de streams
- [x] Eliminar streams de prueba (mocks) de la BD
- [x] Contador EN VIVO en sidebar con badge rojo y refresco cada 60s
- [x] Integrar Twitch API: cron job que actualiza isLive, viewerCount y thumbnailUrl automáticamente

## Twitch Handle en perfil de usuario
- [x] Procedure creators.updateChannels para editar twitch/youtube handle
- [x] UI en /settings: sección CANALES DE STREAMING para creadores aprobados
- [x] CreatorStreamPanel pre-rellena URL desde creatorApp.twitch automáticamente
- [x] Tests 93 pasando, TypeScript limpio

## YouTube Data API Sync
- [x] Obtener YOUTUBE_API_KEY y configurar en secrets
- [x] Implementar syncYouTubeStreams() en twitchSync.ts
- [x] Integrar en cron job principal junto a syncTwitchStreams
- [x] Tests para syncYouTubeStreams

## Mejoras cron job streams
- [x] Viewer count real de YouTube via videos?part=liveStreamingDetails
- [x] Notificación al owner cuando isLive cambia de false a true (Twitch + YouTube)
- [x] Tests para las nuevas funciones (102 pasando)

## Perfil de Creador — Mejoras
- [x] Aprobar cuenta admin como creador en BD (ya estaba aprobado)
- [x] Badge EN VIVO pulsante en perfil público del creador (streams.activeByUser, refresco 60s)
- [x] Historial de streams en perfil del creador (procedure historyByUser + UI en tab overview)
- [x] Procedures streams.activeByUser y streams.historyByUser en router (públicos)
- [x] 102 tests pasando, 0 errores TypeScript

## Badge EN VIVO en tarjetas de creadores
- [x] Procedure streams.liveCreators: devuelve Set de userIds de creadores en vivo
- [x] Badge EN VIVO pulsante en CreatorCard del Home (prop isLive + glow rojo)
- [x] Badge EN VIVO pulsante en tarjetas de Creators.tsx (refetch 60s)
- [x] 102 tests pasando, 0 errores TypeScript

## Prioridad ALTA — Sprint actual
- [ ] Filtro "En Vivo" en /creadores: tab adicional que muestra solo creadores transmitiendo
- [ ] Sección "Creadores en Vivo Ahora" en Home: condicional, aparece solo cuando hay streams activos
- [ ] Sistema de Juegos: tabla games, endpoints, imágenes S3, tarjetas portada en Home, filtro en Torneos
- [ ] Rediseño Home: banner limpio, TournamentCard con bracket/slots/premio, sección Equipos+Personas, creadores scroll horizontal

## Prioridad MEDIA — Sprint actual
- [ ] SectionBanners mejorados: eliminar texto debajo del banner en páginas públicas
- [ ] SectionBanners admin: drag & drop para reordenar, mejoras UX
- [ ] TournamentCard universal: bracket, formato, slots, organizador, fecha, premio
- [ ] Corrección dropdown notificaciones: alinear con icono campana en SidebarLayout
- [ ] Traducción completa al español: revisar toda la UI y corregir textos en inglés

## Prioridad MEDIA — Sprint actual
- [ ] SectionBanners mejorados: eliminar texto debajo del banner en páginas públicas
- [ ] SectionBanners admin: drag & drop para reordenar, mejoras UX
- [ ] TournamentCard universal: bracket, formato, slots, organizador, fecha, premio
- [ ] Corrección dropdown notificaciones: alinear con icono campana en SidebarLayout
- [ ] Traducción completa al español: revisar toda la UI y corregir textos en inglés

## Prioridad MEDIA — Completado
- [x] SectionBanners admin mejorado: campos título, subtítulo y link en BannersTab del AdminPanel
- [x] TournamentCard universal: ya implementado con bracket, formato, slots, organizador, fecha, premio
- [x] Corrección dropdown notificaciones: ahora usa position:fixed calculado desde el botón campana (alineado correctamente)
- [x] Traducción completa al español: corregidos "Coach"→"Entrenador", "Roster"→"Alineación", "Badge"→"Insignia", "Bundle"→"Paquete", "Single/Double Elimination"→español, "Win Rate"→"Tasa de Victoria", "Videojuegos" en categorías, "Identificador Único" en lugar de "Slug"
- [x] 102 tests pasando, 0 errores TypeScript

## Sprint Siguiente — Funcionalidades Avanzadas
- [x] Bracket visual interactivo: visualización por rondas con navegación, botones X/✓ para creador del torneo
- [x] Bracket: datos de ejemplo visibles en TournamentDetail para mostrar cómo quedará
- [x] Notificaciones automáticas: al cambiar estado de torneo a "En Curso"
- [x] Notificaciones automáticas: al aprobar inscripción de equipo
- [x] Notificaciones automáticas: al registrar resultado de partido
- [x] Perfil de equipo: gráfica de rendimiento mensual (victorias/derrotas por mes)
- [x] Perfil de equipo: sistema de logros desbloqueables basados en torneos ganados
