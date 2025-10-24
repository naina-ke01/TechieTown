// utils/validation.js
import Joi from "joi";

export const stkPushSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^(\+?254|0)?7\d{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a valid Kenyan mobile number",
      "string.empty": "Phone number is required",
    }),
  amount: Joi.number().integer().min(1).required().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than zero",
  }),
});
