module.exports.getDateWithNoTime = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

module.exports.getDateWithHour = (date = new Date()) => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours()
  );
};

module.exports.subtractHours = (numOfHours, date = new Date()) => {
  date.setHours(date.getHours() - numOfHours);
  return date;
};
