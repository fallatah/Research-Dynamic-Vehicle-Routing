"use client";

import { useState, useMemo } from "react";

export default function Home() {
  // Depot
  const [depotLat, setDepotLat] = useState("");
  const [depotLong, setDepotLong] = useState("");

  // Trips A to D
  const [tripLatA, setTripLatA] = useState("");
  const [tripLongA, setTripLongA] = useState("");
  const [tripLatB, setTripLatB] = useState("");
  const [tripLongB, setTripLongB] = useState("");
  const [tripLatC, setTripLatC] = useState("");
  const [tripLongC, setTripLongC] = useState("");
  const [tripLatD, setTripLatD] = useState("");
  const [tripLongD, setTripLongD] = useState("");

  // Parameters
  const [capacity, setCapacity] = useState(2);
  const [speedKmh, setSpeedKmh] = useState(40);
  const [costMode, setCostMode] = useState("distance"); // distance or time

  // Validation
  const isValidLatitude = (val) => {
    if (!val && val !== 0) return false;
    const n = parseFloat(String(val).trim());
    return !isNaN(n) && n >= -90 && n <= 90;
  };

  const isValidLongitude = (val) => {
    if (!val && val !== 0) return false;
    const n = parseFloat(String(val).trim());
    return !isNaN(n) && n >= -180 && n <= 180;
  };

  const validateAll = () => {
    const all = [
      { label: "Depot", lat: depotLat, long: depotLong },
      { label: "A", lat: tripLatA, long: tripLongA },
      { label: "B", lat: tripLatB, long: tripLongB },
      { label: "C", lat: tripLatC, long: tripLongC },
      { label: "D", lat: tripLatD, long: tripLongD },
    ];
    for (const { label, lat, long } of all) {
      if (!isValidLatitude(lat)) {
        alert(`Invalid latitude for ${label}`);
        return false;
      }
      if (!isValidLongitude(long)) {
        alert(`Invalid longitude for ${label}`);
        return false;
      }
    }
    return true;
  };

  // Helpers
  const toNum = (x) => parseFloat(String(x).trim());

  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.long - a.long) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const s1 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
    return R * c;
  };

  const liveTimeHours = (km) => km / Math.max(1, speedKmh);

  const trafficMultiplier = () => 1 + Math.random() * 0.5;

  const depot = useMemo(
    () => ({ label: "Depot", lat: toNum(depotLat), long: toNum(depotLong) }),
    [depotLat, depotLong]
  );

  const customers = useMemo(
    () =>
      [
        { label: "A", lat: toNum(tripLatA), long: toNum(tripLongA) },
        { label: "B", lat: toNum(tripLatB), long: toNum(tripLongB) },
        { label: "C", lat: toNum(tripLatC), long: toNum(tripLongC) },
        { label: "D", lat: toNum(tripLatD), long: toNum(tripLongD) },
      ].filter((p) => !isNaN(p.lat) && !isNaN(p.long)),
    [
      tripLatA,
      tripLongA,
      tripLatB,
      tripLongB,
      tripLatC,
      tripLongC,
      tripLatD,
      tripLongD,
    ]
  );

  // inject the incident into this function (speed is reduced?)

  // Preplanned
  const planPreplanned = (speed) => {
    const remaining = [...customers];
    const trips = [];
    let totalKm = 0;
    let totalH = 0;

    while (remaining.length > 0) {
      let trip = ["Depot"];
      let load = 0;
      let pos = depot;
      while (load < capacity && remaining.length > 0) {
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const d = haversineKm(pos, remaining[i]);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        const next = remaining.splice(bestIdx, 1)[0];
        trip.push(next.label);
        totalKm += bestDist;
        totalH += liveTimeHours(bestDist);
        pos = next;
        load += 1;
      }
      const back = haversineKm(pos, depot);
      totalKm += back;
      totalH += liveTimeHours(back);
      trip.push("Depot");
      trips.push(trip);
    }
    return { trips, totalKm, totalH };
  };

  // Reactive
  const planReactive = () => {
    const remaining = [...customers];
    const trips = [];
    let totalKm = 0;
    let totalH = 0;

	// visualize the change 
    while (remaining.length > 0) {
      let trip = ["Depot"];
      let load = 0;
      let pos = depot;
      while (load < capacity && remaining.length > 0) {
        let bestIdx = -1;
        let bestScore = Infinity;
        let bestKm = 0;

        for (let i = 0; i < remaining.length; i++) {
          const km = haversineKm(pos, remaining[i]);
          const timeH =
            costMode === "time"
              ? liveTimeHours(km) * trafficMultiplier()
              : liveTimeHours(km);
          const score = costMode === "time" ? timeH : km;
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
            bestKm = km;
          }
        }

        const next = remaining.splice(bestIdx, 1)[0];
        const realizedKm = bestKm;
        const realizedTimeH =
          costMode === "time"
            ? liveTimeHours(bestKm) * trafficMultiplier()
            : liveTimeHours(bestKm);

        totalKm += realizedKm;
        totalH += realizedTimeH;
        trip.push(next.label);
        pos = next;
        load += 1;
      }
      const backKm = haversineKm(pos, depot);
      const backTimeH =
        costMode === "time"
          ? liveTimeHours(backKm) * trafficMultiplier()
          : liveTimeHours(backKm);
      totalKm += backKm;
      totalH += backTimeH;
      trip.push("Depot");
      trips.push(trip);
    }
    return { trips, totalKm, totalH };
  };

  const performPreplanned = () => {
    if (!validateAll()) return;
    const res = planPreplanned();
    const msg =
      `Preplanned trips: ${res.trips.map((t) => t.join(" -> ")).join(" | ")}\n` +
      `Total distance km: ${res.totalKm.toFixed(2)}\n` +
      `Total time hours at speed ${speedKmh}: ${res.totalH.toFixed(2)}`;
    alert(msg);
    console.log(msg);
  };

  const performReactive = () => {
    if (!validateAll()) return;
    const res = planReactive();
    const msg =
      `Reactive trips: ${res.trips.map((t) => t.join(" -> ")).join(" | ")}\n` +
      `Total distance km: ${res.totalKm.toFixed(2)}\n` +
      `Total time hours at speed ${speedKmh} with traffic: ${res.totalH.toFixed(2)}`;
    alert(msg);
    console.log(msg);
  };

  // Third button to generate sample coordinates for depot and A to D
  const randomInRange = (min, max) => (Math.random() * (max - min) + min).toFixed(6);
  const generateSampleData = () => {
    // Set PSU to be Depot :)
    setDepotLat(24.737513266445525);
    setDepotLong(46.698268964794934);
    // Points near the depot for a realistic cluster
    const baseLat = parseFloat(24.737513266445525);
    const baseLon = parseFloat(46.698268964794934);
    const jitter = () => (Math.random() - 0.5) * 0.2; // about ±0.1 deg
    setTripLatA((baseLat + jitter()).toFixed(6));
    setTripLongA((baseLon + jitter()).toFixed(6));
    setTripLatB((baseLat + jitter()).toFixed(6));
    setTripLongB((baseLon + jitter()).toFixed(6));
    setTripLatC((baseLat + jitter()).toFixed(6));
    setTripLongC((baseLon + jitter()).toFixed(6));
    setTripLatD((baseLat + jitter()).toFixed(6));
    setTripLongD((baseLon + jitter()).toFixed(6));
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-semibold">DVR Research</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">0. Pickup</h2>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Depot latitude"
            className="border rounded p-2"
            value={depotLat}
            onChange={(e) => setDepotLat(e.target.value)}
          />
          <input
            type="text"
            placeholder="Depot longitude"
            className="border rounded p-2"
            value={depotLong}
            onChange={(e) => setDepotLong(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Dropoff</h2>

        {[
          ["A", tripLatA, setTripLatA, tripLongA, setTripLongA],
          ["B", tripLatB, setTripLatB, tripLongB, setTripLongB],
          ["C", tripLatC, setTripLatC, tripLongC, setTripLongC],
          ["D", tripLatD, setTripLatD, tripLongD, setTripLongD],
        ].map(([label, lat, setLat, lon, setLon]) => (
          <div key={label} className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full items-center flex justify-center bg-gray-200 text-sm font-semibold">
              {label}
            </div>
            <input
              type="text"
              placeholder="Latitude"
              className="bg-white rounded p-2 border"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
            <input
              type="text"
              placeholder="Longitude"
              className="bg-white rounded p-2 border"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Parameters</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2">
            <span>Capacity per trip</span>
            <input
              type="number"
              min={1}
              className="border rounded p-2 w-24"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value || "1", 10))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span>Vehicle speed kmh</span>
            <input
              type="number"
              min={1}
              className="border rounded p-2 w-24"
              value={speedKmh}
              onChange={(e) => setSpeedKmh(parseFloat(e.target.value || "1"))}
            />
          </label>

          <label className="flex items-center gap-2">
            <span>Cost mode</span>
            <select
              className="border rounded p-2"
              value={costMode}
              onChange={(e) => setCostMode(e.target.value)}
            >
              <option value="distance">Distance</option>
              <option value="time">Time</option>
            </select>
          </label>
        </div>
      </section>

      <section className="flex items-center gap-4">
        <button onClick={performPreplanned} className="bg-black text-white px-4 py-2 rounded">
          Run Preplanned
        </button>
        <button onClick={performReactive} className="bg-blue-600 text-white px-4 py-2 rounded">
          Run Reactive
        </button>
        <button onClick={generateSampleData} className="bg-green-600 text-white px-4 py-2 rounded">
          Generate Sample Data
        </button>
      </section>

      <p className="text-sm text-gray-600">
        Use Generate Sample Data to fill depot and points A to D with valid random coordinates.
      </p>
    </div>
  );
}