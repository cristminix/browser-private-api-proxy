export const createAppRootElement = (containerId: string, rootId: string) => {
  const containerDivElement = document.createElement("div")
  containerDivElement.setAttribute("id", containerId)

  const rootDivElement = document.createElement("div")
  rootDivElement.setAttribute("id", rootId)

  containerDivElement.appendChild(rootDivElement)

  const body = document.querySelector("body")

  if (body) {
    body.prepend(containerDivElement)
  }
}
