import React, { Component } from "react";
import { Map as LeafletMap, WMSTileLayer, FeatureGroup } from "react-leaflet";
import { Button, Card, Checkbox, Tooltip, Table } from "antd";
import update from "immutability-helper";
import find from "lodash/find";

import "./Map.css";

function serializeQuery(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

class Map extends Component {
  constructor() {
    super();

    this.state = {
      lng: 112.837,
      lat: -1.578,
      zoom: 14,
      layers: [
        {
          id: "block",
          title: "Block",
          show: true,
          name: "ehp:pg_block"
        },
        {
          id: "planted",
          title: "Planted",
          show: false,
          name: "ehp:pg_landuse"
        },
        {
          id: "sawit",
          title: "Sawit",
          show: false,
          name: "ehp:pg_sawit"
        },
        {
          id: "jalan",
          title: "Jalan",
          show: false,
          name: "ehp:pg_road"
        }
      ],
      toolboxShow: true,
      infoShow: false,
      url: process.env.REACT_APP_URL,
      api: process.env.REACT_APP_API_HOST,
      information: {},
      statistics: {}
    };

    this.toolboxHandler = () => {
      this.setState(prevState => {
        if (prevState.toolboxShow) {
          return {
            toolboxShow: false,
            toolboxIcon: "menu-unfold"
          };
        }

        return {
          toolboxShow: true,
          toolboxIcon: "menu-fold"
        };
      });
    };

    this.handleMapClick = e => {
      const { layers } = this.state;
      const filteredLayers = layers.filter(layer => layer.show);

      if (filteredLayers && filteredLayers.length > 0) {
        const layer = filteredLayers[0];
        const { latlng } = e;
        const bbox = {
          southwest: [latlng.lng - 0.005, latlng.lat - 0.005],
          northeast: [latlng.lng + 0.005, latlng.lat + 0.005]
        };
        const stringBbox = Object.values(bbox).toString();

        const queryParam = {
          service: "wms",
          version: "1.1",
          request: "GetFeatureInfo",
          format: "image/png",
          transparent: true,
          query_layers: layer.name,
          layers: layer.name,
          info_format: "application/json",
          feature_count: 50,
          x: 50,
          y: 50,
          srs: "EPSG:4326",
          width: 101,
          height: 101,
          bbox: stringBbox
        };

        const queryUrl = `${this.state.url}?${serializeQuery(queryParam)}`;
        fetch(queryUrl)
          .then(response => response.json())
          .then(data => {
            const newData = update(this.state.information, {
              $set: data
            });
            this.setState({
              information: newData,
              infoShow: data.features && data.features.length > 0 ? true : false
            });
          })
          .catch(err => console.log(err));
      } else {
        const newData = update(this.state.information, {
          $set: {}
        });
        this.setState({
          information: newData,
          infoShow: false
        });
      }
    };

    this.handleZoom = e => {
      this.setState({
        zoom: e.target._zoom
      });
    };

    this.zoomIn = () => {
      this.setState(
        prevState => {
          return { zoom: prevState.zoom + 1 };
        },
        () => {
          this.leafMap.leafletElement.setZoom(this.state.zoom);
        }
      );
    };

    this.zoomOut = () => {
      this.setState(
        prevState => {
          return { zoom: prevState.zoom - 1 };
        },
        () => {
          this.leafMap.leafletElement.setZoom(this.state.zoom);
        }
      );
    };

    this.changeControl = e => {
      const { checked } = e.target;
      const newData = update(this.state.layers, {
        [e.target["data-index"]]: {
          show: {
            $set: checked
          }
        }
      });
      this.setState({
        layers: newData
      });
    };

    this.infoHandler = e => {
      this.setState({
        infoShow: !this.state.infoShow
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
        <FeatureGroup key={layer.id}>
          <WMSTileLayer
            layers={layer.name}
            url={this.state.url}
            transparent={true}
            format="image/png"
            maxNativeZoom={22}
            maxZoom={22}
          />
        </FeatureGroup>
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
          <Checkbox
            id={layer.id}
            data-index={index}
            onChange={this.changeControl}
            checked={layer.show}
          >
            {layer.title}
          </Checkbox>
        </div>
      ));

      return <div className="layer-toolbox-controls">{mappedLayers}</div>;
    }

    return (
      <span>
        <i>No layers to show</i>
      </span>
    );
  }

  renderInformationTable() {
    const { information, layers } = this.state;
    const { features } = information;

    if (features && features.length > 0) {
      const columns = [{ title: "ID", dataIndex: "id", key: "id" }];

      const properties = Object.keys(features[0].properties);
      properties.forEach(item => {
        columns.push({ title: item, dataIndex: item, key: item });
      });

      const showColumns = columns.slice(0, 3);
      const hideColumns = columns.slice(3, columns.length + 1);

      const expandedRecord = record => {
        const hideContent = hideColumns
          .map(item => {
            return `${item.key}: ${record[item.key]}`;
          })
          .join(", ");
        return <p style={{ margin: 0 }}>{hideContent}</p>;
      };
      const dataSource = features.map((feature, index) => {
        const { id, properties } = feature;
        return {
          id,
          key: id,
          ...properties
        };
      });

      const layerCode = dataSource[0].id.split(".")[0];
      const shownLayer = find(layers, item => {
        if (item && item.name && item.name.includes(layerCode)) {
          return item;
        }
        return null;
      });

      return (
        <React.Fragment>
          {shownLayer ? <h4>{shownLayer.title} Layer</h4> : null}
          <Table
            columns={showColumns}
            expandedRowRender={expandedRecord}
            dataSource={dataSource}
            pagination={false}
            scroll={{
              y: 400
            }}
          />
        </React.Fragment>
      );
    }
    return <span>Click something inside active layer</span>;
  }

  renderStatisticsChart() {
    const { information, layer } = this.state;
    const { features } = information;

    if (features && features.length > 0) {
      const properties = Object.keys(features[0].properties);
      const options = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          blok: ["A10", "B07", "C25"]
        })
      };
      const queryUrl = `${this.state.api}`;
      fetch(queryUrl, options)
        .then(response => response.json())
        .then(data => {
          const newData = update(this.state.statistics, { $set: data });
          //this.setState({ statistics: newData });
        })
        .catch(error => console.log(error));
    }
    return null;
    //return (
    //<React.Fragment>
    //<h4>Testing render</h4>
    //</React.Fragment>
    //);
  }

  render() {
    // kak.duckdns.com
    console.log(this.state.statistics);
    return (
      <React.Fragment>
        <LeafletMap
          center={[this.state.lat, this.state.lng]}
          zoom={this.state.zoom}
          zoomControl={false}
          doubleClickZoom={false}
          onzoomend={this.handleZoom}
          onclick={this.handleMapClick}
          ref={mapId => {
            this.leafMap = mapId;
          }}
        >
          <WMSTileLayer
            layers="ehp:ehp_base"
            url={this.state.url}
            maxNativeZoom={22}
            maxZoom={22}
          />
          {this.renderLayerMap()}
        </LeafletMap>
        <div className="layer-toolbox">
          <Tooltip title="Toolbox" mouseEnterDelay={2}>
            <Button
              type="primary"
              icon="switcher"
              onClick={this.toolboxHandler}
            />
          </Tooltip>
          <div className="layer-toolbox-wrapper">
            <Card
              title="Layers"
              className={`layer-toolbox-list ${
                this.state.toolboxShow ? "" : "hide"
              }`}
            >
              {this.renderLayerControls()}
            </Card>
          </div>
        </div>
        <div className="layer-extension">
          <div className="layer-extension-wrapper">
            <Tooltip title="Zoom In" placement="bottom">
              <Button
                type="primary"
                shape="circle"
                icon="plus"
                onClick={this.zoomIn}
              />
            </Tooltip>
            <span />
            <Tooltip title="Zoom Out" placement="bottom">
              <Button
                type="primary"
                shape="circle"
                icon="minus"
                onClick={this.zoomOut}
              />
            </Tooltip>
          </div>
        </div>
        <div className="layer-information">
          <div className="layer-information-action">
            <Tooltip title="Information" placement="bottom">
              <Button type="primary" icon="info" onClick={this.infoHandler} />
            </Tooltip>
          </div>
          <div className="information-body-wrapper">
            <Card
              title="Information"
              className={`layer-information-body ${
                this.state.infoShow ? "" : "hide"
              }`}
            >
              <div className="layer-information-table">
                {this.renderInformationTable()}
              </div>
            </Card>
          </div>
          <div className="statistics-body-wrapper">
            <Card
              title="Statistics"
              className={`layer-information-body ${
                this.state.infoShow ? "" : "hide"
              }`}
            >
              <div className="blok-statistics-table">
                {this.renderStatisticsChart()}
              </div>
            </Card>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Map;
