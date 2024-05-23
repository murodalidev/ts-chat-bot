import { Markup } from 'telegraf'
import { LanguageTexts } from '../common/app.constants'
import { BotContext } from '../interfaces/context.interface'

export const languageKeyboard = Markup.keyboard([
  [LanguageTexts.ruLang, LanguageTexts.uzLang],
  [LanguageTexts.qqLang]
]).resize()

export const startChatKeyboard = (ctx: BotContext) => Markup.keyboard([ctx.i18n.t(LanguageTexts.startChat)]).resize()
export const endChatKeyboard = (ctx: BotContext) => Markup.keyboard([ctx.i18n.t(LanguageTexts.endChat)]).resize()
