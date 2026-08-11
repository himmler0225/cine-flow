const REDIRECTS: Array<[from: RegExp, to: (match: RegExpMatchArray) => string]> = [
  [/^\/phim\/(.+)$/, (m) => `/movie/${m[1]}`],
  [/^\/xem\/(.+)$/, (m) => `/watch/${m[1]}`],
  [/^\/danh-sach\/(.+)$/, (m) => `/catalog/${m[1]}`],
  [/^\/quoc-gia\/(.+)$/, (m) => `/country/${m[1]}`],
  [/^\/quoc-gia\/?$/, () => `/country`],
  [/^\/the-loai\/(.+)$/, (m) => `/genre/${m[1]}`],
  [/^\/the-loai\/?$/, () => `/genre`],
  [/^\/nam\/(\d{4})$/, (m) => `/year/${m[1]}`],
];

export function legacyRouteRedirect(request: Request): Response | null {
  const url = new URL(request.url);

  const { pathname, search } = url;

  for (const [pattern, buildTarget] of REDIRECTS) {
    const match = pathname.match(pattern);

    if (!match) continue;

    const target = buildTarget(match);

    return Response.redirect(`${target}${search}`, 301);
  }

  return null;
}
