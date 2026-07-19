export type PlayerUiState = {
  playing: boolean;
  muted: boolean;
  volume: number;
  progress: number;
  buffered: number;
  duration: number;
  speed: number;
  showSpeed: boolean;
  hasError: boolean;
  useEmbed: boolean;
  skipAds: boolean;
  adsSkipped: number;
};

export type PlayerUiAction =
  | { type: "reset"; useEmbed: boolean }
  | { type: "setPlaying"; playing: boolean }
  | { type: "setMuted"; muted: boolean }
  | { type: "setVolume"; volume: number }
  | { type: "setProgress"; progress: number }
  | { type: "setBuffered"; buffered: number }
  | { type: "setDuration"; duration: number }
  | { type: "setSpeed"; speed: number }
  | { type: "toggleShowSpeed" }
  | { type: "setShowSpeed"; showSpeed: boolean }
  | { type: "setHasError"; hasError: boolean }
  | { type: "setUseEmbed"; useEmbed: boolean }
  | { type: "setSkipAds"; skipAds: boolean }
  | { type: "incrementAdsSkipped"; count?: number };

export function createInitialPlayerUi(useEmbed: boolean, skipAds: boolean): PlayerUiState {
  return {
    playing: false,
    muted: false,
    volume: 1,
    progress: 0,
    buffered: 0,
    duration: 0,
    speed: 1,
    showSpeed: false,
    hasError: false,
    useEmbed,
    skipAds,
    adsSkipped: 0,
  };
}

export function playerUiReducer(state: PlayerUiState, action: PlayerUiAction): PlayerUiState {
  switch (action.type) {
    case "reset":
      return {
        ...state,
        hasError: false,
        useEmbed: action.useEmbed,
        progress: 0,
        buffered: 0,
        duration: 0,
        playing: false,
        adsSkipped: 0,
      };
    case "setPlaying":
      return { ...state, playing: action.playing };
    case "setMuted":
      return { ...state, muted: action.muted };
    case "setVolume":
      return { ...state, volume: action.volume };
    case "setProgress":
      return { ...state, progress: action.progress };
    case "setBuffered":
      return { ...state, buffered: action.buffered };
    case "setDuration":
      return { ...state, duration: action.duration };
    case "setSpeed":
      return { ...state, speed: action.speed };
    case "toggleShowSpeed":
      return { ...state, showSpeed: !state.showSpeed };
    case "setShowSpeed":
      return { ...state, showSpeed: action.showSpeed };
    case "setHasError":
      return { ...state, hasError: action.hasError };
    case "setUseEmbed":
      return { ...state, useEmbed: action.useEmbed };
    case "setSkipAds":
      return { ...state, skipAds: action.skipAds };
    case "incrementAdsSkipped":
      return {
        ...state,
        adsSkipped: state.adsSkipped + (action.count ?? 1),
      };
    default:
      return state;
  }
}
