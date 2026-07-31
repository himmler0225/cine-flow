export const MOVIE_TYPES = {
  PHIM_BO: "phim-bo",
  PHIM_LE: "phim-le",
  TV_SHOWS: "tv-shows",
  HOAT_HINH: "hoat-hinh",
  PHIM_VIETSUB: "phim-vietsub",
  PHIM_THUYET_MINH: "phim-thuyet-minh",
  PHIM_LONG_TIENG: "phim-long-tieng",
} as const;

export const RELATED_TYPE_MAP: Record<string, string> = {
  single: MOVIE_TYPES.PHIM_LE,
  series: MOVIE_TYPES.PHIM_BO,
  hoathinh: MOVIE_TYPES.HOAT_HINH,
  tvshows: MOVIE_TYPES.TV_SHOWS,
};

export type HomeRowDef = {
  key: string;
  titleKey: string;
  type?: string;
};

export function getHomeRows(): HomeRowDef[] {
  return [
    { key: "new", titleKey: "home.rows.newUpdates" },
    { key: "phim-bo", titleKey: "movieLists.phim-bo", type: MOVIE_TYPES.PHIM_BO },
    { key: "phim-le", titleKey: "movieLists.phim-le", type: MOVIE_TYPES.PHIM_LE },
    { key: "tv-shows", titleKey: "movieLists.tv-shows", type: MOVIE_TYPES.TV_SHOWS },
    { key: "hoat-hinh", titleKey: "movieLists.hoat-hinh", type: MOVIE_TYPES.HOAT_HINH },
  ];
}
