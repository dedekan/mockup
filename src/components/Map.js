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
import { Card, Checkbox } from 'antd';
import update from 'immutability-helper';

import './Map.css';

class Map extends Component {
  constructor() {
    super();
    
    this.state = { 
      lng: 112.84,
      lat: -1.59,
      zoom: 13,
      layers: [{
        id: 'block',
        title: 'Block',
        show: true,
        name: 'ehp:pg_block',
        style: {
          color: '#f79b07',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.6,
          fillColor: '#f79b07'
        }
      }],
      loading: true,
      url: process.env.REACT_APP_URL
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
  
  render() {
    // kak.duckdns.com
    return (
      <LeafletMap
        center={[this.state.lat, this.state.lng]}
        zoom={this.state.zoom}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <WMSTileLayer
          layers="ehp:ehp_base"
          url="//192.168.0.19:8080/geoserver/ehp/wms"
        />
        {this.renderLayerMap()}
        <div className="layer-toolbox">
          <Card
            loading={this.state.loading}
            title="Available Layer"
          >
            {this.renderLayerControls()}
          </Card>
        </div>
        <ZoomControl position="topright" />
      </LeafletMap>
    )
  }
}

export default Map;
