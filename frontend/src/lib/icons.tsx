/*
NextJS cannot import SVG files directly.
So the work around is to create an object with the paths to the icons, and import the icons from that object.
Is the a better solution? Maybe, but this works for now.
 */

export const ICONS = {
  FILE: '/illustrations/icons/file-icon.svg',
  PIE_CHART: '/illustrations/icons/pie-chart-icon.svg',
  USERS: '/illustrations/icons/users-icon.svg',
} as const;