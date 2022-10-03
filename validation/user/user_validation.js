const Joi = require("joi");

//USER CREATION VALIDATION

const userRegisterationValidation = (data) => {
  const schema = Joi.object({
    phoneNumber: Joi.number().min(10).required(),
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.userRegisterationValidation = userRegisterationValidation;
