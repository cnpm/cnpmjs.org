import React from 'react';
import Menu from 'antd/lib/menu'


export default React.createClass({
  getInitialState() {
    return {
      current: 'mail'
    }
  },
  handleClick(e) {
    console.log('click ', e);
    this.setState({
      current: e.key
    });
  },
  render() {
    return <Menu onClick={this.handleClick} selectedKeys={[this.state.current]} mode="horizontal">
    <Menu.Item key="mail">
      导航一
    </Menu.Item>
    <Menu.Item key="app">
      2
    </Menu.Item>
    <Menu.Item key="alipay">
      <a href="http://www.alipay.com/" target="_blank">导航四 - 链接</a>
    </Menu.Item>
  </Menu>
  }
});
