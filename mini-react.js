const RENDER_TO_DOM = Symbol("render to dom")

function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()

  range.setStartBefore(node)
  range.setEndAfter(node)
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute(name, value) {
    this.props[name] = value
  }
  appendChild(component) {
    this.children.push(component)
  }
  get VNode() {
    return this.render().VNode
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    this._VNode = this.VNode
    this._VNode[RENDER_TO_DOM](range)
  }
  update() {
    const isSameNode = (oldNode, newNode) => {
      if (!oldNode || oldNode.type !== newNode.type) {
        return false
      }
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false
        }
      }
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false
      }
      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) {
          return false
        }
      }
      return true
    }
    const update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range

      const newChildren = newNode.vChildren
      const oldChildren = oldNode.vChildren

      if (!newChildren || !newChildren.length) {
        return
      }
      const tailRange = oldChildren[oldChildren.length - 1]['_range']
      for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]
        const oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          const range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
        }
      }
    }
    const VNode = this.VNode
    update(this._VNode, VNode)
    this._VNode = VNode
  }
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState
      this.reRender()
      return
    }
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.update()
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type
  }
  get VNode() {
    this.vChildren = this.children.map(child => child.VNode)
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    const root = document.createElement(this.type)
    for (let name in this.props) {
      const value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === "className") {
          root.setAttribute("class", value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }
    if (!this.vChildren) {
      this.vChildren = this.children.map(child => child.VNode)
    }
    for (let child of this.vChildren) {
      const childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    replaceContent(range, root)
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = "#text"
    this.content = content
  }
  get VNode() {
    return this
  }
  [RENDER_TO_DOM](range) {
    this._range = range
    const root = document.createTextNode(this.content)
    replaceContent(range, root)
  }
}



export function createElement(type, attributes, ...children) {
  let e
  if (typeof type === "string") {
    // 普通元素节点
    e = new ElementWrapper(type)
  } else {
    // 自定义组件
    e = new type
  }
  for (let p in attributes) {
    e.setAttribute(p, attributes[p])
  }

  const insertChildren = children => {
    for (let child of children) {
      if (typeof child === 'string') {
        // 只有一个文本子节点
        child = new TextWrapper(child)
      }
      if (child === null) {
        continue
      }
      if (typeof child === 'object' && child instanceof Array) {
        // 子节点有多个
        insertChildren(child)
      } else {
        // 只有一个元素子节点
        e.appendChild(child)
      }
    }
  }
  insertChildren(children)
  return e
}

export function render(component, parentElement) {
  const range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  range.deleteContents()
  component[RENDER_TO_DOM](range)
}

