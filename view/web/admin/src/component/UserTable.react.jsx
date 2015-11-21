'use strict';


const React = require('react');
const Table = require('antd/lib/table');
const Tag = require('antd/lib/tag');

const UserStore = require('../stores/UserStore');
const UserAction = require('../actions/UserAction');


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
          title: 'id', dataIndex: 'id'
        },
        {
          title: 'Name', dataIndex: 'name',
          render(text, row) {
            let label = row.role > 0 ? <Tag color="blue">Mod</Tag> : null;
            return <span>{text}{label}</span>
          }
        },
        {
          title: 'Email', dataIndex: 'email'
        },
        {
          title: 'GMT Create', dataIndex: 'gmt_create'
        },
        {
          title: 'NPM user', dataIndex: 'npm_user',
          render(_, row) {
            return <span>{'' + Boolean(row.npm_user)}</span>
          }
        },
        {
          title: 'Action', dataIndex: 'role',
          render(_, row) {
            let btn = row.role === 1 ? 'Remove Admin' : 'Assign Admin';
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

      data: {
        rows: UserStore.getAll().rows
      }
    }
  },

  render () {
    return <Table dataSource={this.state.data.rows} columns={this.state.columns} pagination={this.state.pagination} rowKey={ (e) => e.id }/>
  },

  _onChange () {
    this.setState({
      pagination: {
        total: UserStore.getAll().count
      },
      data: {
        rows: UserStore.getAll().rows
      }
    })
  },

  _setAdmin(row) {
    UserAction.setAdmin(row)
  }
})

