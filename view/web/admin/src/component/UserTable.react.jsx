'use strict';


const React = require('react');
const Table = require('antd/lib/table');
const Tag = require('antd/lib/tag');

const UserStore = require('../stores/UserStore');
const UserAction = require('../actions/UserAction');


export default React.createClass({
  componentDidMount() {
    UserAction.fetchList();
    UserStore.addChangeListener(this._rerender)
  },

  componentWillUnmount() {
    UserStore.removeChangeListener(this._rerender)
  },

  getInitialState() {
    let that = this;

    return {
      searchCondition: '',
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
              <a onClick={that._setAdmin.bind(that, row)} href="javascript:;">
                {btn}
              </a>
            )
          }
        }
      ],
      pagination: UserStore.getAll().pagination,

      data: {
        rows: UserStore.getAll().rows
      }
    }
  },

  render () {
    let s = {
      marginBottom: '10px'
    }
    return (
      <div>
        <input type="text" style={s} value={this.state.searchCondition} onChange={this._setSearchCondition} className="ant-input ant-input-lg" onKeyUp={this._handleKeyUp} placeholder="Search email or username"/>
        <Table dataSource={this.state.data.rows} onChange={this._pageChange} columns={this.state.columns} pagination={this.state.pagination} rowKey={ (e) => e.id }/>
      </div>);
  },

  _rerender () {
    this.setState({
      pagination: UserStore.getAll().pagination,
      data: {
        rows: UserStore.getAll().rows
      }
    })
  },

  _pageChange (page) {
    UserAction.fetchList(page.current, this.state.searchCondition);
  },

  _setSearchCondition(evt) {
    this.setState({searchCondition: evt.target.value});
  },

  _handleKeyUp (evt) {
    if (evt.keyCode === 13) {
      UserAction.fetchList(1, this.state.searchCondition);
    }
  },

  _setAdmin(row) {
    UserAction.setAdmin(row);
  }
})

