const originalWarn = console.warn.bind(console);

console.warn = (...args) => {
  const text = args
    .map((value) => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object" && "message" in value) {
        return String(value.message);
      }
      return "";
    })
    .join(" ");

  if (text.includes("[baseline-browser-mapping] The data in this module is over two months old")) {
    return;
  }

  originalWarn(...args);
};
