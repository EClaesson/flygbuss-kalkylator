import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import "./App.css";
import "leaflet/dist/leaflet.css";
import { Icon, LatLngExpression } from "leaflet";
import marker from "./assets/marker-icon.png";

interface Stop {
  name: string;
  before: number;
  coord: LatLngExpression;
}

interface Airline {
  name: string;
  company: string;
  companyUrl: string;
  stops: Stop[];
}

const AIRLINES: Airline[] = [
  {
    name: "FlygBRA",
    company: "Trossö Taxi",
    companyUrl: "https://www.trossotaxi.se/",
    stops: [
      {
        name: "Clarion Collection Hotel",
        before: 90,
        coord: [56.16704, 15.59067],
      },
      { name: "Sparre", before: 88, coord: [56.16018, 15.59148] },
      { name: "Örlogshamnen", before: 84, coord: [56.1572, 15.58556] },
      { name: "Amiralitetstorget", before: 83, coord: [56.15915, 15.58491] },
      { name: "Varvet", before: 82, coord: [56.1593, 15.57979] },
      {
        name: "Scandic Karlskrona (Fisktorget)",
        before: 80,
        coord: [56.16185, 15.57996],
      },
      {
        name: "Karlskrona Centralstation (Läge B)",
        before: 78,
        coord: [56.16707, 15.58505],
      },
      { name: "Kvarngatan", before: 76, coord: [56.1728, 15.59068] },
      { name: "Galgamarkstrappan", before: 75, coord: [56.17759, 15.59491] },
      { name: "Bergåsa Station", before: 73, coord: [56.1829, 15.6016] },
      { name: "Ankaret (City Gross)", before: 71, coord: [56.19611, 15.61374] },
      { name: "Ekeberg", before: 70, coord: [56.1988, 15.62012] },
      { name: "Angöringen", before: 65, coord: [56.20734, 15.64359] },
      { name: "Nättraby E22", before: 62, coord: [56.2073, 15.52793] },
      { name: "Listerby E22", before: 55, coord: [56.19971, 15.40212] },
      { name: "Ronneby Flygplats", before: 40, coord: [56.25439, 15.26728] },
    ],
  },
  {
    name: "SAS",
    company: "Bergkvarabuss",
    companyUrl:
      "https://bergkvarabuss.se/vara-egna-linjer/flygbuss-till-ronneby/",
    stops: [
      {
        name: "Clarion Collection Hotel",
        before: 100,
        coord: [56.16704, 15.59067],
      },
      { name: "Sparre", before: 97, coord: [56.16018, 15.59148] },
      { name: "Örlogshamnen", before: 93, coord: [56.1572, 15.58556] },
      { name: "Amiralitetstorget", before: 92, coord: [56.15915, 15.58491] },
      { name: "Varvet", before: 91, coord: [56.1593, 15.57979] },
      { name: "Fisktorget (Scandic)", before: 90, coord: [56.16185, 15.57996] },
      {
        name: "Karlskrona Centralstation",
        before: 88,
        coord: [56.16707, 15.58505],
      },
      { name: "Kvarngatan", before: 86, coord: [56.1728, 15.59068] },
      { name: "Galgamarkstrappan", before: 85, coord: [56.17759, 15.59491] },
      { name: "Bergåsa Station", before: 83, coord: [56.1829, 15.6016] },
      { name: "Ankaret", before: 81, coord: [56.19611, 15.61374] },
      { name: "Ekeberg", before: 80, coord: [56.1988, 15.62012] },
      { name: "Angöringen", before: 72, coord: [56.20734, 15.64359] },
      { name: "Nättraby E22", before: 69, coord: [56.2073, 15.52793] },
      { name: "Hjortahammars Vsk.", before: 66, coord: [56.19788, 15.46852] },
      { name: "Listerby E22", before: 63, coord: [56.19971, 15.40212] },
      { name: "Ronneby Airport", before: 45, coord: [56.25439, 15.26728] },
    ],
  },
];

const MAP_CENTER: LatLngExpression = [56.20771, 15.45526];
const MAP_ZOOM = 11;
const MAP_ZOOM_MARKEDSTOP = 14;

const ICON = new Icon({
  iconUrl: marker,
  iconSize: [25, 41],
  iconAnchor: [20, 30],
});

