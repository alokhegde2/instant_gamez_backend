const Joi = require("joi");

//GAME CREATION VALIDATION

const gameValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    openDate: Joi.number().required(),
    openBidTime: Joi.date().required(),
    closeBidTime: Joi.date().required(),
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.gameValidation = gameValidation;
