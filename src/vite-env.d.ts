/// <reference types="vite-plugin-pwa/client" />

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
