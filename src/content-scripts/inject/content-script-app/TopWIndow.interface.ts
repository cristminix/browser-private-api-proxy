interface ITopWindow {
  getCourseInfo: (slug: string) => void
  getM3Rec: () => any
  getM3RecByType: (type: string, m3Rec: any) => any
  validCoursePage: () => boolean
  isLogedIn: () => boolean
  getCookie: () => string
  validCoursePageAuto: () => boolean
  getCourseSections: (urn: string) => any
  addCourseLegacy: (slug: string) => [any, any]
}

export interface TopWindowInterface extends ITopWindow {}
