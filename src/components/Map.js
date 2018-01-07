import React, { Component } from 'react';
import {
  Map as LeafletMap,
  WMSTileLayer,
  FeatureGroup,
  GeoJSON,
  Pane,
  ZoomControl,
  TileLayer,
  Popup
} from 'react-leaflet';
import { Button, Card, Checkbox, Tooltip } from 'antd';
import update from 'immutability-helper';

import './Map.css';

class Map extends Component {
  constructor() {
    super();
    
    this.state = { 
      lng: 112.84,
      lat: -1.59,
      zoom: 14,
      layers: [{
        id: 'block',
        title: 'Block',
        show: true,
        name: 'ehp:pg_block',
      }, {
        id: 'sawit',
        title: 'Sawit',
        show: false,
        name: 'ehp:pg_sawit'
      }, {
        id: 'jalan',
        title: 'Jalan',
        show: false,
        name: 'ehp:pg_road'
      }],
      toolboxShow: true,
      url: process.env.REACT_APP_URL,
      information: {}
    };

    this.toolboxHandler = () => {
      this.setState(prevState => {
        if (prevState.toolboxShow) {
          return {
            toolboxShow: false,
            toolboxIcon: 'menu-unfold'
          };
        }
        
        return {
          toolboxShow: true,
          toolboxIcon: 'menu-fold'
        };
      });
    }

    this.handleMapClick = e => {
      console.log(e);
    };

    this.handleZoom = e => {
      this.setState({
        zoom: e.target._zoom
      });
    };

    this.zoomIn = () => {
      this.setState(prevState => {
        return { zoom: prevState.zoom + 1 };
      });
    };

    this.zoomOut = () => {
      this.setState(prevState => {
        return { zoom: prevState.zoom - 1 };
      });
    };

    this.changeControl = (e) => {
      const { checked } = e.target;
      const newData = update(this.state.layers, {
        [e.target['data-index']]: {
          show: {
            $set: checked
          }
        }
      })
      this.setState({
        layers: newData
      });
    };
  }

  componentWillMount() {
    this.setState({
      loading: false
    });
  }

  renderLayerMap() {
    const { layers } = this.state;
    const filteredLayers = layers.filter(layer => layer.show);
    if (filteredLayers && filteredLayers.length > 0) {
      const mappedLayers = filteredLayers.map(layer => (
        <WMSTileLayer
          layers={layer.name}
          url={this.state.url}
          transparent={true}
          format="image/png"
          key={layer.id}
          maxNativeZoom={22}
          maxZoom={22}
        />
      ));

      return <div className="layer-map">{mappedLayers}</div>;
    }

    return null;
  }

  renderLayerControls() {
    const { layers } = this.state;

    if (layers && layers.length > 0) {
      const mappedLayers = layers.map((layer, index) => (
        <div className="layer-toolbox-control-item" key={`control-${layer.id}`}>
          <Checkbox id={layer.id} data-index={index} onChange={this.changeControl} checked={layer.show}>{layer.title}</Checkbox>
        </div>
      ));

      return <div className="layer-toolbox-controls">{mappedLayers}</div>;
    }

    return <span><i>No layers to show</i></span>;
  }

  renderInformation() {
    return null;
  }
  
  render() {
    // kak.duckdns.com

    return (
      <React.Fragment>
        <LeafletMap
          center={[this.state.lat, this.state.lng]}
          zoom={this.state.zoom}
          zoomControl={false}
          doubleClickZoom={false}
          onzoomend={this.handleZoom}
          onclick={this.handleMapClick}
        >
          <WMSTileLayer
            layers="ehp:ehp_base"
            url="//192.168.0.19:8080/geoserver/ehp/wms"
            maxNativeZoom={22}
            maxZoom={22}
          />
          {this.renderLayerMap()}
        </LeafletMap>
        <div className="layer-toolbox">
          <Tooltip title="Toolbox" mouseEnterDelay={2}>
            <Button type="primary" icon='switcher' onClick={this.toolboxHandler} />
          </Tooltip>
          <Card title="Available Layer" className={`layer-toolbox-list ${this.state.toolboxShow ? '' : 'hide'}`}>
            {this.renderLayerControls()}
          </Card>
        </div>
        <div className="layer-extension">
          <div className="layer-extension-wrapper">
            <Tooltip title="Zoom In">
              <Button type="primary" shape="circle" icon="plus" onClick={this.zoomIn} />
            </Tooltip>
            <span />
            <Tooltip title="Zoom Out">
              <Button type="primary" shape="circle" icon="minus" onClick={this.zoomOut} />
            </Tooltip>
          </div>
        </div>
        <div className="layer-information">
          <div className="layer-information-action">
            <Tooltip title="Information">
              <Button type="primary" icon="info" />
            </Tooltip>
          </div>
          <div className="layer-information-body">
            {this.renderInformation()}
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default Map;
