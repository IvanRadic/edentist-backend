import { Request } from 'express'
import Joi from 'joi'

export const getByIdSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        id: Joi.number().required()
      })
      .options({ abortEarly: false }),
    input: {
      id: req.params.id,
    }
  }
}

export const editProfileSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        firstName: Joi.string().min(1).max(36).optional(),
        lastName: Joi.string().min(1).max(36).optional()
      })
      .options({ abortEarly: false }),
    input: {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    }
  }
}
