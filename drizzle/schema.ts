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
  role: mysqlEnum("role", ["user", "premium", "admin", "super_admin"]).default("user").notNull(),
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
  isLive: boolean("isLive").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
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
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  betsCloseAt: timestamp("betsCloseAt"),
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
});

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
});
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
  type: mysqlEnum("type", ["frame", "aura", "badge", "background"]).default("frame").notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  previewImage: text("previewImage"), // full preview card image
  frameImage: text("frameImage"),     // transparent PNG overlay
  colors: json("colors"),             // array of hex colors for swatches
  price: int("price").notNull(),      // RLC Coins
  originalPrice: int("originalPrice"),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isLimited: boolean("isLimited").default(false).notNull(),
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
  reason: text("reason"), // user's reason for requesting verification
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
    "team_invite",
    "team_invite_accepted",
    "team_invite_rejected",
    "creator_verified",
    "creator_rejected",
    "tournament_full",
    "match_scheduled",
    "match_result",
    "coins_earned",
    "coins_spent",
    "general",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  link: text("link"),         // optional deep link
  isRead: boolean("isRead").default(false).notNull(),
  referenceId: int("referenceId"), // tournamentId, missionId, orderId, etc.
  referenceType: varchar("referenceType", { length: 64 }), // "tournament" | "mission" | "order" etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
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
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  submittedBy: int("submittedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Ally = typeof allies.$inferSelect;
export type InsertAlly = typeof allies.$inferInsert;
