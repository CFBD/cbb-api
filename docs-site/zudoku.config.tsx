import type { ZudokuConfig } from 'zudoku';

import { generateCodeSnippet } from './sdk-snippets';
import './styles.css';

const config: ZudokuConfig = {
  site: {
    title: 'College Basketball Data API',
    logo: {
      src: {
        light: '/brand/cbbd-watermark.png',
        dark: '/brand/cbbd-watermark-dark.png',
      },
      alt: 'College Basketball Data',
      width: 'auto',
      href: '/',
      reloadDocument: false,
    },
    footer: {
      position: 'center',
      columns: [
        {
          title: 'Helpful links',
          position: 'start',
          links: [
            { label: 'CBBD', href: 'https://collegebasketballdata.com' },
            {
              label: 'Get API key',
              href: 'https://collegebasketballdata.com/key',
            },
            {
              label: 'Access tiers',
              href: 'https://collegebasketballdata.com/api-tiers',
            },
          ],
        },
        {
          title: 'Official libraries',
          position: 'center',
          links: [
            { label: 'Python', href: 'https://pypi.org/project/cbbd/' },
            {
              label: 'TypeScript',
              href: 'https://www.npmjs.com/package/cbbd',
            },
            { label: 'R', href: 'https://github.com/CFBD/cbbd-r' },
            { label: 'API source', href: 'https://github.com/CFBD/cbb-api' },
          ],
        },
        {
          title: 'Other resources',
          position: 'end',
          links: [
            {
              label: 'Rad Sports Analytics',
              href: 'https://radsportsanalytics.com',
            },
            {
              label: 'Football',
              href: 'https://collegefootballdata.com',
            },
            {
              label: 'CBB Starter Pack',
              href: 'https://collegefootballdata.gumroad.com/l/cbb-starter-pack',
            },
          ],
        },
      ],
      social: [
        { icon: 'x', href: 'https://x.com/CFB_Data' },
        { icon: 'discord', href: 'https://discord.gg/Eb3ex5a' },
        { icon: 'github', href: 'https://github.com/CFBD' },
      ],
      copyright: 'A Rad Sports Analytics platform.',
    },
  },
  metadata: {
    title: '%s | College Basketball Data API',
    defaultTitle: 'College Basketball Data API documentation',
    description:
      'Documentation and API reference for the College Basketball Data API.',
    favicon: '/favicon.ico',
    applicationName: 'College Basketball Data API documentation',
  },
  header: {
    navigation: [
      {
        label: 'CollegeBasketballData.com',
        to: 'https://collegebasketballdata.com/',
        target: '_blank',
      },
      {
        label: 'Get API Key',
        to: 'https://collegebasketballdata.com/key',
        target: '_blank',
      },
      {
        label: 'Legacy Swagger UI',
        to: 'https://api.collegebasketballdata.com/swagger',
        target: '_blank',
      },
    ],
    themeSwitcher: {
      enabled: true,
    },
  },
  navigation: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsible: false,
      items: [
        {
          type: 'doc',
          file: 'getting-started',
          label: 'Overview and first request',
        },
        {
          type: 'doc',
          file: 'authentication',
          label: 'Authentication',
        },
        {
          type: 'doc',
          file: 'usage-and-access',
          label: 'Usage and access',
        },
      ],
    },
    {
      type: 'category',
      label: 'Official libraries',
      collapsible: false,
      items: [
        {
          type: 'doc',
          file: 'libraries/python',
          label: 'Python quickstart',
        },
        {
          type: 'doc',
          file: 'libraries/typescript',
          label: 'TypeScript quickstart',
        },
        {
          type: 'doc',
          file: 'libraries/r',
          label: 'R quickstart',
        },
      ],
    },
    {
      type: 'link',
      label: 'API Reference',
      to: '/api',
    },
  ],
  redirects: [{ from: '/', to: '/getting-started' }],
  docs: {
    files: ['/pages/**/*.{md,mdx}'],
    publishMarkdown: true,
    defaultOptions: {
      copyPage: true,
      showLastModified: true,
      suggestEdit: {
        url: 'https://github.com/CFBD/cbb-api/edit/main/docs-site/pages',
        text: 'Edit this page on GitHub',
      },
    },
    llms: {
      llmsTxt: true,
    },
  },
  apis: [
    {
      type: 'file',
      input: '../build/swagger.json',
      path: '/api',
      options: {
        disablePlayground: false,
        disableSecurity: false,
        examplesLanguage: 'shell',
        supportedLanguages: [
          { value: 'shell', label: 'cURL' },
          { value: 'python', label: 'Python SDK' },
          { value: 'typescript', label: 'TypeScript SDK' },
        ],
        generateCodeSnippet,
        schemaDownload: {
          enabled: true,
          fileName: 'cbbd-openapi',
        },
        showInfoPage: true,
        showVersionSelect: 'if-available',
      },
    },
  ],
  search: {
    type: 'pagefind',
    maxSubResults: 3,
  },
  syntaxHighlighting: {
    languages: ['bash', 'http', 'python', 'r', 'typescript'],
  },
  aiAssistants: ['claude', 'chatgpt'],
  theme: {
    fonts: {
      sans: 'Inter',
      mono: 'JetBrains Mono',
    },
    light: {
      background: '#F7F9FC',
      foreground: '#182430',
      card: '#FDFDFD',
      cardForeground: '#182430',
      popover: '#FDFDFD',
      popoverForeground: '#182430',
      primary: '#C73F00',
      primaryForeground: '#FFFFFF',
      secondary: '#ECEEF2',
      secondaryForeground: '#122446',
      muted: '#ECEEF2',
      mutedForeground: '#70747C',
      accent: '#FCE6D7',
      accentForeground: '#122446',
      destructive: '#C8312A',
      destructiveForeground: '#FFFFFF',
      border: '#D0D0D4',
      input: '#D0D0D4',
      ring: '#C73F00',
      radius: '0.5rem',
    },
    dark: {
      background: '#122446',
      foreground: '#FDFDFD',
      card: '#1D3155',
      cardForeground: '#FDFDFD',
      popover: '#1D3155',
      popoverForeground: '#FDFDFD',
      primary: '#F24F02',
      primaryForeground: '#122446',
      secondary: '#243140',
      secondaryForeground: '#FDFDFD',
      muted: '#243140',
      mutedForeground: '#A4ADBA',
      accent: '#243140',
      accentForeground: '#FDFDFD',
      destructive: '#C8312A',
      destructiveForeground: '#FFFFFF',
      border: '#3A4756',
      input: '#3A4756',
      ring: '#F24F02',
      radius: '0.5rem',
    },
  },
};

export default config;
