const Joi = require("joi");

//USER CREATION VALIDATION

const userRegisterationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
  });

  return schema.validate(data);
};

// Creating master password
const mpinCreationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.string().length(10).required(),
    mPin: Joi.string().length(4).required(),
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
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.userRegisterationValidation = userRegisterationValidation;
module.exports.mpinCreationValidation = mpinCreationValidation;
module.exports.userVerificationValidation = userVerificationValidation;
module.exports.mpinVerificationValidation = mpinVerificationValidation;
