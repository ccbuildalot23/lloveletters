/** Color tokens mirrored from global.css so tests and scripts can reason about them. */
export const colors = {
  ivory: '#F6F1E9',
  sand: '#E9DFCF',
  madder: '#9E2B25',
  madderDark: '#7C1F1B',
  indigo: '#23395B',
  indigoLight: '#3E5A86',
  saffron: '#D9A441',
  olive: '#6B7B4B',
  oliveDark: '#4F5C36',
  charcoal: '#2B2B2B',
  stone: '#6E6A64',
  stoneDark: '#5C5852',
  line: '#D8CFC0',
  error: '#B3261E',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Every foreground/background pair the UI uses for text, with the minimum
 * contrast it must meet. 'body' = 4.5:1, 'large' = 3:1 (large text / UI components).
 */
export const textPairs: Array<{
  fg: ColorName;
  bg: ColorName;
  level: 'body' | 'large';
  where: string;
}> = [
  { fg: 'charcoal', bg: 'ivory', level: 'body', where: 'body text' },
  { fg: 'charcoal', bg: 'sand', level: 'body', where: 'body text on cards' },
  { fg: 'charcoal', bg: 'white', level: 'body', where: 'body text on white surfaces' },
  { fg: 'stone', bg: 'ivory', level: 'body', where: 'secondary text' },
  { fg: 'stoneDark', bg: 'sand', level: 'body', where: 'secondary text on sand' },
  { fg: 'stone', bg: 'white', level: 'body', where: 'secondary text on white' },
  { fg: 'indigo', bg: 'ivory', level: 'body', where: 'headings, secondary buttons text' },
  { fg: 'indigo', bg: 'sand', level: 'body', where: 'headings on sand' },
  { fg: 'madder', bg: 'ivory', level: 'body', where: 'links' },
  { fg: 'madder', bg: 'sand', level: 'body', where: 'links on sand' },
  { fg: 'madder', bg: 'white', level: 'body', where: 'links on white' },
  { fg: 'madderDark', bg: 'ivory', level: 'body', where: 'link hover' },
  { fg: 'white', bg: 'madder', level: 'body', where: 'primary button' },
  { fg: 'white', bg: 'madderDark', level: 'body', where: 'primary button hover' },
  { fg: 'ivory', bg: 'indigo', level: 'body', where: 'footer, secondary button' },
  { fg: 'ivory', bg: 'indigoLight', level: 'body', where: 'secondary button hover' },
  { fg: 'oliveDark', bg: 'ivory', level: 'body', where: 'available status text' },
  { fg: 'olive', bg: 'ivory', level: 'large', where: 'available icon / large label' },
  { fg: 'white', bg: 'olive', level: 'body', where: 'available badge' },
  { fg: 'error', bg: 'ivory', level: 'body', where: 'form errors' },
  { fg: 'error', bg: 'white', level: 'body', where: 'form errors on white' },
  { fg: 'charcoal', bg: 'saffron', level: 'body', where: 'saffron badge text' },
  { fg: 'saffron', bg: 'indigo', level: 'large', where: 'saffron accent on footer' },
  { fg: 'white', bg: 'charcoal', level: 'body', where: 'sold badge' },
  { fg: 'indigo', bg: 'white', level: 'body', where: 'headings on white' },
];
