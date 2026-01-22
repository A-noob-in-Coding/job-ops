import * as settingsRepo from '@server/repositories/settings.js';
import { SettingKey } from '@server/repositories/settings.js';

const envDefaults: Record<string, string | undefined> = { ...process.env };

const readableStringConfig: { settingKey: SettingKey, envKey: string }[] = [
  { settingKey: 'rxresumeEmail', envKey: 'RXRESUME_EMAIL' },
  { settingKey: 'ukvisajobsEmail', envKey: 'UKVISAJOBS_EMAIL' },
  { settingKey: 'basicAuthUser', envKey: 'BASIC_AUTH_USER' },
  { settingKey: 'notionDatabaseId', envKey: 'NOTION_DATABASE_ID' },
];

const readableBooleanConfig: { settingKey: SettingKey, envKey: string, defaultValue: boolean }[] = [
  { settingKey: 'ukvisajobsHeadless', envKey: 'UKVISAJOBS_HEADLESS', defaultValue: true },
];

const privateStringConfig: { settingKey: SettingKey, envKey: string, hintKey: string }[] = [
  { settingKey: 'openrouterApiKey', envKey: 'OPENROUTER_API_KEY', hintKey: 'openrouterApiKeyHint' },
  { settingKey: 'rxresumePassword', envKey: 'RXRESUME_PASSWORD', hintKey: 'rxresumePasswordHint' },
  { settingKey: 'ukvisajobsPassword', envKey: 'UKVISAJOBS_PASSWORD', hintKey: 'ukvisajobsPasswordHint' },
  { settingKey: 'basicAuthPassword', envKey: 'BASIC_AUTH_PASSWORD', hintKey: 'basicAuthPasswordHint' },
  { settingKey: 'webhookSecret', envKey: 'WEBHOOK_SECRET', hintKey: 'webhookSecretHint' },
  { settingKey: 'notionApiKey', envKey: 'NOTION_API_KEY', hintKey: 'notionApiKeyHint' },
];

export function normalizeEnvInput(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseEnvBoolean(raw: string | null | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  if (raw === 'false' || raw === '0') return false;
  return true;
}

export function applyEnvValue(envKey: string, value: string | null): void {
  if (value === null) {
    const fallback = envDefaults[envKey];
    if (fallback === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = fallback;
    }
    return;
  }

  process.env[envKey] = value;
}

export function serializeEnvBoolean(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? 'true' : 'false';
}

export async function applyStoredEnvOverrides(): Promise<void> {
  await Promise.all([
    ...readableStringConfig.map(async ({ settingKey, envKey }) => {
      const override = await settingsRepo.getSetting(settingKey);
      if (override === null) return;
      applyEnvValue(envKey, normalizeEnvInput(override));
    }),
    ...readableBooleanConfig.map(async ({ settingKey, envKey, defaultValue }) => {
      const override = await settingsRepo.getSetting(settingKey);
      if (override === null) return;
      const parsed = parseEnvBoolean(override, defaultValue);
      applyEnvValue(envKey, serializeEnvBoolean(parsed));
    }),
    ...privateStringConfig.map(async ({ settingKey, envKey }) => {
      const override = await settingsRepo.getSetting(settingKey);
      if (override === null) return;
      applyEnvValue(envKey, normalizeEnvInput(override));
    }),
  ]);
}

export async function getEnvSettingsData(): Promise<Record<string, string | boolean | number | null>> {
  const readableValues: Record<string, string | boolean | null> = {};
  const privateValues: Record<string, string | null> = {};

  for (const { settingKey, envKey } of readableStringConfig) {
    const override = await settingsRepo.getSetting(settingKey);
    const rawValue = override ?? process.env[envKey];
    readableValues[settingKey] = normalizeEnvInput(rawValue);
  }

  for (const { settingKey, envKey, defaultValue } of readableBooleanConfig) {
    const override = await settingsRepo.getSetting(settingKey);
    const rawValue = override ?? process.env[envKey];
    readableValues[settingKey] = parseEnvBoolean(rawValue, defaultValue);
  }

  for (const { settingKey, envKey, hintKey } of privateStringConfig) {
    const override = await settingsRepo.getSetting(settingKey);
    const rawValue = override ?? process.env[envKey];
    privateValues[hintKey] = rawValue ? rawValue.slice(0, 4) : null;
  }

  return {
    ...readableValues,
    ...privateValues,
  };
}

export const envSettingConfig = {
  readableStringConfig,
  readableBooleanConfig,
  privateStringConfig,
};
