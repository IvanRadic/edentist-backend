import express from 'express'
import { MessageController } from './message.controller'
import { getMessageBySlug } from './message.input'
import { validate } from '../../middleware/validation'

const messageController = new MessageController()
export const messageRouter = express.Router()

messageRouter.get(
  '/:slug',
  validate(getMessageBySlug),
  messageController.getMessage
)
