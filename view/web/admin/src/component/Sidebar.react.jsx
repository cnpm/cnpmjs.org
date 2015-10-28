import React from 'react';
import Menu from 'antd/lib/menu';
const SubMenu = Menu.SubMenu;


export default React.createClass({
  getInitialState() {
    return {
      current: '1'
    }
  },
  handleClick(e) {
    this.setState({
      current: e.key
    });
  },

  render() {
    return <Menu onClick={this.handleClick} defaultOpenKeys={['sub1']} selectedKeys={[this.state.current]} mode="inline">
      <SubMenu key="sub1" title={<span>后台管理</span>}>
        <Menu.Item key="1">用户列表</Menu.Item>
      </SubMenu>
    </Menu>
  }
});
