export const getCourseSlugByPath = (path: string) => {
  let slug = "";
  try {
    path.split("/");
    slug = path.split("/")[1];
  } catch (e) {}

  return slug;
};
