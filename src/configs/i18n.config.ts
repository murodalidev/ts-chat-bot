import { resolve } from 'path'
import type { I18n } from 'telegraf-i18n'
import { I18nLanguages } from '../common/app.constants'
const TelegrafI18n: typeof I18n = require('telegraf-i18n')

const i18n = new TelegrafI18n({
  useSession: true,
  defaultLanguageOnMissing: true,
  directory: resolve(__dirname, '../common/locales'),
  defaultLanguage: I18nLanguages.ru
})

export default i18n
