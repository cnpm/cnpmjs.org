'use strict';


const React = require('react');
const Table = require('antd/lib/table');
const Tag = require('antd/lib/tag');

const UserStore = require('../stores/UserStore');
const UserAction = require('../actions/UserAction');


function getUserDataSource() {
  return {
    data: UserStore.getAll()
  }
}


export default React.createClass({
    componentDidMount() {
    UserAction.fetchList();
    UserStore.addChangeListener(this._onChange)
  },

  componentWillUnmount() {
    UserStore.removeChangeListener(this._onChange)
  },

  getInitialState() {
    let Ω = this;

    return {
      columns: [
        {
          title: 'Name', dataIndex: 'name',
          render(text, row) {
            let label = row.role > 0 ? <Tag color="blue">Mod</Tag> : null;
            return <span>{text}{label}</span>
          }
        }, {
          title: 'Action', dataIndex: 'role',
          render(_, row) {
            let btn = row.role === 1 ? 'Remove Admin' : 'Set Admin';
            return (
              <a onClick={Ω._setAdmin.bind(Ω, row)} href="javascript:;">
                {btn}
              </a>
            )
          }
        }
      ],
      pagination: {
        total: 0,
        current: 1
      },

      data: getUserDataSource().data
    }
  },

  render () {
    return <Table dataSource={this.state.data.rows} columns={this.state.columns} pagination={this.state.pagination} rowKey={ (e) => e.id }/>
  },

  _onChange () {
    this.setState(getUserDataSource())
  },

  _setAdmin(row) {
    UserAction.setAdmin(row)
  }
})

