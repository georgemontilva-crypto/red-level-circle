import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  decimal,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  role: mysqlEnum("role", ["player", "to", "cdc", "partner", "admin", "super_admin"]).default("player").notNull(),
  // Extra permission: CDC/Partner that also got TO approval
  canCreateTournaments: boolean("canCreateTournaments").default(false).notNull(),
  // Organizer public profile fields (filled when requesting TO role)
  orgName: varchar("orgName", { length: 128 }),
  orgDescription: text("orgDescription"),
  // Profile type chosen during onboarding
  profileType: mysqlEnum("profileType", ["player", "team_captain", "event_creator"]).default("player"),
  avatar: text("avatar"),
  bio: text("bio"),
  nickname: varchar("nickname", { length: 64 }),
  mainGame: varchar("mainGame", { length: 64 }),
  gameRole: varchar("gameRole", { length: 64 }),
  elo: varchar("elo", { length: 64 }),
  competitiveRegion: varchar("competitiveRegion", { length: 32 }),
  gameId: varchar("gameId", { length: 128 }), // ID del jugador en el juego (ej: SummonerName#EUW)
  competitiveScore: int("competitiveScore").default(0), // Puntaje competitivo acumulado
  country: varchar("country", { length: 64 }),
  socialDiscord: varchar("socialDiscord", { length: 128 }),
  socialTwitch: varchar("socialTwitch", { length: 128 }),
  socialTwitter: varchar("socialTwitter", { length: 128 }),
  bannerUrl: text("bannerUrl"),
  rosterPhoto: text("rosterPhoto"),
  rosterImageUrl: text("rosterImageUrl"),
  isVerified: boolean("isVerified").default(false).notNull(),
  // Banner upload permission — granted by super admin to content creators, team captains, businesses
  canUploadBanner: boolean("canUploadBanner").default(false).notNull(),
  // Riot Games account linking
  riotPuuid: varchar("riotPuuid", { length: 78 }),
  riotGameName: varchar("riotGameName", { length: 64 }),
  riotTagLine: varchar("riotTagLine", { length: 16 }),
  riotRegion: varchar("riotRegion", { length: 8 }), // la1, la2, na1, euw1, etc.
  riotSummonerId: varchar("riotSummonerId", { length: 128 }),
  riotIconId: int("riotIconId"),
  // RLC Coins wallet
  rlcBalance: int("rlcBalance").default(500).notNull(), // start with 500 coins
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  tag: varchar("tag", { length: 8 }), // short team tag e.g. "RDG"
  logo: text("logo"),
  banner: text("banner"),
  captainId: int("captainId").notNull(),
  description: text("description"),
  game: varchar("game", { length: 64 }),
  // Fase 1 migración: slug canónico del juego
  gameSlug: varchar("gameSlug", { length: 128 }),
  country: varchar("country", { length: 64 }),
  points: int("points").default(0).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  tournamentsPlayed: int("tournamentsPlayed").default(0).notNull(),
  tournamentsWon: int("tournamentsWon").default(0).notNull(),
  socialDiscord: varchar("socialDiscord", { length: 128 }),
  socialTwitch: varchar("socialTwitch", { length: 128 }),
  socialTwitter: varchar("socialTwitter", { length: 128 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ─── Team Members ─────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["captain", "player", "substitute", "coach"]).default("player").notNull(),
  gameId: varchar("gameId", { length: 128 }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Team Achievements ────────────────────────────────────────────────────────
export const teamAchievements = mysqlTable("team_achievements", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  tournamentId: int("tournamentId"), // optional FK
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
});

export type TeamAchievement = typeof teamAchievements.$inferSelect;

// ─── Tournaments ──────────────────────────────────────────────────────────────
export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  game: varchar("game", { length: 64 }).notNull(),
  // Fase 1 migración: slug canónico del juego (relación débil, sin FK por ahora)
  // Se considera inmutable si existen torneos asociados.
  gameSlug: varchar("gameSlug", { length: 128 }),
  description: text("description"),
  rules: text("rules"),
  bracketType: mysqlEnum("bracketType", [
    "single_elimination",
    "double_elimination",
    "groups",
    "swiss",
    "round_robin",
  ]).notNull(),
  registrationType: mysqlEnum("registrationType", ["team", "player", "both"]).default("team").notNull(),
  maxTeams: int("maxTeams").default(16).notNull(),
  minPlayersPerTeam: int("minPlayersPerTeam").default(1).notNull(),
  maxPlayersPerTeam: int("maxPlayersPerTeam").default(5).notNull(),
  prizeDescription: text("prizeDescription"),
  prizeFirst: varchar("prizeFirst", { length: 256 }),
  prizeSecond: varchar("prizeSecond", { length: 256 }),
  prizeThird: varchar("prizeThird", { length: 256 }),
  prizeAmount: int("prizeAmount").default(0),
  registrationStart: timestamp("registrationStart"),
  registrationEnd: timestamp("registrationEnd"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", [
    "draft",
    "pending_approval",
    "registration_open",
    "registration_closed",
    "in_progress",
    "completed",
    "cancelled",
  ]).default("draft").notNull(),
  adminNote: text("adminNote"), // note from admin on approval/rejection
  creatorId: int("creatorId").notNull(),
  winnerId: int("winnerId"),
  banner: text("banner"),
  primaryColor: varchar("primaryColor", { length: 32 }).default("#ff0000"),
  secondaryColor: varchar("secondaryColor", { length: 32 }).default("#000000"),
  isPublic: boolean("isPublic").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  streamUrl: text("streamUrl"),
  streamPlatform: mysqlEnum("streamPlatform", ["twitch", "youtube", "discord", "other"]),
  // Formato de serie por defecto para todos los matches del torneo (BO1, BO2, BO3, BO5, BO7)
  defaultSeriesFormat: mysqlEnum("defaultSeriesFormat", ["BO1", "BO2", "BO3", "BO5", "BO7"]).default("BO1").notNull(),
  isLive: boolean("isLive").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  // ─── Campos nuevos (inspirados en Battlefy) ───────────────────────────────
  // Región del torneo (LAN, LAS, NA, BR, EUW, etc.)
  region: varchar("region", { length: 32 }),
  // Mapa del juego (Summoners Rift, ARAM, Howling Abyss, etc.)
  gameMap: varchar("gameMap", { length: 64 }),
  // Tipo de draft
  draftType: mysqlEnum("draftType", ["tournament_draft", "blind_pick", "all_random", "captains_draft"]).default("tournament_draft"),
  // Modo de juego específico (Valorant: standard, spike_rush; CS2: competitive, wingman; etc.)
  gameMode: varchar("gameMode", { length: 64 }),
  // Check-in: ventana de tiempo antes del torneo
  checkInStart: timestamp("checkInStart"),
  checkInEnd: timestamp("checkInEnd"),
  // Información de contacto del organizador (JSON: { name, discord, email, discordServer })
  contactInfo: text("contactInfo"),
  // Cronograma de rondas (JSON array: [{ round, date, time, description }])
  schedule: text("schedule"),
  // Si se requiere cuenta Riot vinculada para registrarse
  requireRiotAccount: boolean("requireRiotAccount").default(false).notNull(),
  // Máximo de agentes libres permitidos
  maxFreeAgents: int("maxFreeAgents").default(0).notNull(),
  // Código de invitación para torneos privados (isPublic=false)
  inviteCode: varchar("inviteCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;

// ─── Tournament Registrations ─────────────────────────────────────────────────
export const tournamentRegistrations = mysqlTable("tournament_registrations", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  teamId: int("teamId").notNull(),
  status: mysqlEnum("status", [
    "Pendiente",
    "Aprobado",
    "Rechazado",
    "Cancelado",
  ]).default("Pendiente").notNull(),
  creatorMessage: text("creatorMessage"),
  teamMessage: text("teamMessage"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;
export type InsertTournamentRegistration = typeof tournamentRegistrations.$inferInsert;

// ─── Registration Audit Log ───────────────────────────────────────────────────
export const registrationAuditLog = mysqlTable("registration_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  previousStatus: varchar("previousStatus", { length: 32 }),
  newStatus: varchar("newStatus", { length: 32 }).notNull(),
  changedById: int("changedById").notNull(),
  note: text("note"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type RegistrationAuditLog = typeof registrationAuditLog.$inferSelect;

// ─── Tournament Matches ───────────────────────────────────────────────────────
export const tournamentMatches = mysqlTable("tournament_matches", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  round: int("round").notNull(),
  matchNumber: int("matchNumber").notNull(),
  team1Id: int("team1Id"),
  team2Id: int("team2Id"),
  winnerId: int("winnerId"),
  team1Score: int("team1Score"),
  team2Score: int("team2Score"),
  // Ciclo de vida del match:
  //   pending       → creado, sin programar
  //   betting_open  → apuestas abiertas (scheduledAt - 60 min)
  //   locked        → apuestas cerradas (scheduledAt - 5 min)
  //   in_progress   → match en curso
  //   completed     → match finalizado
  status: mysqlEnum("status", ["pending", "betting_open", "locked", "in_progress", "completed"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  betsOpenAt: timestamp("betsOpenAt"),   // scheduledAt - 60 min (calculado al programar)
  betsCloseAt: timestamp("betsCloseAt"), // scheduledAt - 5 min
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  bracketPosition: json("bracketPosition"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = typeof tournamentMatches.$inferInsert;

// ─── News ─────────────────────────────────────────────────────────────────────
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  category: mysqlEnum("category", ["torneos", "equipos", "juegos", "plataforma", "general"]).default("general").notNull(),
  authorId: int("authorId").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  referenceUrl: text("referenceUrl"),
  gallery: text("gallery"), // JSON array of up to 4 image URLs
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// ─── RLC Coins Transactions ───────────────────────────────────────────────────
export const rlcTransactions = mysqlTable("rlc_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "bet_placed", "bet_won", "bet_lost", "reward", "refund"]).notNull(),
  amount: int("amount").notNull(), // positive = credit, negative = debit
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 256 }),
  referenceId: int("referenceId"), // bet id or tournament id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("rlc_tx_userId_idx").on(t.userId)]);

export type RlcTransaction = typeof rlcTransactions.$inferSelect;

// ─── Bets ─────────────────────────────────────────────────────────────────────
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tournamentId: int("tournamentId").notNull(),
  matchId: int("matchId"), // null = apuesta por torneo completo, set = apuesta por partido
  teamId: int("teamId").notNull(), // team bet on
  amount: int("amount").notNull(), // RLC coins wagered
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(), // e.g. 1.50
  potentialWin: int("potentialWin").notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost", "cancelled", "refunded"]).default("pending").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

// ─── Promotions ───────────────────────────────────────────────────────────────
export const promotions = mysqlTable("promotions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  bannerImage: text("bannerImage"),
  linkUrl: text("linkUrl"),
  linkLabel: varchar("linkLabel", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Promotion = typeof promotions.$inferSelect;

// ─── Games ────────────────────────────────────────────────────────────────────
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logo: text("logo"),
  banner: text("banner"),
  genre: varchar("genre", { length: 64 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  tournamentCount: int("tournamentCount").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/// ─── Streams ──────────────────────────────────────────────────────────────────
export const streams = mysqlTable("streams", {
  id: int("id").autoincrement().primaryKey(),
  // Owner: null for legacy/admin-created streams, userId for creator streams
  userId: int("userId"),
  // Type: "tournament" for tournament broadcasts, "creator" for creator streams
  type: mysqlEnum("type", ["tournament", "creator"]).default("creator").notNull(),
  tournamentId: int("tournamentId"),
  title: varchar("title", { length: 256 }).notNull(),
  streamerName: varchar("streamerName", { length: 128 }),
  platform: mysqlEnum("platform", ["twitch", "youtube", "discord", "other"]).notNull().default("twitch"),
  url: text("url").notNull(),
  embedUrl: text("embedUrl"),
  // gameSlug: canonical slug from games table (preferred)
  gameSlug: varchar("gameSlug", { length: 128 }),
  // game: display name (kept for backwards compat + fallback when slug unknown)
  game: varchar("game", { length: 64 }),
  isLive: boolean("isLive").default(false).notNull(),
  viewerCount: int("viewerCount").default(0),
  thumbnailUrl: text("thumbnailUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("streams_isLive_idx").on(t.isLive), index("streams_userId_idx").on(t.userId)]);
export type Stream = typeof streams.$inferSelect;
export type InsertStream = typeof streams.$inferInsert;

// ─── Shop Items (Physical & Digital Products) ─────────────────────────────────
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  image: text("image"),
  price: int("price").notNull(), // in RLC Coins
  originalPrice: int("originalPrice"), // for showing discount
  category: mysqlEnum("category", ["physical", "digital", "bundle", "limited"]).default("digital").notNull(),
  stock: int("stock").default(-1).notNull(), // -1 = unlimited
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isLimited: boolean("isLimited").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  maxPerUser: int("maxPerUser"), // null = unlimited; 1 = one per user, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

// ─── Shop Orders ──────────────────────────────────────────────────────────────
export const shopOrders = mysqlTable("shop_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  totalPrice: int("totalPrice").notNull(), // RLC Coins spent
  status: mysqlEnum("status", ["pending", "processing", "delivered", "cancelled"]).default("pending").notNull(),
  deliveryNote: text("deliveryNote"), // admin note when delivering (also used for digital codes)
  trackingNumber: varchar("trackingNumber", { length: 128 }), // número de guía de envío para productos físicos
  shippingCarrier: varchar("shippingCarrier", { length: 64 }), // empresa de transporte (DHL, FedEx, Correos, etc.)
  userNote: text("userNote"), // buyer's note/instructions
  shippingAddress: text("shippingAddress"), // JSON: { fullName, address, city, state, country, postalCode, contact }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopOrder = typeof shopOrders.$inferSelect;
export type InsertShopOrder = typeof shopOrders.$inferInsert;

// ─── Cosmetics (Profile Frames / Auras) ──────────────────────────────────────
export const cosmetics = mysqlTable("cosmetics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["frame", "aura", "badge", "background", "decoration", "effect"]).default("frame").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary", "mythic"]).default("common").notNull(),
  animationType: mysqlEnum("animationType", ["none", "gif", "webp", "webm", "lottie"]).default("none").notNull(),
  animationUrl: text("animationUrl"),  // URL del asset animado (webm/gif/lottie JSON)
  previewImage: text("previewImage"), // full preview card image (PNG estático)
  frameImage: text("frameImage"),     // transparent PNG overlay (capa sobre el avatar)
  colors: json("colors"),             // array of hex colors for swatches
  price: int("price").notNull(),      // RLC Coins
  originalPrice: int("originalPrice"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isLimited: boolean("isLimited").default(false).notNull(),
  maxSupply: int("maxSupply"),                          // null = ilimitado
  currentSupply: int("currentSupply").default(0).notNull(), // unidades vendidas
  dropStart: timestamp("dropStart"),                    // inicio del drop
  dropEnd: timestamp("dropEnd"),                        // fin del drop
  collection: varchar("collection", { length: 128 }), // e.g. "Neon Series", "Red Level Pack"
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Cosmetic = typeof cosmetics.$inferSelect;
export type InsertCosmetic = typeof cosmetics.$inferInsert;

// ─── User Cosmetics (Owned & Equipped) ────────────────────────────────────────
export const userCosmetics = mysqlTable("user_cosmetics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cosmeticId: int("cosmeticId").notNull(),
  isEquipped: boolean("isEquipped").default(false).notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type UserCosmetic = typeof userCosmetics.$inferSelect;

// ─── Reward Tasks ─────────────────────────────────────────────────────────────
export const rewardTasks = mysqlTable("reward_tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["video", "ad", "daily_login", "share", "follow"]).default("video").notNull(),
  reward: int("reward").notNull(), // RLC Coins earned
  contentUrl: text("contentUrl"),  // video/ad URL
  thumbnailUrl: text("thumbnailUrl"), // thumbnail image for the quest card
  sponsorName: varchar("sponsorName", { length: 128 }), // sponsor/brand name
  sponsorLogoUrl: text("sponsorLogoUrl"), // sponsor logo image
  expiresAt: timestamp("expiresAt"), // optional expiry date
  durationSeconds: int("durationSeconds").default(30), // watch time required
  maxClaimsPerUser: int("maxClaimsPerUser").default(1), // -1 = unlimited
  maxClaimsPerDay: int("maxClaimsPerDay").default(1),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RewardTask = typeof rewardTasks.$inferSelect;
export type InsertRewardTask = typeof rewardTasks.$inferInsert;

// ─── User Reward Claims ───────────────────────────────────────────────────────
export const userRewardClaims = mysqlTable("user_reward_claims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId").notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
});

export type UserRewardClaim = typeof userRewardClaims.$inferSelect;

// ─── Brand Ads ────────────────────────────────────────────────────────────────
export const brandAds = mysqlTable("brand_ads", {
  id: int("id").autoincrement().primaryKey(),
  brandName: varchar("brandName", { length: 128 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 256 }),
  description: text("description"),
  bannerImage: text("bannerImage").notNull(), // main large banner
  mobileImage: text("mobileImage"),             // optional mobile-specific banner
  logoImage: text("logoImage"),
  accentColor: varchar("accentColor", { length: 32 }).default("#ff0000"),
  destinationUrl: text("destinationUrl"),
  ctaLabel: varchar("ctaLabel", { length: 64 }).default("Ver más"),
  // adType: featured = hero carousel, card = small grid card, wide = wide horizontal card
  adType: mysqlEnum("adType", ["featured", "card", "wide"]).default("card").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(), // hero slot
  isPremium: boolean("isPremium").default(false).notNull(),   // premium placement
  clickCount: int("clickCount").default(0).notNull(),
  impressionCount: int("impressionCount").default(0).notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandAd = typeof brandAds.$inferSelect;
export type InsertBrandAd = typeof brandAds.$inferInsert;

// ─── User Follows ─────────────────────────────────────────────────────────────
export const userFollows = mysqlTable("user_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),   // the user who follows
  followingId: int("followingId").notNull(), // the user being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

// ─── Content Creators ─────────────────────────────────────────────────────────
export const contentCreators = mysqlTable("content_creators", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending | approved | rejected
  category: varchar("category", { length: 64 }), // gaming, esports, entertainment, education
  bio: text("bio"),
  youtube: varchar("youtube", { length: 256 }),
  youtubeChannelId: varchar("youtubeChannelId", { length: 64 }), // UC... resolved once, used for embed
  twitch: varchar("twitch", { length: 256 }),
  twitter: varchar("twitter", { length: 256 }),
  instagram: varchar("instagram", { length: 256 }),
  tiktok: varchar("tiktok", { length: 256 }),
  facebook: varchar("facebook", { length: 256 }),
  kick: varchar("kick", { length: 256 }),
  subscribers: int("subscribers").default(0),
  adminNote: text("adminNote"), // reason for rejection
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContentCreator = typeof contentCreators.$inferSelect;
export type InsertContentCreator = typeof contentCreators.$inferInsert;


// ─── Verification Requests ────────────────────────────────────────────────────
export const verificationRequests = mysqlTable("verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // one active request per user
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending | approved | rejected
  // Tipo de verificación solicitada
  verificationType: mysqlEnum("verificationType", ["streamer", "pro_player", "team", "organization", "content_creator", "other"]).default("other").notNull(),
  reason: text("reason"), // user's reason for requesting verification
  // Links de redes sociales / evidencia
  socialLinks: text("socialLinks"), // JSON: { twitch, youtube, twitter, instagram, tiktok }
  // Métricas declaradas por el usuario
  followersCount: int("followersCount"), // seguidores declarados
  adminNote: text("adminNote"), // admin's note when reviewing
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // admin userId
});
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;

// ─── Section Banners ─────────────────────────────────────────────────────────
// Stores customizable banner/header images for each section of the site
export const sectionBanners = mysqlTable("section_banners", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 64 }).notNull().unique(), // e.g. "home", "news", "tournaments", "rewards", "creators", "games", "cosmetics"
  imageUrl: text("imageUrl"), // banner image URL (S3)
  mobileImageUrl: text("mobileImageUrl"), // optional mobile-specific banner
  title: varchar("title", { length: 256 }), // optional overlay title
  subtitle: varchar("subtitle", { length: 512 }), // optional overlay subtitle
  linkUrl: text("linkUrl"), // optional click-through URL
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SectionBanner = typeof sectionBanners.$inferSelect;
export type InsertSectionBanner = typeof sectionBanners.$inferInsert;

// ─── User Notifications ───────────────────────────────────────────────────────
// In-app notifications for users (event-driven)
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "bracket_ready",
    "mission_approved",
    "mission_rejected",
    "order_confirmed",
    "order_processing",
    "order_shipped",
    "order_delivered",
    "order_cancelled",
    "team_invite",
    "team_invite_accepted",
    "team_invite_rejected",
    "creator_verified",
    "creator_rejected",
    "verification_approved",
    "verification_rejected",
    "verification_pending_admin",
    "tournament_full",
    "match_scheduled",
    "match_result",
    "coins_earned",
    "coins_spent",
    "news_published",
    "general",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  link: text("link"),         // optional deep link
  isRead: boolean("isRead").default(false).notNull(),
  referenceId: int("referenceId"), // tournamentId, missionId, orderId, etc.
  referenceType: varchar("referenceType", { length: 64 }), // "tournament" | "mission" | "order" etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("notif_userId_idx").on(t.userId), index("notif_userId_isRead_idx").on(t.userId, t.isRead)]);
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Cart ──────────────────────────────────────────────────────────────────
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Wishlist ──────────────────────────────────────────────────────────────
export const wishlistItems = mysqlTable("wishlist_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;

// ─── Allies (Sponsor Store Directory) ────────────────────────────────────────
export const allies = mysqlTable("allies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  coverImage: text("coverImage"),
  website: text("website"),
  country: varchar("country", { length: 128 }),
  city: varchar("city", { length: 128 }),
  address: text("address"),
  email: varchar("email", { length: 256 }),
  phone: varchar("phone", { length: 64 }),
  instagram: varchar("instagram", { length: 128 }),
  twitter: varchar("twitter", { length: 128 }),
  facebook: varchar("facebook", { length: 128 }),
  tiktok: varchar("tiktok", { length: 128 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  submittedBy: int("submittedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Ally = typeof allies.$inferSelect;
export type InsertAlly = typeof allies.$inferInsert;

// ─── Match Series (BOx Format) ────────────────────────────────────────────────
// Extiende tournament_matches con soporte para series BO1/BO2/BO3/BO5/BO7.
// Cada tournamentMatch puede tener UNA serie asociada (1:1).
export const matchSeries = mysqlTable("match_series", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull().unique(), // FK → tournament_matches.id
  tournamentId: int("tournamentId").notNull(),
  format: mysqlEnum("format", ["BO1", "BO2", "BO3", "BO5", "BO7"]).default("BO1").notNull(),
  // Victorias acumuladas por cada equipo en la serie
  winsTeam1: int("winsTeam1").default(0).notNull(),
  winsTeam2: int("winsTeam2").default(0).notNull(),
  // Mapas ganados/perdidos para estadísticas de desempate en ranking
  mapsWonTeam1: int("mapsWonTeam1").default(0).notNull(),
  mapsWonTeam2: int("mapsWonTeam2").default(0).notNull(),
  // Equipo ganador de la serie (se rellena al completarse)
  seriesWinnerId: int("seriesWinnerId"),
  // Estado de la serie
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  // Ventana de apuestas: abre 60 min antes del mapa 1, cierra 5 min antes
  betsOpenAt: timestamp("betsOpenAt"),
  betsCloseAt: timestamp("betsCloseAt"),
  // Escrow: total de RLC en custodia hasta resolver la serie
  escrowAmount: int("escrowAmount").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MatchSeries = typeof matchSeries.$inferSelect;
export type InsertMatchSeries = typeof matchSeries.$inferInsert;

// ─── Series Maps (Sub-Matches / Mapas individuales) ───────────────────────────
// Cada fila representa un mapa/juego individual dentro de una serie.
// mapNumber = 1, 2, 3... hasta el máximo del formato (2, 3, 5, 7).
export const seriesMaps = mysqlTable("series_maps", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),   // FK → match_series.id
  matchId: int("matchId").notNull(),     // FK → tournament_matches.id (para joins rápidos)
  mapNumber: int("mapNumber").notNull(), // 1-indexed
  mapName: varchar("mapName", { length: 128 }), // nombre del mapa/escenario (opcional)
  // Resultado del mapa
  scoreTeam1: int("scoreTeam1"),
  scoreTeam2: int("scoreTeam2"),
  winnerId: int("winnerId"), // teamId ganador de este mapa
  // Estado del mapa
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  // Mapa cancelado: ej. mapa 3 de BO3 si alguien ya ganó 2-0
  isCancelled: boolean("isCancelled").default(false).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SeriesMap = typeof seriesMaps.$inferSelect;
export type InsertSeriesMap = typeof seriesMaps.$inferInsert;



// ─── Tournament Rankings ──────────────────────────────────────────────────────
// Tabla de clasificación por torneo. Se actualiza automáticamente al finalizar
// cada serie. Permite ordenar equipos por puntos y usar el diferencial de mapas
// como criterio de desempate.
//
// Criterios de ordenación (en orden de prioridad):
//   1. points (desc)
//   2. seriesWon (desc)
//   3. mapDiff = mapsWon - mapsLost (desc)
//   4. mapsWon (desc)
export const tournamentRankings = mysqlTable("tournament_rankings", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  teamId: int("teamId").notNull(),
  // Puntos acumulados en el torneo
  //   Victoria de serie  → +3 pts
  //   Empate (BO2 1-1)   → +1 pt
  //   Derrota de serie   → +0 pts
  points: int("points").default(0).notNull(),
  // Contadores de series
  seriesPlayed: int("seriesPlayed").default(0).notNull(),
  seriesWon: int("seriesWon").default(0).notNull(),
  seriesDrawn: int("seriesDrawn").default(0).notNull(),
  seriesLost: int("seriesLost").default(0).notNull(),
  // Contadores de mapas individuales (para desempate)
  mapsWon: int("mapsWon").default(0).notNull(),
  mapsLost: int("mapsLost").default(0).notNull(),
  // mapDiff = mapsWon - mapsLost (columna calculada, se actualiza en cada serie)
  mapDiff: int("mapDiff").default(0).notNull(),
  // Posición actual en el ranking del torneo (recalculada tras cada serie)
  position: int("position").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TournamentRanking = typeof tournamentRankings.$inferSelect;
export type InsertTournamentRanking = typeof tournamentRankings.$inferInsert;

// ─── Commerce Core ────────────────────────────────────────────────────────────
// Capa superior de comercio que unifica transacciones, wallet RLC, catálogo y
// colecciones. No reemplaza shop.* ni cosmetics.* — los extiende.

/**
 * transactions — Registro global de todas las operaciones económicas.
 *
 * Complementa a rlcTransactions (que cubre RLC de apuestas/rewards).
 * Esta tabla cubre compras físicas, cosméticos, regalos y recompensas
 * en ambas monedas (RLC y USD).
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "physical_purchase",
    "cosmetic_purchase",
    "reward",
    "gift",
    "refund",
    "deposit",
  ]).notNull(),
  amount: int("amount").notNull(), // positivo = crédito, negativo = débito
  currency: mysqlEnum("currency", ["RLC", "USD"]).notNull().default("RLC"),
  referenceId: int("referenceId"), // id del shopItem, cosmetic u order
  referenceType: mysqlEnum("referenceType", [
    "shop_item",
    "cosmetic",
    "order",
    "bet",
    "reward",
  ]),
  description: varchar("description", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * wallets — Balance RLC normalizado por usuario.
 *
 * El balance real sigue en users.rlcBalance para compatibilidad.
 * Esta tabla provee una vista de wallet con timestamp de última actualización,
 * útil para el panel de Commerce Core y futuras funciones de wallet.
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceRlc: int("balanceRlc").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * collections — Colecciones temáticas de productos y cosméticos.
 *
 * Ejemplos: "Halloween Drop", "Cyberpunk Collection", "Winter Event".
 * Cada catalogItem puede pertenecer a una colección.
 * Las colecciones tienen fechas de inicio/fin para drops programados.
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  bannerImage: text("bannerImage"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * catalogItems — Vista unificada del catálogo de productos y cosméticos.
 *
 * Actúa como capa de presentación: no almacena datos del producto,
 * solo apunta a shopItems.id o cosmetics.id según el tipo.
 * Permite construir /store sin fusionar las tablas subyacentes.
 */
export const catalogItems = mysqlTable("catalog_items", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["physical", "cosmetic"]).notNull(),
  referenceId: int("referenceId").notNull(), // shopItems.id o cosmetics.id
  title: varchar("title", { length: 256 }).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  weeklyFeatured: boolean("weeklyFeatured").default(false).notNull(), // destacado semanal
  featuredPriority: int("featuredPriority").default(0).notNull(),    // orden en sección Featured
  visibleFrom: timestamp("visibleFrom"),   // activar automáticamente desde esta fecha
  visibleUntil: timestamp("visibleUntil"), // desactivar automáticamente en esta fecha
  publishDate: timestamp("publishDate"),   // fecha de publicación programada
  collectionId: int("collectionId"), // → collections.id
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CatalogItem = typeof catalogItems.$inferSelect;
export type InsertCatalogItem = typeof catalogItems.$inferInsert;

/**
 * drops — Eventos de lanzamiento programados ("drops").
 *
 * Un drop puede agrupar cosméticos y productos físicos bajo un evento
 * con fecha de inicio y fin. Ejemplos: "Friday Neon Drop", "Halloween Event".
 */
export const drops = mysqlTable("drops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  bannerImage: text("bannerImage"),
  collectionId: int("collectionId"),   // → collections.id (opcional)
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Drop = typeof drops.$inferSelect;
export type InsertDrop = typeof drops.$inferInsert;

// ─── Missions (Discord Quests-style) ─────────────────────────────────────────
/**
 * missions — Misiones patrocinadas con video.
 * Los usuarios ven un video durante un tiempo requerido y reciben RLC.
 */
export const missions = mysqlTable("missions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  bannerUrl: text("bannerUrl"),
  videoUrl: text("videoUrl").notNull(),
  sponsorName: varchar("sponsorName", { length: 128 }),
  sponsorLogo: text("sponsorLogo"),
  rewardRlc: int("rewardRlc").notNull().default(0),
  requiredWatchSeconds: int("requiredWatchSeconds").notNull().default(30),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

/**
 * userMissions — Progreso de cada usuario en cada misión.
 * Unique(userId, missionId) — una entrada por usuario por misión.
 */
export const userMissions = mysqlTable("userMissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  missionId: int("missionId").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  watchedSeconds: int("watchedSeconds").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserMission = typeof userMissions.$inferSelect;
export type InsertUserMission = typeof userMissions.$inferInsert;

/**
 * missionClaims — Registro de recompensas reclamadas.
 */
export const missionClaims = mysqlTable("missionClaims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  missionId: int("missionId").notNull(),
  rewardRlc: int("rewardRlc").notNull(),
  claimedAt: timestamp("claimedAt").defaultNow().notNull(),
});
export type MissionClaim = typeof missionClaims.$inferSelect;
export type InsertMissionClaim = typeof missionClaims.$inferInsert;

// ─── Creator Missions System ──────────────────────────────────────────────────
export const creatorMissions = mysqlTable("creator_missions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  resourcesUrl: text("resourcesUrl"),
  platforms: varchar("platforms", { length: 512 }),
  rewardRlc: int("rewardRlc").notNull().default(100),
  bonusRlc: int("bonusRlc").notNull().default(50),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").notNull().default(true),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreatorMission = typeof creatorMissions.$inferSelect;
export type InsertCreatorMission = typeof creatorMissions.$inferInsert;

export const creatorMissionAccepts = mysqlTable("creator_mission_accepts", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("missionId").notNull(),
  userId: int("userId").notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});
export type CreatorMissionAccept = typeof creatorMissionAccepts.$inferSelect;

export const creatorMissionSubmissions = mysqlTable("creator_mission_submissions", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("missionId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status_cms", ["pending", "approved", "rejected"]).notNull().default("pending"),
  adminNote: text("adminNote"),
  rewardPaid: boolean("rewardPaid").notNull().default(false),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
});
export type CreatorMissionSubmission = typeof creatorMissionSubmissions.$inferSelect;

export const creatorMissionLinks = mysqlTable("creator_mission_links", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  url: text("url").notNull(),
  platform: varchar("platform", { length: 64 }),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});
export type CreatorMissionLink = typeof creatorMissionLinks.$inferSelect;

// ─── Stream Chat Messages ─────────────────────────────────────────────────────
export const streamChatMessages = mysqlTable("stream_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  streamId: int("streamId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 128 }).notNull(),
  userAvatar: text("userAvatar"),
  userRole: varchar("userRole", { length: 32 }).default("user"),
  userNickname: varchar("userNickname", { length: 64 }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [index("scm_stream_idx").on(t.streamId)]);
export type StreamChatMessage = typeof streamChatMessages.$inferSelect;
export type InsertStreamChatMessage = typeof streamChatMessages.$inferInsert;

// ─── Tournament Checkins ──────────────────────────────────────────────────────────────────────────────
// Registra qué equipos hicieron check-in antes del inicio del torneo
export const tournamentCheckins = mysqlTable("tournament_checkins", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  teamId: int("teamId").notNull(),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
  checkedInBy: int("checkedInBy").notNull(), // userId del capitán o admin
}, (t) => [
  index("tc_tournament_idx").on(t.tournamentId),
  index("tc_team_idx").on(t.teamId),
]);
export type TournamentCheckin = typeof tournamentCheckins.$inferSelect;
export type InsertTournamentCheckin = typeof tournamentCheckins.$inferInsert;

// ─── Tournament Announcements ──────────────────────────────────────────────────────────────────────────────
// Anuncios del organizador y mensajes automáticos del sistema (como Battlebot en Battlefy)
export const tournamentAnnouncements = mysqlTable("tournament_announcements", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  authorId: int("authorId"),          // null = sistema automático
  authorName: varchar("authorName", { length: 128 }).default("Sistema"),
  message: text("message").notNull(),
  isSystem: boolean("isSystem").default(false).notNull(), // true = generado automáticamente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("ta_tournament_idx").on(t.tournamentId),
]);
export type TournamentAnnouncement = typeof tournamentAnnouncements.$inferSelect;
export type InsertTournamentAnnouncement = typeof tournamentAnnouncements.$inferInsert;

// ─── Tournament Free Agents ──────────────────────────────────────────────────────────────────────────────
// Jugadores que se inscriben individualmente (sin equipo) para ser reclutados
export const tournamentFreeAgents = mysqlTable("tournament_free_agents", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 32 }),     // "top", "jungle", "mid", "adc", "support"
  riotId: varchar("riotId", { length: 128 }), // gameName#tagLine
  message: text("message"),                   // mensaje del jugador
  status: mysqlEnum("status_fa", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("tfa_tournament_idx").on(t.tournamentId),
  index("tfa_user_idx").on(t.userId),
]);
export type TournamentFreeAgent = typeof tournamentFreeAgents.$inferSelect;
export type InsertTournamentFreeAgent = typeof tournamentFreeAgents.$inferInsert;

// ─── Match Chat ───────────────────────────────────────────────────────────────
export const matchChatMessages = mysqlTable("match_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 128 }).notNull(),
  userAvatar: text("userAvatar"),
  teamId: int("teamId"),
  message: text("message").notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("mcm_match_idx").on(t.matchId),
]);
export type MatchChatMessage = typeof matchChatMessages.$inferSelect;
export type InsertMatchChatMessage = typeof matchChatMessages.$inferInsert;

// ─── Match Disputes ───────────────────────────────────────────────────────────
export const matchDisputes = mysqlTable("match_disputes", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  tournamentId: int("tournamentId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  teamId: int("teamId").notNull(),
  reason: text("reason").notNull(),
  screenshotUrl: text("screenshotUrl"),
  status: mysqlEnum("status_md", ["open", "resolved", "dismissed"]).default("open").notNull(),
  resolvedBy: int("resolvedBy"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("md_match_idx").on(t.matchId),
  index("md_tournament_idx").on(t.tournamentId),
]);
export type MatchDispute = typeof matchDisputes.$inferSelect;
export type InsertMatchDispute = typeof matchDisputes.$inferInsert;

// ─── Match Result Confirmations ───────────────────────────────────────────────
export const matchResultConfirmations = mysqlTable("match_result_confirmations", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action_mrc", ["confirmed", "disputed"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("mrc_match_idx").on(t.matchId),
]);
export type MatchResultConfirmation = typeof matchResultConfirmations.$inferSelect;

// ─── Tournament Activity Log ──────────────────────────────────────────────────
export const tournamentActivityLog = mysqlTable("tournament_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  description: text("description").notNull(),
  userId: int("userId"),
  teamId: int("teamId"),
  matchId: int("matchId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("tal_tournament_idx").on(t.tournamentId),
]);
export type TournamentActivityLog = typeof tournamentActivityLog.$inferSelect;

// ─── Match Check-in ───────────────────────────────────────────────────────────
export const matchCheckins = mysqlTable("match_checkins", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  checkedInAt: timestamp("checkedInAt").defaultNow().notNull(),
}, (t) => [
  index("mci_match_idx").on(t.matchId),
]);
export type MatchCheckin = typeof matchCheckins.$inferSelect;

// ─── Role Requests ────────────────────────────────────────────────────────────
export const roleRequests = mysqlTable("role_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requestedRole: mysqlEnum("requestedRole", ["to", "cdc", "partner"]).notNull(),
  orgName: varchar("orgName", { length: 128 }).notNull(),
  orgDescription: text("orgDescription"),
  experience: text("experience"),
  discordContact: varchar("discordContact", { length: 128 }),
  websiteUrl: varchar("websiteUrl", { length: 256 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("rr_user_idx").on(t.userId),
]);
export type RoleRequest = typeof roleRequests.$inferSelect;
export type InsertRoleRequest = typeof roleRequests.$inferInsert;

// ─── Tournament Collaborators ─────────────────────────────────────────────────
export const tournamentCollaborators = mysqlTable("tournament_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  userId: int("userId").notNull(),
  addedBy: int("addedBy").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (t) => [
  index("tc_tournament_idx").on(t.tournamentId),
  index("tc_user_idx").on(t.userId),
]);
export type TournamentCollaborator = typeof tournamentCollaborators.$inferSelect;
export type InsertTournamentCollaborator = typeof tournamentCollaborators.$inferInsert;

// ─── Push Subscriptions (Web Push / VAPID) ────────────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 512 }).notNull(),
  p256dh: varchar("p256dh", { length: 256 }).notNull(),
  auth: varchar("auth", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("ps_user_idx").on(t.userId),
]);
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
