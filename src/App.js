import React, { Component } from 'react';
import logo from './logo.svg';
import Map from './components/Map';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="map-container">
          <Map />
        </div>
      </div>
    );
  }
}

export default App;
