// find references that this approcah is not usable
// generate sample data 
// write the senario with high-quality screenshots and show the actual alghorithim
// look at the IEEE template

"use client";

import { useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';

import decodePolyline from "decode-google-map-polyline";

export default function Home()
{
	// Loading Spinner
	const [isLoading, setIsLoading] = useState(false);
	const [isSimulating, setIsSimulating] = useState(false);



	// Set Traffic Penelty
	const trafficPenalty = 30;


	// Set PSU to be Depot :)
	const mapLat = 24.737513266445525;
	const mapLong = 46.698268964794934;	



	// Road speed in KPH
	const [startingSpeed, setStartingSpeed] = useState(70.0);

	
	

	// Depot Info
	const [depot, setDepot] = useState({ lat: mapLat, long: mapLong });



	// Destinations A–D Info
	const [destinations, setDestinations] = useState({
		A: { lat: "", long: "" },
		B: { lat: "", long: "" },
		C: { lat: "", long: "" },
		D: { lat: "", long: "" },
	});



	// Manual Plan
	const [manualPlan, setManualPlan] = useState([]);
	const [manualPlanData, setManualPlanData] = useState({});



	// Optimized Plan
	const [optimizedPlan, setOptimizedPlan] = useState([]);
	const [OptimizedPlanData, setOptimizedPlanData] = useState({});



	// Heuristic Plan
	const [heuristicPlan, setHeuristicPlan] = useState([]);
	const [heuristicPlanData, setHeuristicPlanData] = useState({});



	// simulation
	const [simulation, setSimulation] = useState(
	{
		step:0,
		path:
		{
			manual:[],
			optimized:[],
			heuristic:[]
		},
		distance:
		{
			manual:0.0,
			optimized:0.0,
			heuristic:0.0
		},
		duration:
		{
			manual:0.0,
			optimized:0.0,
			heuristic:0.0
		},
		polyline:
		{
			manual:[],
			optimized:[],
			heuristic:[]
		},
		penalty:
		{
			manual:0.0,
			optimized:0.0,
			heuristic:0.0
		}
	});

	

	// Converts Long/Lat to Google Waypoints
	const toWaypoint = ([lat, lng]) => ({
		location: { latLng: { latitude: lat, longitude: lng } }
	});



	// Google Map Setup
	const mapRef = useRef(null);

	const { isLoaded } = useJsApiLoader(
	{
		id: "google-map-view",
		googleMapsApiKey: `${process.env.NEXT_PUBLIC_MAP_API_KEY}`
	});


    const polylineOptions =
    {
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWeight: 5,
        clickable: false,
        draggable: false,
        editable: false,
        geodesic: false,
        zIndex: 1,
    };

	const mapOptions = {
		zoomControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: false,
		clickableIcons: false
	};

	const infoOptions =
	{
		enableEventPropagation: true,
		disableAutoPan: true,
		boxStyle: {
			content: "",
			minWidth: "30px",
		},
		closeBoxURL: ""
	};	

	

	// Render Depot & Initial Speed
	const renderDepotAndInitialSpeed = () => (
		<>
			<div className="flex items-center gap-2 pb-2">
				<div className="w-26 whitespace-nowrap">Speed (km):</div>
				<input
					type="text"
					placeholder="Speed"
					className={`bg-white rounded p-2 border w-20 ${(isSimulating) ? "opacity-50" : ""}`}
					value={startingSpeed}
					onChange={e => handleSpeedChange(e.target.value)}
					disabled={isSimulating}
				/>
			</div>
			<div className="flex items-center gap-2 pb-2">
				<div className="w-26 whitespace-nowrap">Depot:</div>
				<input
					type="text"
					placeholder="Latitude"
				className={`bg-white rounded p-2 border grow ${(isSimulating) ? "opacity-50" : ""}`}
					value={depot.lat}
					onChange={e => handleDepotChange("lat", e.target.value)}
					disabled={isSimulating}
				/>
				<input
					type="text"
					placeholder="Longitude"
				className={`bg-white rounded p-2 border grow ${(isSimulating) ? "opacity-50" : ""}`}
					value={depot.long}
					onChange={e => handleDepotChange("long", e.target.value)}
					disabled={isSimulating}
				/>
			</div>			
		</>
	);
	
	
	
	// Render Long & Lat for Each Destination
	const renderDestinationInput = (id, label) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="w-26 whitespace-nowrap">{label}:</div>
			<input
				type="text"
				placeholder="Latitude"
				className={`bg-white rounded p-2 border grow ${(isSimulating) ? "opacity-50" : ""}`}
				value={destinations[id].lat}
				onChange={e => handleDestinationChange(id, "lat", e.target.value)}
				disabled={isSimulating}
			/>
			<input
				type="text"
				placeholder="Longitude"
				className={`bg-white rounded p-2 border grow ${(isSimulating) ? "opacity-50" : ""}`}
				value={destinations[id].long}
				onChange={e => handleDestinationChange(id, "long", e.target.value)}
				disabled={isSimulating}
			/>
		</div>
	);	



	// Render Planning Input
	const renderPlanningInput = (id, label, groupName, isReadOnly) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="min-w-20 whitespace-nowrap">{label}:</div>
			<select
				className={`grow bg-white w-12 rounded p-2 border ${(isReadOnly || isSimulating) ? "opacity-50" : ""}`}
				value={(groupName === "manual" && manualPlan?.[id]) ? manualPlan?.[id] : (groupName === "optimized" && optimizedPlan?.[id]) ? optimizedPlan?.[id] : (groupName === "heuristic" && heuristicPlan?.[id]) ? heuristicPlan?.[id] : ""}
				onChange={e => handlePlanningInputChange(id, e.target.value)}
				disabled={(isReadOnly || isSimulating)}
			>
				<option value="">{(isReadOnly) ? "TBD" : "Select"}</option>
				<option value="A">A</option>
				<option value="B">B</option>
				<option value="C">C</option>
				<option value="D">D</option>
			</select>
		</div>
	);



	// Render Simulation Input
	const renderSimulationInput = (id, label) =>
	( 
		<div className="flex items-center gap-2 pb-2">
			<div className="pe-4 whitespace-nowrap w-16">{label}:</div>
			<button className={`${(simulation.step !== id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-violet-600 text-white px-2 py-2 rounded grow`} disabled={(simulation.step > id)} onClick={() => simulate(id, false)}>
				Proceed
			</button>

			{(id <= 3)
			?
				<button className={`${(simulation.step !== id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-rose-600 text-white px-2 py-2 rounded grow`} disabled={(simulation.step > id)} onClick={() => simulate(id, true)}>
					Traffic
				</button>
			:
				null
			}
		</div>
	);



	// Handle Speed Cahnge
	const handleSpeedChange = (value) =>
	{
		let num = "";

		if (value !== "")
		{
			const parsed = Number(value);
			num = Number.isInteger(parsed) && parsed >= 0 ? parsed : "";
		}

		setStartingSpeed(num);
	};



	// Handle Depot Cahnge
	const handleDepotChange = (key, value) => {
		setDepot(prev => ({ ...prev, [key]: value }));
	};



	// Handle Destination Cahnge
	const handleDestinationChange = (id, key, value) => {
		setDestinations(prev => ({
			...prev,
			[id]: { ...prev[id], [key]: value },
		}));
	};



	// Handle  Planning Input Change
	const handlePlanningInputChange = (index, value) => {
		setManualPlan(prev => {
			const updated = [...prev];
			updated[index] = value;
			return updated;
		});
	};
	



	// Generate Sample Locations
	const generateSampleLocations = () => {

		// Scroll to top of page to view the map
		window.scrollTo({ top: 0, behavior: "smooth" });

		if(isSimulating)
		{
			alert("❌ Simulation started. Changes are not allowed");
		}
		else
		{
			// Set depot location to PSU :)
			handleDepotChange("lat", mapLat);
			handleDepotChange("long", mapLong);
	
	
			// Pick points near the depot for a realistic cluster
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
	
			setManualPlanData({});
			setOptimizedPlanData({});
			setManualPlan([]);
			setOptimizedPlan([]);
			setHeuristicPlan([]);
			setHeuristicPlanData([]);
		}
		
	};



	// Plan Manually
	const planManually = () =>
	{
		let distance = 0;
		let time	 = 0;
		let points   = [];
		let polyline = [];

		polyline.push({ lat: parseFloat(depot.lat), lng: parseFloat(depot.long) });

		manualPlan?.forEach(key => {
			points.push({ label: key, lat: destinations?.[key]?.lat, long: destinations?.[key]?.long })
			
			polyline.push({ lat: parseFloat(destinations?.[key]?.lat), lng: parseFloat(destinations?.[key]?.long) });
		});

		polyline.push({ lat: parseFloat(depot.lat), lng: parseFloat(depot.long) });

		if(isSimulating)
		{
			alert("❌ Simulation started. Changes are not allowed");
		}
		else if(!isValideSetOfCoordinates([...[{ label:"Depot", lat: depot?.lat, long: depot?.long }], ...points])) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else if (!isValideManualPlanning()) {
			alert("❌ You have to select 4 different destinations");
		}
		else
		{
			distance = calculateDistanceBetweenMultiPoints({ lat: depot?.lat, long: depot?.long }, points);
			
			if(typeof startingSpeed === 'number' && startingSpeed > 0)
			{
				if(distance > 0)
				{
					time = calculateTravelTimeInMinutes(distance, startingSpeed);
				}

				setManualPlanData({distance:distance, duration:time, polyline:polyline});

				alert(`✅ Planning Completed`);
			}
			else
			{
				alert("❌ Invalid starting speed");
			}
		}
	}



	// Plan Optimized
	async function planOptimized()
	{
		let points = [];

		points.push({label:"Depot", lat: depot?.lat, long: depot?.long });

		Object.keys(destinations)?.forEach(key => {
			points.push({ label: key, lat: destinations?.[key]?.lat, long: destinations?.[key]?.long })
		});

		if(isSimulating)
		{
			alert("❌ Simulation started. Changes are not allowed");
		}
		else if (!isValideSetOfCoordinates(points)) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else
		{
			let start 				  = toWaypoint([depot?.lat, depot?.long]);
			let end 				  = toWaypoint([depot?.lat, depot?.long]);
			let intermediates 		  = [];
			let unorderedDestinations = [];

			Object.keys(destinations)?.forEach(key => {
				intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
				unorderedDestinations.push(key)
			});

			setIsLoading(true);

			const route = await getPathFromGoogleAPI(start, intermediates, end, true);

			setIsLoading(false);

			if(route?.distanceMeters)
			{	
				let distance = route.distanceMeters * 0.001;
				let duration = Math.floor(parseInt(route?.duration?.replace("s", ""), 10)/60);
				let polyline = decodePolyline(route.polyline.encodedPolyline);
				let newOrder = route.optimizedIntermediateWaypointIndex?.map(i => unorderedDestinations?.[i]);

				setOptimizedPlan(newOrder);
				setHeuristicPlan(newOrder);
				setOptimizedPlanData({distance:distance, duration:duration, polyline:polyline});
				setHeuristicPlanData({distance:distance, duration:duration, polyline:polyline});
				
				alert("✅ Planning Completed");
			}
			else
			{
				alert("❌ Failed to reach Google Server");
			}			
		}
	}



	// Get optimized rout from Google Route API
	async function getPathFromGoogleAPI(start, intermediates, end, optimizeWaypointOrder=true)
	{
		const body = {
			origin: start,
			destination: end,
			intermediates: intermediates,
			travelMode: "DRIVE",
			// routingPreference: "TRAFFIC_AWARE",
			languageCode: "en-US",
			units: "METRIC",
			optimizeWaypointOrder:(optimizeWaypointOrder) ? "true" : "false"
		};

		const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes",
		{
			method: "POST",
			headers: {
			"Content-Type": "application/json",
			"X-Goog-Api-Key": process.env.NEXT_PUBLIC_MAP_API_KEY,
			"X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex"
			},
			body: JSON.stringify(body)
		});

  		const data = await res.json();

		if(data?.routes?.[0])
		{
			return data.routes[0];
		}
		else
		{
			return {};
		}
	};


	// Simulate
	async function simulate(id, foundTraffic)
	{
		if (!isValideManualPlanning()) {
			alert("❌ You should plan manually first");
		}
		else if (!isValideOptimizedPlanning()) {
			alert("❌ You should plan with optimization first");
		}		
		else
		{
			setIsLoading(true);

			setIsSimulating(true);

			setSimulation(prev => ({...prev, step: prev.step+1}));

			
			
			// reconstruct path based on steps
			let newPath = { manual:[...simulation.path.manual], optimized:[...simulation.path.optimized], heuristic:[...simulation.path.heuristic]};
			newPath.manual.push(manualPlan[id]);
			newPath.optimized.push(optimizedPlan[id]);



			// if there is traffic, heuristic should find next nearest location (other than the very next one)
			if(foundTraffic)
			{
				let start 				  = toWaypoint([depot.lat, depot.long]);
				let end 				  = toWaypoint([depot.lat, depot.long]);
				let intermediates 		  = [];
				let remainingDistinations = heuristicPlan.filter(item => !newPath.heuristic.includes(item));

				if(newPath.heuristic?.length > 0)
				{
					let key = newPath.heuristic?.[newPath.heuristic?.length -1];

					start = toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]);
				}

				remainingDistinations.forEach(key =>
				{
					intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
				});




				// Find next destination
				let nextDestination = undefined;

				if(intermediates.length > 2)
				{
					// exclude the very first
					intermediates?.shift();
					remainingDistinations?.shift();

					let newRoute = await getPathFromGoogleAPI(start, intermediates, end, true);
					
					let newOrder = newRoute.optimizedIntermediateWaypointIndex?.map(i => remainingDistinations?.[i]);

					nextDestination = newOrder[0];	
				}
				else if(intermediates.length == 2)
				{
					nextDestination = remainingDistinations[1];
				}
				else if(intermediates.length == 1)
				{
					nextDestination = remainingDistinations[0];
				}				



				newPath.heuristic.push(nextDestination);

				remainingDistinations = heuristicPlan.filter(item => !newPath.heuristic.includes(item));

				if(remainingDistinations?.length > 1)
				{				
					// Reorganize the remaining destinations based on the newly selected destination
					start = toWaypoint([destinations?.[nextDestination]?.lat, destinations?.[nextDestination]?.long]);
					end = toWaypoint([depot.lat, depot.long]);
					intermediates = [];

					remainingDistinations.forEach(key =>
					{
						intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
					});

					let newRoute = await getPathFromGoogleAPI(start, intermediates, end, true);
					
					let newOrder = newRoute.optimizedIntermediateWaypointIndex?.map(i => remainingDistinations?.[i]);

					setHeuristicPlan([...newPath.heuristic, ...newOrder]);
				}
				else
				{
					setHeuristicPlan([...newPath.heuristic, ...remainingDistinations]);
				}
			}
			else
			{
				newPath.heuristic.push(heuristicPlan[id]);
			}



			// Calculate distance, duration & polyline for manual, optimized & huristic
			let newDistance = { manual:0.0, optimized:0.0, heuristic:0.0};
			let newDuration = { manual:0.0, optimized:0.0, heuristic:0.0};
			let newPolyline = { manual:[], optimized:[], heuristic:[]};
			let newPenalty  = { manual:0.0, optimized:0.0, heuristic:0.0};

			if(newPath?.manual?.length > 0)
			{
				let start 		  = toWaypoint([depot.lat, depot.long]);
				let end   		  = (id === 4) ? toWaypoint([depot.lat, depot.long]) : toWaypoint([destinations[newPath?.manual[newPath?.manual?.length-1]]?.lat, destinations[newPath?.manual[newPath?.manual?.length-1]]?.long]);
				let intermediates = [];
				let penalty = 0;

				if(foundTraffic)
				{
					penalty = trafficPenalty;
				}

				newPath?.manual.forEach(key =>
				{
					intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
				});

				intermediates.pop();

				let actualRoute = await getPathFromGoogleAPI(start, intermediates, end, false);

				newDistance.manual = actualRoute?.distanceMeters * 0.001;
				newDuration.manual = Math.floor(parseInt(actualRoute?.duration?.replace("s", ""), 10)/60) + penalty + simulation?.penalty?.manual;
				newPolyline.manual = decodePolyline(actualRoute.polyline.encodedPolyline);	
				newPenalty.manual  = penalty + simulation?.penalty?.manual;
			}

			if(newPath?.optimized?.length > 0)
			{
				let start 		  = toWaypoint([depot.lat, depot.long]);
				let end   		  = (id === 4) ? toWaypoint([depot.lat, depot.long]) : toWaypoint([destinations[newPath?.optimized[newPath?.optimized?.length-1]]?.lat, destinations[newPath?.optimized[newPath?.optimized?.length-1]]?.long]);
				let intermediates = [];
				let penalty = 0;

				if(foundTraffic)
				{
					penalty = trafficPenalty;
				}

				newPath?.optimized.forEach(key =>
				{
					intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
				});

				intermediates.pop();


				let actualRoute = await getPathFromGoogleAPI(start, intermediates, end, false);


				newDistance.optimized = actualRoute?.distanceMeters * 0.001;
				newDuration.optimized = Math.floor(parseInt(actualRoute?.duration?.replace("s", ""), 10)/60)  + penalty + simulation?.penalty?.optimized;
				newPolyline.optimized = decodePolyline(actualRoute.polyline.encodedPolyline);			
				newPenalty.optimized  = penalty + simulation?.penalty?.optimized;		
			}

			if(newPath?.heuristic?.length > 0)
			{
				let start 		  = toWaypoint([depot.lat, depot.long]);
				let end   		  = (id === 4) ? toWaypoint([depot.lat, depot.long]) : toWaypoint([destinations[newPath?.heuristic[newPath?.heuristic?.length-1]]?.lat, destinations[newPath?.heuristic[newPath?.heuristic?.length-1]]?.long]);
				let intermediates = [];

				newPath?.heuristic.forEach(key =>
				{
					intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
				});

				intermediates.pop();

				let actualRoute = await getPathFromGoogleAPI(start, intermediates, end, false);

				newDistance.heuristic = actualRoute?.distanceMeters * 0.001;
				newDuration.heuristic = Math.floor(parseInt(actualRoute?.duration?.replace("s", ""), 10)/60);
				newPolyline.heuristic = decodePolyline(actualRoute.polyline.encodedPolyline);					
			}

			


			// Update Values 
			setSimulation(prev => ({ ...prev, path: newPath }));
			setSimulation(prev => ({ ...prev, distance: newDistance }));
			setSimulation(prev => ({ ...prev, duration: newDuration }));
			setSimulation(prev => ({ ...prev, polyline: newPolyline }));
			setSimulation(prev => ({ ...prev, penalty: newPenalty }));


			setIsLoading(false);
		}
	};



	// Helper: Validate Coordinates of any given destination (point)
	const isValideSetOfCoordinates = (points) =>
	{
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
	
	

	// Helper: Validate Manual Planning
	const isValideManualPlanning = () =>
	{
		const uniqueValues = new Set(manualPlan.filter(v => v !== "" && v != null));

		return (Array.isArray(manualPlan) && manualPlan.length === 4 && uniqueValues.size === manualPlan.length)
	};



	// Helper: Validate Optimized Planning
	const isValideOptimizedPlanning = () =>
	{
		const uniqueValues = new Set(optimizedPlan.filter(v => v !== "" && v != null));

		return (Array.isArray(optimizedPlan) && optimizedPlan.length === 4 && uniqueValues.size === optimizedPlan.length)
	};



	// Helper: Calculate Distance in KM Between Multiple Points
	const calculateDistanceBetweenMultiPoints = (origin, destinations) =>
	{
		if (!origin || !Array.isArray(destinations) || destinations.length === 0) {
			return 0;
		}

		// Build full route (start + all destinations + return to origin)
		const fullRoute = [origin, ...destinations, origin];
		
		let totalKm = 0;

		for (let i = 0; i < fullRoute.length - 1; i++)
		{
			totalKm += calculateDistanceBetweenTwoPoints(fullRoute[i], fullRoute[i + 1]);
		}

		return totalKm;
	}



	// Helper: Calculate Distance in KM Between 2 Points
	const calculateDistanceBetweenTwoPoints = (a, b) =>
	{
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



	// Helper: Calculate Travel Time
	const calculateTravelTimeInMinutes = (distance, speed) =>
	{
		const totalTimeHrs = speed > 0 ? distance / speed : 0;
		const totalTimeMins = totalTimeHrs * 60;

		return totalTimeMins;
	};



	// Render FULL HTML
	return isLoaded ? (
		<div className="flex flex-col gap-5 p-5">
			
			{(isLoading) ?
				<div className="fixed flex justify-center items-center bg-white opacity-90 w-full h-full z-50 top-0 left-0">
					<img src="/loading.gif" width="40" height="40" alt="dynamic image"/>
				</div>
			:
				null
			}
			
			<div className="fixed z-50 right-8 top-8">
				<button onClick={() => { window.location.reload()}} className="bg-white text-gray-500 px-4 py-2 rounded cursor-pointer">
					Reset
				</button>
			</div>

			<div className="w-full h-[430px]">
				<GoogleMap
					id={"google-map-view"}
					zoom={11}
					ref={mapRef}
					options={mapOptions}
					mapContainerStyle={{ width: '100%', height: '100%' }}
					center={{ lat: parseFloat(mapLat), lng: parseFloat(mapLong) }}
				>
					{(!isSimulating && manualPlanData?.polyline)
					?
						null//<Polyline path={manualPlanData?.polyline} options={{...polylineOptions, ...{fillColor: "#53A000",strokeColor: "#53A000"}}}/>
					:
						null
					}

					{(!isSimulating && OptimizedPlanData?.polyline)
					?
						null//<Polyline path={OptimizedPlanData?.polyline} options={{...polylineOptions, ...{fillColor: "#0000ff",strokeColor: "#0000ff"}}}/>
					:
						null
					}	

					
					{(isSimulating && simulation?.polyline?.manual)
					?
						<Polyline path={simulation?.polyline?.manual} options={{...polylineOptions, ...{fillColor: "#53A000",strokeColor: "#53A000"}}}/>
					:
						null
					}

					{(isSimulating && simulation?.polyline?.optimized)
					?
						<Polyline path={simulation?.polyline?.optimized} options={{...polylineOptions, ...{fillColor: "#0000ff",strokeColor: "#0000ff"}}}/>
					:
						null
					}								

					{(isSimulating && simulation?.polyline?.heuristic)
					?
						<Polyline path={simulation?.polyline?.heuristic} options={{...polylineOptions, ...{fillColor: "#ff0000",strokeColor: "#ff0000"}}}/>
					:
						null
					}	

					<Marker key={"point_depot"}
					>
						<InfoWindow position={{ lat: parseFloat(depot?.lat), lng: parseFloat(depot?.long) }} options={infoOptions} >
							<div className="px-[9px] py-2 text-white" style={{backgroundColor:"#000000"}}>⭐</div>
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


			<div className="flex flex-row gap-5">



				<div className="w-[2/6]">
					<div className="flex flex-col h-full">							
						<div className="font-bold bg-amber-200 p-4">
							Step 1: Destinations
						</div>
						<div className="bg-amber-100 p-4">
							{renderDepotAndInitialSpeed()}
							{renderDestinationInput("A", "Destination A")}
							{renderDestinationInput("B", "Destination B")}
							{renderDestinationInput("C", "Destination C")}
							{renderDestinationInput("D", "Destination D")}
						</div>
						<div className="grow bg-amber-100 px-4 pb-4">
							<div className="flex justify-end pt-2">
								<button onClick={generateSampleLocations} className={`${(isSimulating) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-black text-white px-4 py-2 rounded`} disabled={(isSimulating)}>
									Generate Sample
								</button>
							</div>
						</div>
					</div>
				</div>


				<div className="flex flex-row gap-5 grow">



					<div className="w-[25%] flex flex-col">
						<div className="font-bold bg-amber-200 p-4">
							Step 2: Manual Planning
						</div>
						<div className="bg-amber-100 p-4 grow">
							{renderPlanningInput(0, "Trip 1", "manual", false)}
							{renderPlanningInput(1, "Trip 2", "manual", false)}
							{renderPlanningInput(2, "Trip 3", "manual", false)}
							{renderPlanningInput(3, "Trip 4", "manual", false)}	
							
							{(manualPlanData?.distance) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Distance:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(manualPlanData?.distance*100)/100}
										disabled={true}
									/>	
									<div className="w-8">km</div>
								</div>
							:
								null
							}

							{(manualPlanData?.duration) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Duration:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(manualPlanData?.duration*100)/100}
										disabled={true}
									/>	
									<div className="w-8">min</div>
								</div>									
							:
								null
							}	
						</div>
						{(isSimulating)
						?
							<div className="bg-amber-200 p-4 grow">
								{(simulation?.distance?.manual) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Distance:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.distance?.manual*100)/100}
											disabled={true}
										/>	
										<div className="w-8">km</div>
									</div>
								:
									null
								}

								{(simulation?.duration?.manual) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Duration:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.duration?.manual*100)/100}
											disabled={true}
										/>	
										<div className="w-8">min</div>
									</div>									
								:
									null
								}							
							</div>
						:
							null
						}

						{(!isSimulating)
						?
							<div className="bg-amber-100 px-4 pb-4">												
								<div className="flex justify-end pt-2">
									<button onClick={planManually} className={`${(isSimulating) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-green-600 text-white px-8 py-2 rounded`} disabled={(isSimulating)}>
										Plan
									</button>
								</div>										
							</div>
						:
							null
						}	

					</div>	



					<div className="w-[25%] flex flex-col">
						<div className="font-bold bg-amber-200 p-4">
							Step 3: Optimized Planning
						</div>
						<div className="bg-amber-100 p-4 grow">
							{renderPlanningInput(0, "Trip 1", "optimized", true)}
							{renderPlanningInput(1, "Trip 2", "optimized", true)}
							{renderPlanningInput(2, "Trip 3", "optimized", true)}
							{renderPlanningInput(3, "Trip 4", "optimized", true)}	

							{(OptimizedPlanData?.distance) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Distance:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(OptimizedPlanData?.distance*100)/100}
										disabled={true}
									/>	
									<div className="w-8">km</div>
								</div>
							:
								null
							}

							{(OptimizedPlanData?.duration) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Duration:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(OptimizedPlanData?.duration*100)/100}
										disabled={true}
									/>	
									<div className="w-8">min</div>
								</div>									
							:
								null
							}	
						</div>
						{(isSimulating)
						?
							<div className="bg-amber-200 p-4 grow">
								{(simulation?.distance?.optimized) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Distance:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.distance?.optimized*100)/100}
											disabled={true}
										/>	
										<div className="w-8">km</div>
									</div>
								:
									null
								}

								{(simulation?.duration?.optimized) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Duration:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.duration?.optimized*100)/100}
											disabled={true}
										/>	
										<div className="w-8">min</div>
									</div>									
								:
									null
								}														
							</div>
						:
							null
						}

						{(!isSimulating)
						?
							<div className="bg-amber-100 px-4 pb-4">												
								<div className="flex justify-end pt-2">
									<button onClick={planOptimized} className={`${(isSimulating) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-blue-600 text-white px-8 py-2 rounded`} disabled={(isSimulating)}>
										Plan
									</button>
								</div>										
							</div>	
						:
							null
						}					
					</div>	




					<div className="w-[25%] flex flex-col">
						<div className="font-bold bg-amber-200 p-4">
							Step 4: Heuristic Planning
						</div>
						<div className="bg-amber-100 p-4 grow">
							{renderPlanningInput(0, "Trip 1", "heuristic", true)}
							{renderPlanningInput(1, "Trip 2", "heuristic", true)}
							{renderPlanningInput(2, "Trip 3", "heuristic", true)}
							{renderPlanningInput(3, "Trip 4", "heuristic", true)}	

							{(heuristicPlanData?.distance) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Distance:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(heuristicPlanData?.distance*100)/100}
										disabled={true}
									/>	
									<div className="w-8">km</div>
								</div>
							:
								null
							}

							{(heuristicPlanData?.duration) ? 
								<div className="flex items-center gap-2 pb-2">
									<div className="whitespace-nowrap w-20">Duration:</div>
									<input
										type="text"
										className="bg-white rounded p-2 border grow opacity-50 w-12"
										value={Math.round(heuristicPlanData?.duration*100)/100}
										disabled={true}
									/>	
									<div className="w-8">min</div>
								</div>									
							:
								null
							}
						</div>
						{(isSimulating)
						?
							<div className="bg-amber-200 p-4 grow">
								{(simulation?.distance?.heuristic) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Distance:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.distance?.heuristic*100)/100}
											disabled={true}
										/>	
										<div className="w-8">km</div>
									</div>
								:
									null
								}

								{(simulation?.duration?.heuristic) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap w-20">Duration:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50 w-12"
											value={Math.round(simulation?.duration?.heuristic*100)/100}
											disabled={true}
										/>	
										<div className="w-8">min</div>
									</div>									
								:
									null
								}
							</div>
						:
							null
						}
					</div>	



					<div className="w-[25%] flex flex-col">
						<div className="font-bold bg-amber-200 p-4">
							Step 5: Simulation
						</div>
						<div className="bg-amber-100 p-4 grow">
							{renderSimulationInput(0, "Trip 1")}
							{renderSimulationInput(1, "Trip 2")}
							{renderSimulationInput(2, "Trip 3")}
							{renderSimulationInput(3, "Trip 4")}	
							{renderSimulationInput(4, "Trip 5")}	
						</div>						
					</div>



				</div>


			</div>
		</div>
	) : (<></>);
}