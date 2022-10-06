const Joi = require("joi");

//USER CREATION VALIDATION

const addingMoneyWalletValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    amountToAdd: Joi.number().min(49).required(),
  });

  return schema.validate(data);
};

//Exporting modules
module.exports.addingMoneyWalletValidation = addingMoneyWalletValidation;
