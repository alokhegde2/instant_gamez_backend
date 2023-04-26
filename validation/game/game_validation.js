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

const gameIdValidation = (data) => {
  const schema = Joi.object({
    gameId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return { value, errors: helpers.error('objectId.invalid') };
      }
    })
  });

  return schema.validate(data);
};

const biddingValidation = (data) => {
  const schema = Joi.object({
    gameId: Joi.string().required(),
    userId: Joi.string().required(),
    amount: Joi.number().required(),
    biddingCategory: Joi.string().required(),
    biddingOn: Joi.string().required(),
    biddingNumber: Joi.number().required(),
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.gameValidation = gameValidation;
module.exports.biddingValidation = biddingValidation;
