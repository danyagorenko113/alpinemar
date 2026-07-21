/** IT service groups — mirrors the enum in it-site/src/content.config.ts. */
export const IT_SERVICE_GROUPS = ['Cybersecurity', 'Cloud & Infrastructure', 'Advisory', 'AI'] as const
export type ITServiceGroup = (typeof IT_SERVICE_GROUPS)[number]
