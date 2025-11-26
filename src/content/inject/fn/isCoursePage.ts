export const isCoursePage = (): boolean => {
  let valid = false;
  const testElem = document.querySelector("div[data-avail-test]");
  if (testElem) {
    valid = testElem.getAttribute("data-avail-test") === "page:course";
  }
  return valid;
};
