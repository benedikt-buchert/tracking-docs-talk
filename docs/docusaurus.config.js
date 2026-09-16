// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

// Where the docs live. The event schemas' $id URLs point here,
// so every event carries a link to its own documentation.
const DOCS_URL = process.env.DOCS_URL || 'http://localhost:3000';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Brezn Bude Tracking Docs',
  tagline: 'Generated from JSON Schema. Cannot quietly go stale.',
  favicon: 'img/favicon.svg',
  url: DOCS_URL,
  baseUrl: '/',
  organizationName: 'benedikt-buchert',
  projectName: 'tracking-docs-talk',
  onBrokenLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {},
      }),
    ],
  ],
  plugins: ['docusaurus-plugin-generate-schema-docs'],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Brezn Bude 🥨 Tracking Docs',
        items: [
          {
            href: 'https://github.com/benedikt-buchert/tracking_docs',
            label: 'Powered by tracking_docs',
            position: 'right',
          },
        ],
      },
      prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
    }),
};

export default config;
