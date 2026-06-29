const SPLIT_TYPES = Object.freeze({
  BY_ITEMS: "byItems",
  EQUAL: "equal",
  PERCENTUAL: "percentual",
  CUSTOM: "custom",
});

const SPLIT_TYPE_VALUES = Object.freeze(Object.values(SPLIT_TYPES));

module.exports = {
  SPLIT_TYPES,
  SPLIT_TYPE_VALUES,
};
