"use client";

import { useState, useRef } from "react";
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

export default function Home() {

	// Set PSU to be Depot :)
	const mapLat = 24.737513266445525;
	const mapLong = 46.698268964794934;

	// Depot
	const [depot, setDepot] = useState({ lat: "", long: "" });

	// Destinations A–D
	const [destinations, setDestinations] = useState({
		A: { lat: "", long: "" },
		B: { lat: "", long: "" },
		C: { lat: "", long: "" },
		D: { lat: "", long: "" },
	});

	// Manual plan 
	const [manualPlan, setManualPlan] = useState([]);


	// GoogleMapSetup
	const mapRef = useRef(null);

	const { isLoaded } = useJsApiLoader(
    {
        id:"google-map-view",
        googleMapsApiKey: `${process.env.NEXT_PUBLIC_MAP_API_KEY}`
    });

	console.log("NEXT_PUBLIC_MAP_API_KEY", process.env.NEXT_PUBLIC_MAP_API_KEY)
	const mapOptions = {};	


	const renderDepot = () => (
		<div className="flex items-center gap-2 pb-2">
			<div className="w-32 whitespace-nowrap">Depot:</div>
			<input
				type="text"
				placeholder="Latitude"
				className="bg-white rounded p-2 border"
				value={depot.lat}
				onChange={e => handleDepotChange("lat", e.target.value)}
			/>
			<input
				type="text"
				placeholder="Longitude"
				className="bg-white rounded p-2 border"
				value={depot.long}
				onChange={e => handleDepotChange("long", e.target.value)}
			/>
		</div>
	);

	const renderDestinationInput = (id, label) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="w-32 whitespace-nowrap">{label}:</div>
			<input
				type="text"
				placeholder="Latitude"
				className="bg-white rounded p-2 border"
				value={destinations[id].lat}
				onChange={e => handleDestinationChange(id, "lat", e.target.value)}
			/>
			<input
				type="text"
				placeholder="Longitude"
				className="bg-white rounded p-2 border"
				value={destinations[id].long}
				onChange={e => handleDestinationChange(id, "long", e.target.value)}
			/>
		</div>
	);

	const renderManualPlanningInput = (id, label) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="w-32 whitespace-nowrap">{label}:</div>
			<select
				className="grow bg-white rounded p-2 border"
				value={manualPlan?.[id] ?? ""}
				onChange={e => handleManualPlanChange(id, e.target.value)}
			>
				<option value="">Select option</option>
				<option value="A">A</option>
				<option value="B">B</option>
				<option value="C">C</option>
				<option value="D">D</option>
			</select>
		</div>
	);

	const handleDepotChange = (key, value) => {
		setDepot(prev => ({ ...prev, [key]: value }));
	};

	const handleDestinationChange = (id, key, value) => {
		setDestinations(prev => ({
			...prev,
			[id]: { ...prev[id], [key]: value },
		}));
	};

	const handleManualPlanChange = (index, value) => {
		setManualPlan(prev => {
			const updated = [...prev];
			updated[index] = value;
			return updated;
		});
	};

	const isValideSetOfCoordinates = (points) => {

		let errorsFound = 0;

		points.forEach((p, i) => {
			if (p?.lat === "" || p?.lat === null || p?.lat === undefined || p?.long === "" || p?.long === null || p?.long === undefined) {
				errorsFound++;
			}
			else {
				const lat = Number(p?.lat);
				const long = Number(p?.long);

				const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
				const validLong = Number.isFinite(long) && long >= -180 && long <= 180;

				if (!validLat || !validLong) {
					errorsFound++;
				}
			}
		});

		return (errorsFound === 0);
	};

	const isValideManualPlanning = () => {

		const uniqueValues = new Set(manualPlan.filter(v => v !== "" && v != null));

		return (Array.isArray(manualPlan) && manualPlan.length === 4 && uniqueValues.size === manualPlan.length)
	};

	const generateSampleData = () => {

		handleDepotChange("lat", mapLat);
		handleDepotChange("long", mapLong);

		// Points near the depot for a realistic cluster
		const baseLat = parseFloat(mapLat);
		const baseLong = parseFloat(mapLong);
		const jitter = () => (Math.random() - 0.5) * 0.2; // about ±0.1 deg

		handleDestinationChange("A", "lat", (baseLat + jitter()).toFixed(6));
		handleDestinationChange("A", "long", (baseLong + jitter()).toFixed(6));
		handleDestinationChange("B", "lat", (baseLat + jitter()).toFixed(6));
		handleDestinationChange("B", "long", (baseLong + jitter()).toFixed(6));
		handleDestinationChange("C", "lat", (baseLat + jitter()).toFixed(6));
		handleDestinationChange("C", "long", (baseLong + jitter()).toFixed(6));
		handleDestinationChange("D", "lat", (baseLat + jitter()).toFixed(6));
		handleDestinationChange("D", "long", (baseLong + jitter()).toFixed(6));
	};

	const planManually = () => {

		let points = [];

		points.push({ lat: destinations?.A?.lat, long: destinations?.A?.long });
		points.push({ lat: destinations?.B?.lat, long: destinations?.B?.long });
		points.push({ lat: destinations?.C?.lat, long: destinations?.C?.long });
		points.push({ lat: destinations?.D?.lat, long: destinations?.D?.long });

		if (!isValideSetOfCoordinates([...[{ lat: depot?.lat, long: depot?.long }], ...points])) {
			alert("Invalid Latitude/Longitude Values");
		}
		else if (!isValideManualPlanning()) {
			alert("You have to select 4 different destinations");
		}
		else {
			let plan = calculatePath({ lat: depot?.lat, long: depot?.long }, points);
			
			console.log("path", plan.path)
			console.log("distance", plan.totalKm)
		}
	}

	const calculatePath = (origin, destinations) => {

		window.scrollTo({ top: 0, behavior: "smooth" });

		// inline distance in km using Haversine
		const distanceKm = (a, b) =>
		{
			const R = 6371; //6371 km is Earth’s radius.
			const toRad = x => (x * Math.PI) / 180;
			const dLat = toRad(Number(b.lat) - Number(a.lat));
			const dLon = toRad(Number(b.long) - Number(a.long));
			const la1 = toRad(Number(a.lat));
			const la2 = toRad(Number(b.lat));
			const h =
				Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
			return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
		};

		if (!origin || !Array.isArray(destinations) || destinations.length === 0) {
			return { path: [origin, ...(destinations || [])], totalKm: 0 };
		}

		const unvisited = destinations.slice();
		const path = [origin];
		let current = origin;
		let totalKm = 0;

		while (unvisited.length)
		{
			let bestIdx = 0;
			let bestDist = Infinity;

			for (let i = 0; i < unvisited.length; i++) {
				const d = unvisited[i];
				const dist = distanceKm(current, d);
				if (dist < bestDist) {
					bestDist = dist;
					bestIdx = i;
				}
			}

			const next = unvisited.splice(bestIdx, 1)[0];
			totalKm += bestDist;
			path.push(next);
			current = next;
		}

		return { path, totalKm };
	}


	return isLoaded ? (
		<div className="flex items-top gap-2 p-5">

			<div className="w-fit">

				<div className="pb-20">
					<div className="text-2xl font-bold pb-5">Planner</div>
					{renderDepot()}
					{renderDestinationInput("A", "Destination A")}
					{renderDestinationInput("B", "Destination B")}
					{renderDestinationInput("C", "Destination C")}
					{renderDestinationInput("D", "Destination D")}
					<div className="flex justify-end pt-2">
						<button onClick={generateSampleData} className="bg-blue-600 text-white px-4 py-2 rounded">
							Generate Sample
						</button>
					</div>
				</div>

				<div className="pb-20">
					<div className="text-2xl font-bold pb-5">Manual Planning (Anticipated)</div>
					{renderManualPlanningInput(0, "Trip 1")}
					{renderManualPlanningInput(1, "Trip 2")}
					{renderManualPlanningInput(2, "Trip 3")}
					{renderManualPlanningInput(3, "Trip 4")}
					<div className="flex justify-end pt-2">
						<button onClick={planManually} className="bg-green-600 text-white px-4 py-2 rounded">
							Plan Manually
						</button>
					</div>
				</div>
			</div>

			<div className="grow" />

			<div className="w-fit">
				<div className="pb-20">
					<div className="text-2xl font-bold pb-5">Here is Your Plan</div>
					<div className="w-[600px] h-[400px]">
						<GoogleMap
							id={"google-map-view"}
							ref={mapRef}
							options={mapOptions}
							mapContainerStyle={{width:'100%', height:'100%'}}
							center={{lat:parseFloat(mapLat), lng:parseFloat(mapLong)}}
						>
						</GoogleMap>
					</div>
				</div>
			</div>
		</div>
	) : (<></>);
}