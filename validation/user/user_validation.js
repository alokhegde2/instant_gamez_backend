const Joi = require("joi");
const mongoose = require("mongoose");
//USER CREATION VALIDATION
// Custom Joi extension for ObjectId validation
const userRegisterationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    referralUserId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return { value, errors: helpers.error("objectId.invalid") };
      }
    }),
  });

  return schema.validate(data);
};

// Creating master password
const mpinCreationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    mPin: Joi.string().length(4).required(),
    token: Joi.string().required(),
  });

  return schema.validate(data);
};

//Verifying user

const userVerificationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
  });

  return schema.validate(data);
};

//Verifying mpin

const mpinVerificationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    mPin: Joi.string().length(4).required(),
    token:Joi.string().required()
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.userRegisterationValidation = userRegisterationValidation;
module.exports.mpinCreationValidation = mpinCreationValidation;
module.exports.userVerificationValidation = userVerificationValidation;
module.exports.mpinVerificationValidation = mpinVerificationValidation;
