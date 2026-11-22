/** The app version from package.json, injected by Vite. */
declare const __APP_VERSION__: string

/** Markdown imported as text (`import text from './file.md?raw'`). */
declare module '*.md?raw' {
  const text: string
  export default text
}

/** SVG imported as text (the Heroicons). */
declare module '*.svg?raw' {
  const text: string
  export default text
}
