import { isCoursePage } from "../fn/isCoursePage"
import { getCourseInfo } from "../fn/legacy/getCourseInfo"
import { getCourseSections } from "../fn/legacy/getCourseSections"
import { getM3Rec } from "../fn/legacy/getM3Rec"
import type { TopWindowInterface } from "./TopWIndow.interface"

export const topWindow: TopWindowInterface = {
  getCourseInfo: (slug: string) => {
    return getCourseInfo(slug)
  },
  getM3Rec: () => {
    return getM3Rec()
  },
  getM3RecByType(type, m3Rec) {
    return this.getM3RecByType(type, m3Rec)
  },
  validCoursePage: () => {
    return isCoursePage()
  },
  getCookie: () => {
    return document.cookie
  },
  getCourseSections: (urn: string) => {
    return getCourseSections(urn)
  },
  isLogedIn() {
    const containsRegex = (selector: string, regex: RegExp): boolean => {
      const elements = document.querySelectorAll(selector)
      return Array.from(elements).some((element) => regex.test(element.textContent || ""))
    }

    // Check for "sign in" buttons
    const signInBtnsDetect = containsRegex("a", /sign in/i)
    if (signInBtnsDetect) {
      return false
    }

    // Check for "Me" button
    const meBtnDetect = containsRegex("div.nav-bar__item-text", /Me/)
    if (meBtnDetect) {
      return true
    }

    return true
  },
  validCoursePageAuto() {
    return this.validCoursePage()
  },

  addCourseLegacy: (slug: string) => {
    console.log(`TopWindow.addCourseLegacy(): Add Course using internal API: ${slug}`)

    let course = getCourseInfo(slug)
    let sections
    if (course) {
      if (course.urn) {
        sections = getCourseSections(course.urn)
      }
    }
    return [course, sections]
  },
}
