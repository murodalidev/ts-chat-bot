import { Scenes, Context } from 'telegraf'
import type { I18n } from 'telegraf-i18n'
import { Message } from 'telegraf/typings/core/types/typegram'

export interface BotWizardSession extends Scenes.WizardSessionData {
  myWizardSessionProp: boolean
}

export interface BotSession extends Scenes.WizardSession<BotWizardSession> {
  phoneNumber: string
  fullName: string
}

export interface BotContext extends Context {
  myContextProp: string

  session: BotSession
  mediaGroup: Message[]
  scene: Scenes.SceneContextScene<BotContext, BotWizardSession>
  wizard: Scenes.WizardContextWizard<BotContext>
  i18n: I18n
}
