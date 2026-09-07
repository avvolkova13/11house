/** Resolve a file from public/ correctly for both the local root and GitHub Pages. */
export const publicAsset = (path: string) => (
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
)
