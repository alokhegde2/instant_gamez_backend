const Joi = require("joi");

//CATEGORY CREATION VALIDATION

const categoryValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    digits: Joi.array().required(),
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.categoryValidation = categoryValidation;
