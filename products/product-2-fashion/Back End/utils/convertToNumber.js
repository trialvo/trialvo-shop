exports.convertToNumber = (str) => {
  // Check if the input string is empty, null, or undefined
  if (!str) {
    return 0;
  }

  // Remove the non-numeric part (e.g., "MB") and commas, and trim any leading/trailing whitespace
  const numberStr = str.replace(/[^0-9.,]/g, "").replace(/,/g, "");

  // Convert the resulting string to a number
  const number = parseFloat(numberStr);

  // Return the number, or 0 if the conversion fails (NaN)
  return isNaN(number) ? 0 : number;
};
