export const TRAILING_SLASH_PATTERN = /\/+$/;

export const LEADING_SLASH_PATTERN = /^\/+/;

export const LEADING_HASH_PATTERN = /^#/;

export const JSON_CODE_BLOCK_OPEN_PATTERN = /```json\s*/gi;

export const CODE_BLOCK_FENCE_PATTERN = /```/g;

export const JSON_START_PATTERN = /[[{]/;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const HTML_TAG_PATTERN = /<[^>]*>/g;

export const HTML_NBSP_PATTERN = /&nbsp;/g;

export const WHITESPACE_PATTERN = /\s+/g;

export const HAS_WHITESPACE_PATTERN = /\s/;

export const COMBINING_MARK_PATTERN = /[\u0300-\u036f]/g;

export const LOWERCASE_D_STROKE_PATTERN = /đ/g;

export const UPPERCASE_D_STROKE_PATTERN = /Đ/g;

export const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i;

export const UPLOAD_PATH_PATTERN = /^uploads?\//i;

export const PLAYER_PATH_PATTERN = /\/player\//i;

export const EMBED_URL_QUERY_PATTERN = /[?&]url=https?:\/\//i;

export const HLS_EXTENSION_PATTERN = /\.m3u8(\?|$)/i;

export const EPISODE_NUMBER_PATTERN = /\d+/;

export const ROOM_CODE_INVALID_PATTERN = /[^A-Z0-9]/g;

export const COLON_PATTERN = /:/g;

export const YOUTUBE_URL_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/;

export const YOUTUBE_HOST_PATTERN = /(^|\.)youtube\.com$/;

export const YOUTU_BE_HOST_PATTERN = /(^|\.)youtu\.be$/;

export const VIMEO_HOST_PATTERN = /(^|\.)vimeo\.com$/;

export const YOUTUBE_ORIGIN_PATTERN = /^https?:\/\/(www\.)?youtube(-nocookie)?\.com$/;

export const VIMEO_ORIGIN_PATTERN = /^https?:\/\/player\.vimeo\.com$/;

export const HLS_AD_URL_PATTERN = /(\/ads?\/|\/advert|googlevideo|doubleclick|adserver|preroll)/i;
