import { createElement, Component, render } from "./mini-react.js"

class MyComponent extends Component {
  constructor() {
    super()
    this.state = {
      a: 1,
      b: 2
    }
    this.handleClick = this.handleClick.bind(this)
  }
  handleClick() {
    this.setState({
      a: this.state.a + 1
    })
  }
  render() {
    return (
      <div>
        <h1>my component</h1>
        <h2>a: {this.state.a.toString()}</h2>
        <h2>b: {this.state.b.toString()}</h2>
        {this.children}
        <button onClick={this.handleClick}>add</button>
      </div>
    )
  }
}

const template = (<div class="test">
  <div>111</div>
  <MyComponent>
    <div>my component slot1</div>
  </MyComponent>
</div>)


render(template, document.body)
