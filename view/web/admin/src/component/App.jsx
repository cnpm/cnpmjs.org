import React from 'react';

const Nav = require('./Nav.react');
const UserTable = require('./UserTable.react');

const App = React.createClass({
  render() {
    return (
      <div className="admin-app">
        <Nav />
        <UserTable />
      </div>);
  }
});

export default App;
