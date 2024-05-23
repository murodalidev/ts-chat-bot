export enum EnvVariables {
  isTestRequest = 'IS_TEST_REQUEST',
  botToken = 'BOT_TOKEN',
  errorsInInterval = 'ERRORS_IN_INTERVAL',
  userBlockedTime = 'USER_BLOCKED_TIME',
  redisHost = 'REDIS_HOST',
  redisPort = 'REDIS_PORT',
  chatApiHost = 'CHAT_API_HOST',
  chatApiUsername = 'CHAT_API_AUTH_USERNAME',
  chatApiPassword = 'CHAT_API_AUTH_PASSWORD',
  dbHost = 'POSTGRES_HOST',
  dbPort = 'POSTGRES_PORT',
  dbName = 'POSTGRES_DB',
  dbUserName = 'POSTGRES_USER',
  dbUserPassword = 'POSTGRES_PASSWORD',
  mediaHost = 'MEDIA_HOST',
  deleteFilesOlderThan = 'DELETE_FILES_OLDER_THAN'
}

export enum I18nLanguages {
  ru = 'ru',
  qq = 'qq',
  uz = 'uz'
}

export enum LanguageTexts {
  chooseLanguage = 'chooseLanguage',
  tryLater = 'tryLater',
  ruLang = 'Русский',
  uzLang = 'Узбекский',
  qqLang = 'Каракалпакский',
  sendPhoneNumber = 'sendPhoneNumber',
  introduceYourself = 'introduceYourself',
  enterFullName = 'enterFullName',
  badUsernameError = 'badUsernameError',
  startChat = 'startChat',
  connectOperator = 'connectOperator',
  waitingOperator = 'waitingOperator',
  waitOperatorToJoin = 'waitOperatorToJoin',
  operatorsBusyError = 'operatorsBusyError',
  chatEndedError = 'chatEndedError',
  operatorJoined = 'operatorJoined',
  pleaseWait = 'pleaseWait',
  endChat = 'endChat',
  tooManyRequests = 'tooManyRequests'
}

export enum SceneIds {
  getUserInfo = 'get-user-info',
  chatWithUser = 'chat-with-user'
}

export enum ChatApiEvents {
  startChat = 'start-chat',
  chatEvent = 'chat-event',
  channelErrors = 'channel-errors',
  sendMessage = 'send-message',
  sendLeave = 'send-leave'
}

export const chatApiAccessToken = 'chatAuthToken'

export const phoneNumberReg = /^\d{9}$/
export const foulWordsRegex =
  /\w{0,5}[хx]([хx\s\!@#\$%\^&*+-\|\/]{0,6})[уy]([уy\s\!@#\$%\^&*+-\|\/]{0,6})[ёiлeеюийя]\w{0,7}|\w{0,6}[пp]([пp\s\!@#\$%\^&*+-\|\/]{0,6})[iие]([iие\s\!@#\$%\^&*+-\|\/]{0,6})[3зс]([3зс\s\!@#\$%\^&*+-\|\/]{0,6})[дd]\w{0,10}|[сcs][уy]([уy\!@#\$%\^&*+-\|\/]{0,6})[4чkк]\w{1,3}|\w{0,4}[bб]([bб\s\!@#\$%\^&*+-\|\/]{0,6})[lл]([lл\s\!@#\$%\^&*+-\|\/]{0,6})[yя]\w{0,10}|\w{0,8}[её][bб][лске@eыиаa][наи@йвл]\w{0,8}|\w{0,4}[еe]([еe\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[uу]([uу\s\!@#\$%\^&*+-\|\/]{0,6})[н4ч]\w{0,4}|\w{0,4}[еeё]([еeё\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[нn]([нn\s\!@#\$%\^&*+-\|\/]{0,6})[уy]\w{0,4}|\w{0,4}[еe]([еe\s\!@#\$%\^&*+-\|\/]{0,6})[бb]([бb\s\!@#\$%\^&*+-\|\/]{0,6})[оoаa@]([оoаa@\s\!@#\$%\^&*+-\|\/]{0,6})[тnнt]\w{0,4}|\w{0,10}[ё]([ё\!@#\$%\^&*+-\|\/]{0,6})[б]\w{0,6}|\w{0,4}[pп]([pп\s\!@#\$%\^&*+-\|\/]{0,6})[иeеi]([иeеi\s\!@#\$%\^&*+-\|\/]{0,6})[дd]([дd\s\!@#\$%\^&*+-\|\/]{0,6})[oоаa@еeиi]([oоаa@еeиi\s\!@#\$%\^&*+-\|\/]{0,6})[рr]\w{0,12}|\w{0,6}[cсs][уu][kк][aа]/gim

export const sessionPrefix = 'telegram-bot/session/'
export const userErrorsPrefix = 'telegram-bot/errors'
