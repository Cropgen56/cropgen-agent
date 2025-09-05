import Joi from "joi";

export const validateOrganization = (data) =>
  Joi.object({
    name: Joi.string().min(2).required(),
    contact: Joi.string()
      .pattern(/^\+91\d{10}$/)
      .required(),
    email: Joi.string().email().required(),
  }).validate(data);
