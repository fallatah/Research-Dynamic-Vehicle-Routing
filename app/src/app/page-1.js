// find references that this approcah is not usable
// generate sample data 
// write the senario with high-quality screenshots and show the actual alghorithim
// look at the IEEE template

"use client";

import { useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

export default function Home() {


	// Manual Plan 
	const [manualPlan, setManualPlan] = useState([]);
	const [manualPlanDistance, setManualPlanDistance] = useState(undefined);
	const [manualPlanTime, setManualPlanTime] = useState(undefined);
	const [manualPlanPath, setManualPlanPath] = useState(undefined);

	// Optimized Plan (unchaged)
	const [optimizedPlanDistance, setOptimizedPlanDistance] = useState(undefined);
	const [optimizedPlanTime, setOptimizedPlanTime] = useState(undefined);
	const [optimizedPlanPath, setOptimizedPlanPath] = useState(undefined);

	// Optimized Plan (changed)
	const [optimizedPlanDistanceChanged, setOptimizedPlanDistanceChanged] = useState(undefined);
	const [optimizedPlanTimeChanged, setOptimizedPlanTimeChanged] = useState(undefined);
	const [optimizedPlanPathChanged, setOptimizedPlanPathChanged] = useState(undefined);


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

	const planManually = () => {

		let points = [];

		manualPlan?.forEach(key => {
			points.push({ label: key, lat: destinations?.[key]?.lat, long: destinations?.[key]?.long })
		});

		if (!isValideSetOfCoordinates([...[{ lat: depot?.lat, long: depot?.long }], ...points])) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else if (!isValideManualPlanning()) {
			alert("❌ You have to select 4 different destinations");
		}
		else {
			let plan = calculatePath({ lat: depot?.lat, long: depot?.long }, points);

			setManualPlanDistance(Math.round(plan.totalKm * 10) / 10);
			setManualPlanTime(Math.round(plan.time * 10) / 10);
			setManualPlanPath(plan.path);

			alert("✅ Planning Completed");
		}
	}

	const planWithOptimization = () => {

		let points = [];

		points.push({ lat: destinations?.A?.lat, long: destinations?.A?.long });
		points.push({ lat: destinations?.B?.lat, long: destinations?.B?.long });
		points.push({ lat: destinations?.C?.lat, long: destinations?.C?.long });
		points.push({ lat: destinations?.D?.lat, long: destinations?.D?.long });

		if (!isValideSetOfCoordinates([...[{ lat: depot?.lat, long: depot?.long }], ...points])) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else {
			let plan = calculatePathOptimized({ lat: depot?.lat, long: depot?.long }, points);

			let tempTime = Math.round(((plan.totalKm / startingSpeed) * 60) * 10) / 10;

			setOptimizedPlanDistance(Math.round(plan.totalKm * 10) / 10);
			setOptimizedPlanTime(tempTime);
			setOptimizedPlanPath(plan.path);
			setOptimizedPlanPathChanged(plan.path);

			alert("✅ Planning Completed");
		}
	}

	const calculatePath = (origin, destinations) => {

		// inline distance in km using Haversine
		const distanceKm = (a, b) => {
			const R = 6371;
			const toRad = x => (x * Math.PI) / 180;
			const dLat = toRad(Number(b.lat) - Number(a.lat));
			const dLon = toRad(Number(b.long) - Number(a.long));
			const la1 = toRad(Number(a.lat));
			const la2 = toRad(Number(b.lat));
			const h =
				Math.sin(dLat / 2) ** 2 +
				Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
			return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
		};

		if (!origin || !Array.isArray(destinations) || destinations.length === 0) {
			return { path: [origin, ...(destinations || [])], totalKm: 0 };
		}

		// Ensure origin has a label
		const labeledOrigin = { ...origin, label: "origin" };

		// Build full route (start + all destinations + return to origin)
		const fullRoute = [labeledOrigin, ...destinations, labeledOrigin];
		let totalKm = 0;

		for (let i = 0; i < fullRoute.length - 1; i++) {
			totalKm += distanceKm(fullRoute[i], fullRoute[i + 1]);
		}

		const totalTimeHrs = startingSpeed > 0 ? totalKm / startingSpeed : 0;
		const totalTimeMins = totalTimeHrs * 60;

		return { path: fullRoute, totalKm: totalKm, time: totalTimeMins };
	}

	// Haversine distance in km
	const distanceKm = (a, b) => {
		const R = 6371;
		const toRad = x => (x * Math.PI) / 180;
		const dLat = toRad(Number(b.lat) - Number(a.lat));
		const dLon = toRad(Number(b.long) - Number(a.long));
		const la1 = toRad(Number(a.lat));
		const la2 = toRad(Number(b.lat));
		const h =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
		return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
	};
	
	const calculatePathOptimized = (origin, destinations) => {

		if (!origin || !Array.isArray(destinations) || destinations.length === 0) {
			const labeledOrigin = { ...origin, label: "origin" };
			const path = [labeledOrigin, labeledOrigin];
			return { path, totalKm: 0, totalTimeHrs: 0, totalTimeMins: 0 };
		}

		// Ensure labels for all points
		const labeledOrigin = { ...origin, label: "origin" };
		const labeledDestinations = destinations.map((d, i) => ({
			...d,
			label: d.label || String.fromCharCode(65 + i), // A, B, C...
		}));

		// 1) Nearest neighbor seed
		const remaining = labeledDestinations.slice();
		const tour = [];
		let current = labeledOrigin;

		while (remaining.length) {
			let bestIdx = 0;
			let bestDist = Infinity;
			for (let i = 0; i < remaining.length; i++) {
				const d = remaining[i];
				const dist = distanceKm(current, d);
				if (dist < bestDist) {
					bestDist = dist;
					bestIdx = i;
				}
			}
			const next = remaining.splice(bestIdx, 1)[0];
			tour.push(next);
			current = next;
		}

		// 2) 2-opt improvement with fixed start at origin
		const twoOpt = pts => {
			const n = pts.length;
			if (n < 3) return pts.slice();
			let route = pts.slice();
			let improved = true;

			while (improved) {
				improved = false;
				for (let i = 0; i < n - 1; i++) {
					const Aprev = i === 0 ? labeledOrigin : route[i - 1];
					const A = route[i];
					for (let k = i + 1; k < n; k++) {
						const B = route[k];
						const Bnext = k === n - 1 ? null : route[k + 1];

						const currentCost = distanceKm(Aprev, A) + (Bnext ? distanceKm(B, Bnext) : 0);
						const swappedCost = distanceKm(Aprev, B) + (Bnext ? distanceKm(A, Bnext) : 0);

						if (swappedCost + 1e-9 < currentCost) {
							const reversed = route.slice(i, k + 1).reverse();
							route.splice(i, reversed.length, ...reversed);
							improved = true;
						}
					}
				}
			}
			return route;
		};

		const improved = twoOpt(tour);

		// 3) Close the tour by returning to origin and compute totals
		const path = [labeledOrigin, ...improved, labeledOrigin];

		let totalKm = 0;
		for (let i = 0; i < path.length - 1; i++) {
			totalKm += distanceKm(path[i], path[i + 1]);
		}

		// use global speed (in km/h)
		const totalTimeHrs = startingSpeed > 0 ? totalKm / startingSpeed : 0;
		const totalTimeMins = totalTimeHrs * 60;

		return { path, totalKm, totalTimeHrs, totalTimeMins };
	};

	const getTimeForLeg = (path, legIdx, speed) =>
	{
		if (!Array.isArray(path) || path.length < 2) return 0;
		const i0 = legIdx - 1;

		if (i0 < 0 || i0 >= path.length - 1) return 0;
		const km = distanceKm(path[i0], path[i0 + 1]);
		if (!Number.isFinite(speed) || speed <= 0) return 0;
		return (km / speed) * 60;

	};

	const simulateTrip = (legIdx) => {

		const speed =
		legIdx === 1 ? Number(speedForTrip1) :
		legIdx === 2 ? Number(speedForTrip2) :
		legIdx === 3 ? Number(speedForTrip3) :
		legIdx === 4 ? Number(speedForTrip4) :
		legIdx === 5 ? Number(speedForTrip5) : 0;

		// time for the leg on the mutable path
		const t = getTimeForLeg(optimizedPlanPathChanged, legIdx, speed);

		// baseline time for the same leg on the original optimized path using startingSpeed
		const baselineTime = getTimeForLeg(optimizedPlanPath, legIdx, Number(startingSpeed));

		// If our current leg would be faster than the baseline leg, reoptimize the remaining unvisited nodes
		if (t < baselineTime)
		{
			// Keep all completed legs fixed. Completed legs end at index legIdx - 1.
			const pathNow = optimizedPlanPathChanged.slice();
			const finalDepot = pathNow[pathNow.length - 1];

			// If legIdx is out of range or there is nothing left to reorder, skip
			if (legIdx >= pathNow.length - 1)
			{
				// nothing to reorder
			}
			else
			{
				const fixedPrefix = pathNow.slice(0, legIdx); // nodes up to the start of this leg stay fixed
				const currentStart = pathNow[legIdx - 1];

				// Remaining candidates exclude the final depot
				const remaining = pathNow.slice(legIdx, pathNow.length - 1);

				// Reoptimize only the remaining part starting from currentStart
				const reopt = calculatePathOptimized(currentStart, remaining);

				// reopt.path is [currentStart, ...ordered, currentStart]. We only need the ordered remaining nodes.
				const orderedRemaining = reopt.path.slice(1, -1);

				const newPath = [...fixedPrefix, ...orderedRemaining, finalDepot];
				setOptimizedPlanPathChanged(newPath);
			}
		}

		console.log(optimizedPlanPathChanged)
		alert("From " + optimizedPlanPathChanged[legIdx - 1]?.label + " to " + optimizedPlanPathChanged[legIdx]?.label + " => " + t);
	};

	const simulateEndTrip = () =>{
			alert(`🚙 Manual ran ${0}km and took ${0} minutes\n🚗 Heuristic ran ${0}km and took ${0} minutes`);
	};

	return isLoaded ? (
		<div className="flex items-top gap-2 p-5">

			<div className="w-fit">


				<div className="pb-20">
					<div className="text-2xl font-bold pb-5">1: Manual Planning (Anticipated)</div>
					{renderManualPlanningInput(0, "Trip 1")}
					{renderManualPlanningInput(1, "Trip 2")}
					{renderManualPlanningInput(2, "Trip 3")}
					{renderManualPlanningInput(3, "Trip 4")}
					<div className="flex pt-2">
						{(manualPlanDistance && manualPlanTime) ? `Distance is (${manualPlanDistance} km) and Time is (${manualPlanTime} Minutes)` : ""}
					</div>
					<div className="flex justify-end pt-2">
						<button onClick={planManually} className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer">
							Plan Manually
						</button>
					</div>
				</div>

				<div className="pb-20">
					<div className="text-2xl font-bold pb-5">2: Optimized Planning</div>
					<div className="pt-2">
						{(!optimizedPlanPath) ? null : optimizedPlanPath?.map((destination, key) => {
							return (
								<div key={key} className="flex items-center gap-2 pb-2">
									<div className="w-32 whitespace-nowrap">Trip {key + 1}:</div>
									<input
										type="text"
										className="bg-gray-300 rounded p-2 border cursor-not-allowed grow"
										value={destination?.label?.charAt(0).toUpperCase() + destination?.label?.slice(1)?.toLowerCase()}
										disabled={true}
									/>
								</div>
							)
						})}
					</div>
					<div className="flex pt-2">
						{(optimizedPlanDistance && optimizedPlanTime) ? `Distance is (${optimizedPlanDistance} km) and Time is (${optimizedPlanTime} Minutes)` : "Click on plan to design your route"}
					</div>					
					<div className="flex justify-end pt-2">
						<button onClick={planWithOptimization} className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer">
							Plan with Optimization
						</button>
					</div>
				</div>

				<div className="pb-20">
					<div className="text-2xl font-bold pb-5"> 3:Simulate Heuristic Planning (In Progress)</div>
					<div className="flex justify-end pt-2 gap-2">
						<input
							type="text"
							placeholder="Speed"
							className="bg-white rounded p-2 border w-20"
							defaultValue={speedForTrip1}
							onChange={e => handleSpeedChange(1, e.target.value)}
						/>
						<div className="p-3">km</div>
						<button className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={() => simulateTrip(1)}>
							Simulate Trip 1
						</button>
					</div>	
					<div className="flex justify-end pt-2 gap-2">
						<input
							type="text"
							placeholder="Speed"
							className="bg-white rounded p-2 border w-20"
							defaultValue={speedForTrip2}
							onChange={e => handleSpeedChange(2, e.target.value)}
						/>
						<div className="p-3">km</div>
						<button className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={() => simulateTrip(2)}>
							Simulate Trip 2
						</button>
					</div>	
					<div className="flex justify-end pt-2 gap-2">
						<input
							type="text"
							placeholder="Speed"
							className="bg-white rounded p-2 border w-20"
							defaultValue={speedForTrip3}
							onChange={e => handleSpeedChange(3, e.target.value)}
						/>
						<div className="p-3">km</div>
						<button className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={() => simulateTrip(3)}>
							Simulate Trip 3
						</button>
					</div>	
					<div className="flex justify-end pt-2 gap-2">
						<input
							type="text"
							placeholder="Speed"
							className="bg-white rounded p-2 border w-20"
							defaultValue={speedForTrip4}
							onChange={e => handleSpeedChange(4, e.target.value)}
						/>
						<div className="p-3">km</div>
						<button className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={() => simulateTrip(4)}>
							Simulate Trip 4
						</button>
					</div>
					<div className="flex justify-end pt-2 gap-2">
						<input
							type="text"
							placeholder="Speed"
							className="bg-white rounded p-2 border w-20"
							defaultValue={speedForTrip5}
							onChange={e => handleSpeedChange(5, e.target.value)}
						/>
						<div className="p-3">km</div>
						<button className="bg-amber-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={() => simulateTrip(5)}>
							Return to Depot
						</button>
					</div>		
					<div className="flex justify-end pt-2 gap-2">
						<button className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer w-48" onClick={simulateEndTrip}>
							Show Report
						</button>
					</div>																								
				</div>				
			</div>

			<div className="grow" />

			<div className="w-fit">
				<div className="pb-20">
					<div className="w-[900px] h-[700px]">
						<GoogleMap
							id={"google-map-view"}
							zoom={11}
							ref={mapRef}
							options={mapOptions}
							mapContainerStyle={{ width: '100%', height: '100%' }}
							center={{ lat: parseFloat(mapLat), lng: parseFloat(mapLong) }}
						>
							<Marker key={"point_depot"}
							>
								<InfoWindow position={{ lat: parseFloat(depot?.lat), lng: parseFloat(depot?.long) }} options={infoOptions} >
									<div className="px-[9px] py-2 text-white" style={{backgroundColor:"#0000ff"}}>⭐</div>
								</InfoWindow>
							</Marker>

							{
								Object.keys(destinations)?.map((key) => {
									if (destinations?.[key]?.lat === "" || destinations?.[key]?.lat === null || destinations?.[key]?.lat === undefined || destinations?.[key]?.long === "" || destinations?.[key]?.long === null || destinations?.[key]?.long === undefined)
										return null;

									return (
										<InfoWindow key={key} position={{ lat: parseFloat(destinations?.[key]?.lat), lng: parseFloat(destinations?.[key]?.long) }} options={infoOptions}>
											<div className="px-3 py-2 text-white">{key}</div>
										</InfoWindow>)
								})
							}

						</GoogleMap>
					</div>
				</div>
			</div>
		</div>
	) : (<></>);
}