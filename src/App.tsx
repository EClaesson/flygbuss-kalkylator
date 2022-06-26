import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

import marker from "./assets/marker-icon.png";
import markerSelected from "./assets/marker-icon-selected.png";

import "./App.css";
import "leaflet/dist/leaflet.css";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCh2J9vNvU6XQiWBpkh-y5ruop8l3ms2Dw",
  authDomain: "flygbuss-kalkylator.firebaseapp.com",
  databaseURL:
    "https://flygbuss-kalkylator-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "flygbuss-kalkylator",
  storageBucket: "flygbuss-kalkylator.appspot.com",
  messagingSenderId: "522458080754",
  appId: "1:522458080754:web:a6f49caa226d7b286cb76b",
});

interface Stop {
  name: string;
  before: number;
  coord: LatLngExpression;
  price: number;
}

interface Airline {
  name: string;
  company: string;
  companyUrl: string;
  stops: Stop[];
}

interface Flight {
  id: string;
  destination: string;
  departure: string;
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
        price: 100,
      },
      { name: "Sparre", before: 88, coord: [56.16018, 15.59148], price: 100, },
      { name: "Örlogshamnen", before: 84, coord: [56.1572, 15.58556], price: 100, },
      { name: "Amiralitetstorget", before: 83, coord: [56.15915, 15.58491], price: 100, },
      { name: "Varvet", before: 82, coord: [56.1593, 15.57979], price: 100, },
      {
        name: "Scandic Karlskrona (Fisktorget)",
        before: 80,
        coord: [56.16185, 15.57996],
        price: 100,
      },
      {
        name: "Karlskrona Centralstation (Läge B)",
        before: 78,
        coord: [56.16707, 15.58505],
        price: 100,
      },
      { name: "Kvarngatan", before: 76, coord: [56.1728, 15.59068], price: 100, },
      { name: "Galgamarkstrappan", before: 75, coord: [56.17759, 15.59491], price: 100, },
      { name: "Bergåsa Station", before: 73, coord: [56.1829, 15.6016], price: 100, },
      { name: "Ankaret (City Gross)", before: 71, coord: [56.19611, 15.61374], price: 100, },
      { name: "Ekeberg", before: 70, coord: [56.1988, 15.62012], price: 100, },
      { name: "Angöringen", before: 65, coord: [56.20734, 15.64359], price: 100, },
      { name: "Nättraby E22", before: 62, coord: [56.2073, 15.52793], price: 100, },
      { name: "Listerby E22", before: 55, coord: [56.19971, 15.40212], price: 90, },
      { name: "Ronneby Flygplats", before: 40, coord: [56.25439, 15.26728], price: 90, },
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
        price: 100,
      },
      { name: "Sparre", before: 97, coord: [56.16018, 15.59148], price: 100, },
      { name: "Örlogshamnen", before: 93, coord: [56.1572, 15.58556], price: 100, },
      { name: "Amiralitetstorget", before: 92, coord: [56.15915, 15.58491],price: 100, },
      { name: "Varvet", before: 91, coord: [56.1593, 15.57979], price: 100, },
      { name: "Fisktorget (Scandic)", before: 90, coord: [56.16185, 15.57996], price: 100, },
      {
        name: "Karlskrona Centralstation",
        before: 88,
        coord: [56.16707, 15.58505],
        price: 100,
      },
      { name: "Kvarngatan", before: 86, coord: [56.1728, 15.59068],price: 100, },
      { name: "Galgamarkstrappan", before: 85, coord: [56.17759, 15.59491], price: 100, },
      { name: "Bergåsa Station", before: 83, coord: [56.1829, 15.6016], price: 100, },
      { name: "Ankaret", before: 81, coord: [56.19611, 15.61374] ,price: 100, },
      { name: "Ekeberg", before: 80, coord: [56.1988, 15.62012], price: 100, },
      { name: "Angöringen", before: 72, coord: [56.20734, 15.64359], price: 100, },
      { name: "Nättraby E22", before: 69, coord: [56.2073, 15.52793], price: 90, },
      { name: "Hjortahammars Vsk.", before: 66, coord: [56.19788, 15.46852], price: 90, },
      { name: "Listerby E22", before: 63, coord: [56.19971, 15.40212], price: 70, },
      { name: "Ronneby Airport", before: 45, coord: [56.25439, 15.26728], price: 70, },
    ],
  },
];

const MAP_CENTER: LatLngExpression = [56.18957, 15.58404];
const MAP_ZOOM = 11;
const MAP_ZOOM_MARKEDSTOP = 14;

const ICON = new Icon({
  iconUrl: marker,
  iconSize: [25, 41],
  iconAnchor: [20, 30],
});

