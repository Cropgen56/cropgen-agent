import Joi from "joi";
import pkg from "google-libphonenumber";
const { PhoneNumberUtil } = pkg;


const phoneUtil = PhoneNumberUtil.getInstance();

// Custom validator for international phone numbers
const phoneValidator = (value, helpers) => {
  try {
    const number = phoneUtil.parse(value); // Expects "+<countrycode><number>"
    if (!phoneUtil.isValidNumber(number)) {
      return helpers.error("any.invalid");
    }
    return value;
  } catch (err) {
    return helpers.error("any.invalid");
  }
};

// Organization validation
export const validateOrganization = (data) =>
  Joi.object({
    name: Joi.string().min(2).required(),
    contact: Joi.string().custom(phoneValidator).required(),
    email: Joi.string().email().required(),
  }).validate(data);
