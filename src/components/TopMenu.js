import React from 'react';
import { Layout, Dropdown, Menu, Icon, Button, Modal, message } from 'antd';
import './TopMenu.css';

function showConfirm() {
  Modal.confirm({
    title: 'Page will be redirected',
    content: 'Project is not save yet. Save this project first',
    onOk() {
      message.success('Adding project');
    },
    onCancel() {
      message.info('Make sure to save your project');
    },
  });
}

const userMenu = (
  <Menu>
    <Menu.Item key="user-profile" className="header-inner-menu">
      <a>
        <Icon type="user" /> Account Profile
      </a>
    </Menu.Item>
    <Menu.Item key="user-settings" className="header-inner-menu">
      <a>
        <Icon type="setting" /> Account Settings
      </a>
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item key="user-logout" className="header-inner-menu">
      <a>
        <Icon type="logout"/> Logout
      </a>
    </Menu.Item>
  </Menu>
);

const projectMenu = (
  <Menu>
    <Menu.Item key="project-sawit" className="header-inner-menu">
      <a onClick={showConfirm}>Project Sawit</a>
    </Menu.Item>
    <Menu.Item key="project-tambang" className="header-inner-menu">
      <a onClick={showConfirm}>Project Tambang</a>
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item className="header-inner-menu">
      <Button type="primary" icon="file-add" onClick={showConfirm}>Add New Project</Button>
    </Menu.Item>
  </Menu>
)

class Header extends React.Component {
  render() {
    return (
      <Layout.Header className="app-header">
        <div className="header-menu-left">
          <Dropdown overlay={projectMenu} trigger={['click']}>
            <a className="header-menu">
              <Icon type="folder" /> Projects
            </a>
          </Dropdown>
        </div>
        <div className="header-menu-center">
          <a className="">Cimaps</a>
        </div>
        <div className="header-menu-right">
          <Dropdown overlay={userMenu} trigger={['click']}>
            <a className="header-menu">
              <img src='/admin.png' alt="User" /> Tester
            </a>
          </Dropdown>
        </div>
      </Layout.Header>
    );
  }
}

export default Header;
