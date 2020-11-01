import { createElement, Component, render } from "./mini-react.js"

class MyComponent extends Component {
  render() {
    return (
      <div>
        <h1>my component</h1>
        {this.children}
      </div>
    )
  }
}


render(<div class="test">
  <div>111</div>
  <div>222</div>
  <div>333</div>
  <MyComponent>
    <div>my component slot1</div>
    <div>my component slot2</div>
  </MyComponent>
</div>, document.body)
