import React, { Component } from 'react';
// import logo from './logo.svg';
import Map from './components/Map';
import TopMenu from './components/TopMenu';
import { Layout } from 'antd';
import './App.css';

class App extends Component {
  render() {
    return (
      <Layout className="App">
        <TopMenu />
        <Layout.Content className="map-container">
          <Map />
        </Layout.Content>
      </Layout>
    );
  }
}

export default App;
