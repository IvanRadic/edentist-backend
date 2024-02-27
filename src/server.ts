import { app } from './app'
import { scheduleGenericJob } from './services/scheduler'
import { execSync } from 'child_process'
import config from './config'
import { logger } from './logger'

const port = config.PORT
const commitHash = execSync('git rev-parse HEAD').toString().trim()

app.listen(port, () => {
  logger.info(
    `eDentist listening at http://localhost:${port} with commit hash ${commitHash}`
  )
})

if (config.EXAMPLE_CHECK_SCHEDULE) {
  scheduleGenericJob()
  logger.info('Generic job enabled')
}