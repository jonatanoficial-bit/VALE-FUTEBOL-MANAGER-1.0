/*
 * Settings management. Loads and stores user preferences in
 * localStorage. Supported settings include language (locale), dev mode
 * and audio volume. Defaults are provided if none are set.
 */

const SETTINGS_KEY = 'lcd_operator_settings';

const defaultSettings = {
  locale: 'pt-BR',
  devMode: false,
  audioVolume: 0.5,
};

export function getSettings() {
  try {
    const json = localStorage.getItem(SETTINGS_KEY);
    return json ? { ...defaultSettings, ...JSON.parse(json) } : { ...defaultSettings };
  } catch (err) {
    return { ...defaultSettings };
  }
}

export function setSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao salvar preferências', err);
  }
}