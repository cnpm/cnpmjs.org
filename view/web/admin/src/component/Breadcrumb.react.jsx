const React = require('react');
const Breadcrumb = require('antd/lib/breadcrumb');

export default React.createClass({
  render() {
    return <Breadcrumb>
      <Breadcrumb.Item href="/admin">后台管理</Breadcrumb.Item>
      <Breadcrumb.Item>用户列表</Breadcrumb.Item>
    </Breadcrumb>
  }
})
