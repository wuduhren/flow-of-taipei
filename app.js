import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {PhongMaterial} from '@luma.gl/core';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';

const MAPBOX_TOKEN = process.env.MapboxAccessToken;

// const dataUrl = 'test-data.json';
const dataUrl = 'https://gist.motc.gov.tw/gist_api/V2/Map/Bus/Network/City/63000/Route?$format=GEOJSON&$top=500';
let busData = []

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = new PhongMaterial({
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
});

const landCover = [[[-74.0, 40.7], [-74.02, 40.7], [-74.02, 40.72], [-74.0, 40.72]]];

const defaultTheme = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const initialViewSetting = {
  longitude: 121.525,
  latitude: 25.0392,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

//prevent repeatly fetching
//because _renderLayers() is going to be called and called
let dataFetched = false;
function getData() {
  if (!dataFetched) {
    dataFetched = true;
    fetch(dataUrl).then(res => res.json()).then(data => {
      console.log(data)
      busData = data.features;
      return busData;
    });
  }
  return busData;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0
    };
  }

  componentDidMount() {
    this._animate();
  }

  componentWillUnmount() {
    if (this._animationFrame) {
      window.cancelAnimationFrame(this._animationFrame);
    }
  }

  _animate() {
    const {
      loopLength = 1800,
      animationSpeed = 60
    } = this.props;
    const timestamp = Date.now()/1000;
    const loopTime = loopLength/animationSpeed;

    this.setState({
      time: ((timestamp%loopTime)/loopTime)*loopLength
    });
    this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
  }

  _renderLayers() {
    const {
      trailLength = 180,
      theme = defaultTheme
    } = this.props;

    return [
      new TripsLayer({
        id: 'trips',
        data: getData(),
        getPath: d => d.geometry.coordinates,
        getTimestamps: d => d.geometry.coordinates.map((c, index) => {return index*50}), //manually generate the timestamp data which is not in source
        getColor: d => (Math.round(Math.random()) === 0 ? theme.trailColor0 : theme.trailColor1), //randomly use the color of each trail
        opacity: 0.3,
        widthMinPixels: 2,
        rounded: true,
        trailLength,
        currentTime: this.state.time,
        shadowEnabled: false
      })
    ];
  }

  render() {
    const {
      viewState,
      mapStyle = 'https://rivulet-zhang.github.io/dataRepo/mapbox/style/map-style-dark-v9-no-labels.json',
      theme = defaultTheme
    } = this.props;

    return (
      <DeckGL
        layers={this._renderLayers()}
        effects={theme.effects}
        initialViewState={initialViewSetting}
        viewState={viewState}
        controller={true}
      >
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing={true}
          mapboxApiAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