const MARKED_ICON = new Icon({
  iconUrl: markerSelected,
  iconSize: [25 * 1.5, 41 * 1.5],
  iconAnchor: [20 * 1.5, 30 * 1.5],
});

const DAYS_AHEAD = 8;

function App() {
  const [airline, setAirline] = useState<Airline | undefined>(AIRLINES[0]);
  const [markedStop, setMarkedStop] = useState<Stop | undefined>();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState("");

  const dates = [];
  const dateCursor = new Date();

  for (let i = 0; i < DAYS_AHEAD; i++) {
    dates.push(dateCursor.toISOString().split("T")[0]);
    dateCursor.setDate(dateCursor.getDate() + 1);
  }

  const getStopTime = (before: number) => {
    const departure = flights.find(
      (flight) => flight.id === selectedFlight
    )?.departure;

    if (!departure) {
      return null;
    }

    const date = new Date(departure);
    date.setMinutes(date.getMinutes() - before);

    const formatted = date.toLocaleTimeString("sv-SE");
    return formatted.substring(0, formatted.lastIndexOf(":"));
  };

  const fetchFlights = () => {
    if (!airline || !date) {
      return;
    }

    const db = getDatabase(firebaseApp);
    const flightsRef = ref(db, `/flights/${date}/${airline.name}`);
    onValue(flightsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot
          .val()
          .sort((a: Flight, b: Flight) => (a.departure > b.departure ? 1 : -1));
        setFlights(data);
        setSelectedFlight(data[0].id);
        handleFlightParam();
      } else {
        setFlights([]);
        setSelectedFlight("");
      }
    });
  };

  const formatUTCDate = (str: string) => {
    const formatted = new Date(str).toLocaleString("sv-SE");
    return formatted.substring(0, formatted.lastIndexOf(":"));
  };

  const handleFlightParam = () => {
    const params = new URLSearchParams(window.location.search);
    const paramFlight = params.get("flight");

    if(paramFlight) {
      setSelectedFlight(paramFlight);
    }
  }

  const handleParams = () => {
    const params = new URLSearchParams(window.location.search);
    const paramAirline = params.get("airline");
    const paramStop = params.get("stop");
    const paramDate = params.get("date");

    const selectedAirline = AIRLINES.find(
        (airline) => airline.name === paramAirline
    );

    if (paramAirline) {
      setAirline(selectedAirline);
    }

    if (paramDate) {
      setDate(paramDate);
    }

    setMarkedStop(
        selectedAirline?.stops.find((stop) => stop.name === paramStop) ||
        undefined
    );
  }

  useEffect(() => {
    handleParams();
    fetchFlights();
  }, []);

  useEffect(() => {
    fetchFlights();
  }, [airline, date]);

  return (
    <div className="container">
      <div className="card border-primary mt-2 mb-2">
        <div className="card-header">
          <h1 className="mb-1">Flygbuss-kalkylator</h1>
        </div>
        <div className="card-body p-2">
          <div className="row">
            <div className="col-xs-12 col-md-3 form-group">
              <label className="form-label">Flygbolag</label>
              <select
                className="form-select"
                value={airline?.name}
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
            <div className="col-xs-12 col-md-3 form-group">
              <label className="form-label">Datum</label>
              <select
                className="form-select"
                value={date}
                onChange={(evt) => setDate(evt.target.value)}
              >
                {dates.map((flightDate) => (
                  <option key={flightDate} value={flightDate}>
                    {flightDate}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-xs-12 col-md-6 form-group">
              <label className="form-label">Flight</label>
              <select
                className="form-select"
                value={selectedFlight}
                onChange={(evt) => setSelectedFlight(evt.target.value)}
              >
                {flights.map((flight) => (
                  <option key={flight.id} value={flight.id}>
                    {formatUTCDate(flight.departure)} - {flight.id} -{" "}
                    {flight.destination}
                  </option>
                ))}
                {!flights?.length && <option>Inga flights detta datum</option>}
              </select>
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
          {!!airline && !!date && !!selectedFlight && (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-primary p-2">
                  <table className="table table-sm table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Hållplats</th>
                        <th>Klockslag</th>
                        <th>Pris</th>
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
                          <td>{`${stop.price.toFixed(0)} SEK`}</td>
                          <td>
                            <a
                              type="button"
                              className="btn btn-sm btn-text"
                              title="Permalink"
                              href={`https://eclaesson.github.io/flygbuss-kalkylator/?airline=${encodeURIComponent(
                                airline?.name
                              )}&date=${encodeURIComponent(
                                date
                              )}&flight=${encodeURIComponent(
                                selectedFlight
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
                      <Marker
                        position={stop.coord}
                        key={stop.name}
                        icon={
                          markedStop?.name === stop.name ? MARKED_ICON : ICON
                        }
                      >
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