function App() {
  const [airline, setAirline] = useState<Airline | undefined>(AIRLINES[0]);
  const [departure, setDeparture] = useState("");
  const [departureOk, setDepartureOk] = useState(false);
  const [markedStop, setMarkedStop] = useState<Stop | undefined>();

  const getStopTime = (before: number) => {
    const timeParts = departure.split(":");
    const date = new Date();
    date.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10));
    date.setMinutes(date.getMinutes() - before);

    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramAirline = params.get("airline");
    const paramDeparture = params.get("departure");
    const paramStop = params.get("stop");

    const selectedAirline = AIRLINES.find(
      (airline) => airline.name === paramAirline
    );

    if (paramAirline) {
      setAirline(selectedAirline);
    }

    setDeparture(paramDeparture || "");
    setMarkedStop(
      selectedAirline?.stops.find((stop) => stop.name === paramStop) ||
        undefined
    );
  }, []);

  useEffect(() => {
    setDepartureOk(/^\d{1,2}:\d{2}$/gm.test(departure));
  }, [departure]);

  return (
    <div className="container">
      <div className="card border-primary mt-2">
        <div className="card-header">
          <h1 className="mb-1">Flygbuss-kalkylator</h1>
        </div>
        <div className="card-body p-2">
          <div className="row">
            <div className="col-xs-12 col-md-6 form-group">
              <label className="form-label">Flygbolag</label>
              <select
                className="form-select"
                onChange={(evt) => {
                  setAirline(
                    AIRLINES.find(
                      (airline) => airline.name === evt.target.value
                    )
                  );
                }}
              >
                {AIRLINES.map((airline) => (
                  <option key={airline.name} value={airline.name}>
                    {airline.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-xs-12 col-md-6 form-group">
              <label className="form-label">Avgångstid (Flyg)</label>
              <input
                type="text"
                className="form-control"
                maxLength={5}
                placeholder="00:00"
                value={departure}
                onChange={(evt) => {
                  const charPatterns = [
                    /[0-2]/,
                    /[0-9]/,
                    /:/,
                    /[0-5]/,
                    /[0-9]/,
                  ];

                  let okStr = "";

                  for (let i = 0; i < evt.target.value.length; i++) {
                    const char = evt.target.value.charAt(i);

                    if (charPatterns[i].test(char)) {
                      okStr += char;
                    } else {
                      break;
                    }
                  }

                  if (okStr.length === 2 && evt.target.value.length > departure.length) {
                    okStr += ":";
                  }

                  setDeparture(okStr);
                }}
              />
            </div>
          </div>
          {!!airline && (
            <div className="row mt-3">
              <div className="col-12">
                <div className="alert alert-primary p-2">
                  Flygbuss för {airline.name}:s avgångar körs av{" "}
                  <a href={airline.companyUrl} target="_blank">
                    {airline.company}
                  </a>
                  .
                </div>
              </div>
            </div>
          )}
          {!!airline && departureOk && (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-primary p-2">
                  <table className="table table-sm table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Hållplats</th>
                        <th>Klockslag</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {airline.stops.map((stop) => (
                        <tr
                          key={stop.name}
                          className={
                            stop.name === markedStop?.name
                              ? "table-primary"
                              : ""
                          }
                        >
                          <td>{stop.name}</td>
                          <td>{getStopTime(stop.before)}</td>
                          <td>
                            <a
                              type="button"
                              className="btn btn-sm btn-text"
                              title="Permalink"
                              href={`https://eclaesson.github.io/flygbuss-kalkylator/?airline=${encodeURIComponent(
                                airline?.name
                              )}&departure=${encodeURIComponent(
                                departure
                              )}&stop=${encodeURIComponent(stop.name)}`}
                            >
                              <i className="fas fa-link"></i>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-12">
                <div className="alert alert-primary p-2">
                  <MapContainer
                    center={markedStop?.coord || MAP_CENTER}
                    zoom={!!markedStop ? MAP_ZOOM_MARKEDSTOP : MAP_ZOOM}
                    className="map-container"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {airline.stops.map((stop) => (
                      <Marker position={stop.coord} key={stop.name} icon={ICON}>
                        <Popup offset={[-7, -8]}>
                          {stop.name}
                          <br />
                          {getStopTime(stop.before)}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
