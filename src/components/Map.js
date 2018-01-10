import React, { PureComponent } from "react";
import { Map as LeafletMap, WMSTileLayer, FeatureGroup } from "react-leaflet";
import { Button, Card, Checkbox, Tooltip, Table } from "antd";
import immutability from "immutability-helper";
import find from "lodash/find";
import uniq from "lodash/uniq";
import map from "lodash/map";
import { PieChart, Pie, Tooltip as ChartTooltip, Legend, Cell } from "recharts";

import "./Map.css";

function serializeQuery(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

const chartColors = [
  "#ff0000",
  "#ff8000",
  "#ffff00",
  "#80ff00",
  "#00ff80",
  "#00ffff",
  "#0080ff",
  "#0000ff",
  "#7f00ff",
  "#ff00ff",
  "#ff007f",
  "#808080"
];

class Map extends PureComponent {
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
          show: false,
          name: "ehp:pg_block"
        },
        {
          id: "landuse",
          title: "Land use",
          show: false,
          name: "ehp:pg_landuse"
        },
        {
          id: "slope",
          title: "Slope",
          show: true,
          name: "ehp:pg_slope"
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
            const newData = immutability(this.state.information, {
              $set: data
            });
            this.setState(
              {
                information: newData,
                infoShow:
                  data.features && data.features.length > 0 ? true : false
              },
              () => {
                this.doFetchStatistics();
              }
            );
          })
          .catch(err => console.log(err));
      } else {
        const newData = immutability(this.state.information, { $set: {} });
        const newStatistic = immutability(this.state.statistics, { $set: {} });
        this.setState({
          information: newData,
          infoShow: false,
          statistics: newStatistic
        });
      }
    };

    this.doFetchStatistics = () => {
      const { information } = this.state;
      const { features } = information;

      let resultBloks = [];
      if (features && features.length > 0) {
        const bloks = [];
        features.forEach(feature => {
          if (feature.properties) {
            if (feature.properties.blok) {
              bloks.push(feature.properties.blok);
            } else if (feature.properties.blok_1) {
              bloks.push(feature.properties.blok_1);
            } else if (feature.properties.blok_2) {
              bloks.push(feature.properties.blok_2);
            }
          }
        });

        resultBloks = uniq(bloks);
      }

      if (resultBloks.length > 0) {
        const options = {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            blok: resultBloks
          })
        };
        const queryUrl = this.state.api;
        fetch(queryUrl, options)
          .then(response => response.json())
          .then(data => {
            const newData = immutability(this.state.statistics, { $set: data });
            this.setState({ statistics: newData });
          })
          .catch(error => console.log(error));
      } else {
        const newData = immutability(this.state.statistics, { $set: {} });
        this.setState({
          statistics: newData
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
      const newData = immutability(this.state.layers, {
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
        if (item !== "id") {
          columns.push({ title: item, dataIndex: item, key: item });
        }
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
        if (properties.hasOwnProperty("id")) {
          delete properties.id;
        }
        return {
          id,
          key: id,
          ...properties
        };
      });

      const layerCode = dataSource[0].key.split(".")[0];
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
    const { statistics } = this.state;
    if (statistics.status === "success" && statistics.data) {
      const mappedData = map(statistics.data, (datum, key) => {
        return {
          name: key,
          value: datum
        };
      });

      return (
        <React.Fragment>
          <h4>Statistics</h4>
          <PieChart width={320} height={320}>
            <Pie
              data={mappedData}
              dataKey="value"
              innerRadius={50}
              cx="50%"
              cy="50%"
            >
              {mappedData.map((entry, index) => (
                <Cell
                  key={`cell-entry-${entry}-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <ChartTooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </React.Fragment>
      );
    }

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
              className={`layer-toolbox-list ${this.state.toolboxShow
                ? ""
                : "hide"}`}
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
              className={`layer-information-body ${this.state.infoShow
                ? ""
                : "hide"}`}
            >
              <div className="layer-information-table">
                {this.renderInformationTable()}
              </div>
              <div className="layer-statistics-table">
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
