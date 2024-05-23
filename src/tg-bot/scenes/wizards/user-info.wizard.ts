import { BotContext } from '../../../interfaces/context.interface'
import { Composer, Markup, Scenes } from 'telegraf'
import { I18nLanguages, foulWordsRegex, LanguageTexts, phoneNumberReg, SceneIds } from '../../../common/app.constants'
import { message } from 'telegraf/filters'
import { languageKeyboard, startChatKeyboard } from '../../keyboards'
import { UsersService } from '../../../users/users.service'

export class UserInfoWizard extends Scenes.WizardScene<BotContext> {
  private static usersService: UsersService

  constructor(usersService: UsersService) {
    super(
      SceneIds.getUserInfo,
      UserInfoWizard.startConversation(),
      UserInfoWizard.chooseLanguage(),
      UserInfoWizard.getPhoneNumber(),
      UserInfoWizard.getFullName()
    )
    UserInfoWizard.usersService = usersService
  }

  static createComposer(handler: (composer: Composer<BotContext>) => void) {
    const composer = new Composer<BotContext>()
    handler(composer)
    return composer
  }

  // step-1
  static startConversation() {
    return this.createComposer(composer => {
      composer.on(message('text'), async ctx => {
        await ctx.reply(ctx.i18n.t(LanguageTexts.chooseLanguage), languageKeyboard)
        return ctx.wizard.next()
      })
    })
  }

  // step-2
  static chooseLanguage() {
    return this.createComposer(composer => {
      composer.hears([LanguageTexts.ruLang, LanguageTexts.uzLang, LanguageTexts.qqLang], async ctx => {
        const chosenLang = ctx.update.message.text
        switch (chosenLang) {
          case LanguageTexts.ruLang:
            ctx.i18n.locale(I18nLanguages.ru)
            break
          case LanguageTexts.uzLang:
            ctx.i18n.locale(I18nLanguages.uz)
            break
          case LanguageTexts.qqLang:
            ctx.i18n.locale(I18nLanguages.qq)
            break
          default:
            break
        }
        await ctx.reply(ctx.i18n.t(LanguageTexts.sendPhoneNumber), Markup.removeKeyboard())
        return ctx.wizard.next()
      })
    })
  }

  // step-3
  static getPhoneNumber() {
    return UserInfoWizard.createComposer(composer => {
      composer.on(message('text'), async ctx => {
        const phoneNumber = ctx.update.message.text
        if (!phoneNumberReg.test(phoneNumber)) {
          await ctx.reply(ctx.i18n.t(LanguageTexts.sendPhoneNumber))
          return
        }
        const tgId = ctx.message.from.id
        const existingUser = await UserInfoWizard.usersService.findByTgIdOrPhone(tgId, phoneNumber)
        if (existingUser) {
          ctx.session.fullName = existingUser.fullName
          await ctx.reply(ctx.i18n.t(LanguageTexts.connectOperator), startChatKeyboard(ctx))
          return ctx.scene.leave()
        }
        ctx.session.phoneNumber = phoneNumber
        await ctx.reply(ctx.i18n.t(LanguageTexts.enterFullName))
        return ctx.wizard.next()
      })
    })
  }

  // step-4
  static getFullName() {
    return UserInfoWizard.createComposer(composer => {
      composer.on(message('text'), async ctx => {
        const fullName = ctx.update.message.text
        // TODO Check foul words regex. It is not working correctly
        if (!foulWordsRegex.test(fullName)) {
          const { id: tgId, username: tgUsername } = ctx.message.from
          ctx.session.fullName = fullName
          const { phoneNumber } = ctx.session
          await UserInfoWizard.usersService.createUser({ fullName, tgId, phoneNumber, tgUsername })
          await ctx.reply(ctx.i18n.t(LanguageTexts.connectOperator), startChatKeyboard(ctx))
          return ctx.scene.leave()
        }
        await ctx.reply(ctx.i18n.t(LanguageTexts.badUsernameError))
        await ctx.reply(ctx.i18n.t(LanguageTexts.enterFullName))
      })
    })
  }
}
