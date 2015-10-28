import React from 'react';

const Header = require('./Header.react');
const Breadcrumb = require('./Breadcrumb.react');
const Sidebar = require('./Sidebar.react');
const UserTable = require('./UserTable.react');

const App = React.createClass({
  render() {
    return (
      <div className="admin-app">
        <Header />
        <div className="breadcrumb">
          <Breadcrumb />
        </div>
        <div className="wrap">
          <div className="sidebar">
            <Sidebar />
          </div>
          <div className="main-section">
            <UserTable />
          </div>
        </div>
      </div>);
  }
});

export default App;
