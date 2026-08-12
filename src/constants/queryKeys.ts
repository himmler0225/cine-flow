export const queryKeys = {
  movies: {
    new: (page: number) => ["movies", "new", page] as const,
    byType: (type: string, page: number) => ["movies", "type", type, page] as const,
    byTypeInfinite: (type: string) => ["movies", "type-inf", type] as const,
    detail: (slug: string) => ["movies", "detail", slug] as const,
    search: (keyword: string, page: number) => ["movies", "search", keyword, page] as const,
    searchInfinite: (keyword: string) => ["movies", "search-inf", keyword] as const,
    byGenre: (slug: string) => ["movies", "genre", slug] as const,
    byCountry: (slug: string) => ["movies", "country", slug] as const,
    byYear: (year: number) => ["movies", "year", year] as const,
    listPage: (slug: string, page: number, search: unknown) =>
      ["movies", "list-page", slug, page, search] as const,
  },
  genres: { all: () => ["genres"] as const },
  countries: { all: () => ["countries"] as const },
  comments: {
    byMovie: (slug: string, episodeName?: string | null) =>
      ["comments", slug, episodeName ?? "all"] as const,
  },
  ratings: {
    aggregate: (slug: string) => ["ratings", "aggregate", slug] as const,
    user: (userId: string, slug: string) => ["ratings", "user", userId, slug] as const,
  },
  favorites: {
    slugs: (userId: string) => ["favorites", "slugs", userId] as const,
    list: (userId: string) => ["favorites-list", userId] as const,
    count: (userId: string) => ["favorites-count", userId] as const,
  },
  watchHistory: {
    byUser: (userId: string) => ["watch_history", userId] as const,
    guest: () => ["watch_history", "guest"] as const,
  },
  watchParty: {
    room: (code: string) => ["watch-room", code] as const,
    members: (roomId: string) => ["room-members", roomId] as const,
    detail: (slug: string) => ["wp-detail", slug] as const,
  },
  admin: {
    all: () => ["admin"] as const,
    aiConfig: () => ["admin", "ai-config"] as const,
    stats: (dateRange: string) => ["admin", "stats", dateRange] as const,
    line: (dateRange: string) => ["admin", "line", dateRange] as const,
    pageType: (dateRange: string) => ["admin", "pagetype", dateRange] as const,
    topMovies: (dateRange: string) => ["admin", "top-movies", dateRange] as const,
    topKeywords: (dateRange: string) => ["admin", "top-keywords", dateRange] as const,
    recentUsers: () => ["admin", "recent-users"] as const,
    recentComments: () => ["admin", "recent-comments"] as const,
    commentStats: () => ["admin", "comment-stats"] as const,
    comments: (query: string, movie: string, sort: string, page: number) =>
      ["admin", "comments", query, movie, sort, page] as const,
    users: (query: string, sort: string, filter: string, page: number) =>
      ["admin", "users", query, sort, filter, page] as const,
    userHistory: (userId: string) => ["admin", "user-history", userId] as const,
    userFavorites: (userId: string) => ["admin", "user-favs", userId] as const,
    roomStats: () => ["admin", "room-stats"] as const,
    rooms: (showHistory: boolean) => ["admin", "rooms", showHistory] as const,
    roomCounts: (roomIdsKey: string) => ["admin", "rooms-counts", roomIdsKey] as const,
    roomMembers: (roomId: string) => ["admin", "room-members", roomId] as const,
    roomMessages: (roomId: string) => ["admin", "room-messages", roomId] as const,
    movies: (dateRange: string) => ["admin", "movies", dateRange] as const,
    movieDetail: (slug: string, dateRange: string) =>
      ["admin", "movie-detail", slug, dateRange] as const,
    analyticsSearch: (dateRange: string) => ["admin", "an-search", dateRange] as const,
    analyticsHourly: (dateRange: string) => ["admin", "an-hourly", dateRange] as const,
    analyticsRooms: (dateRange: string) => ["admin", "an-rooms", dateRange] as const,
    analyticsLangQuality: (dateRange: string) => ["admin", "an-lq", dateRange] as const,
  },
  episodeNotifications: (slugsKey: string) => ["episode-notifications", slugsKey] as const,
  chat: {
    conversations: (userId: string) => ["chat", "conversations", userId] as const,
  },
};
