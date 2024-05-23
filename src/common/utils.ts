export const envFilePath = `${process.cwd()}/.${process.env.NODE_ENV || 'production'}.env`

export const getFileMimeType = (filePath: string) => filePath.split('.').pop()

export const isValidImageFile = (mimeType: string) => ['jpg', 'png', 'jpeg'].includes(mimeType)

export const splitArrayToChunks = <T>(array: T[], chunkSize: number) => {
  const chunkedArray: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunkedArray.push(array.slice(i, i + chunkSize))
  }
  return chunkedArray
}

export const getDiffInMinutes = (date1: Date, date2: Date) => {
  const diffInMilliSeconds = date2.getTime() - date1.getTime()
  return Math.round(((diffInMilliSeconds % 86400000) % 3600000) / 60000)
}
