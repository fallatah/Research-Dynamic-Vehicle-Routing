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



	// Set PSU to be Depot :)
	const mapLat = 24.737513266445525;
	const mapLong = 46.698268964794934;	



	// Road speed in KPH
	const [startingSpeed, setStartingSpeed] = useState(20.0);

	
	

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



	// Google Map Setup
	const mapRef = useRef(null);

	const { isLoaded } = useJsApiLoader(
	{
		id: "google-map-view",
		googleMapsApiKey: `${process.env.NEXT_PUBLIC_MAP_API_KEY}`
	});


    const manualPolylineOptions =
    {
        fillColor: "#53A000",
        strokeColor: "#53A000",
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWeight: 5,
        clickable: false,
        draggable: false,
        editable: false,
        geodesic: false,
        zIndex: 1,
    };

    const optimizedPolylineOptions =
    {
        fillColor: "#0000ff",
        strokeColor: "#0000ff",
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
				<div className="w-32 whitespace-nowrap">Speed Limit (km):</div>
				<input
					type="text"
					placeholder="Speed"
					className="bg-white rounded p-2 border w-24"
					value={startingSpeed}
					onChange={e => handleSpeedChange(e.target.value)}
				/>
			</div>
			<div className="flex items-center gap-2 pb-2">
				<div className="w-32 whitespace-nowrap">Depot:</div>
				<input
					type="text"
					placeholder="Latitude"
					className="bg-white rounded p-2 border grow"
					value={depot.lat}
					onChange={e => handleDepotChange("lat", e.target.value)}
				/>
				<input
					type="text"
					placeholder="Longitude"
					className="bg-white rounded p-2 border grow"
					value={depot.long}
					onChange={e => handleDepotChange("long", e.target.value)}
				/>
			</div>			
		</>
	);
	
	
	
	// Render Long & Lat for Each Destination
	const renderDestinationInput = (id, label) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="w-32 whitespace-nowrap">{label}:</div>
			<input
				type="text"
				placeholder="Latitude"
				className="bg-white rounded p-2 border grow"
				value={destinations[id].lat}
				onChange={e => handleDestinationChange(id, "lat", e.target.value)}
			/>
			<input
				type="text"
				placeholder="Longitude"
				className="bg-white rounded p-2 border grow"
				value={destinations[id].long}
				onChange={e => handleDestinationChange(id, "long", e.target.value)}
			/>
		</div>
	);	



	// Render Manual Planning Input
	const renderPlanningInput = (id, label, groupName, isReadOnly) => (
		<div className="flex items-center gap-2 pb-2">
			<div className="min-w-20 whitespace-nowrap">{label}:</div>
			<select
				className={`grow bg-white rounded p-2 border w-48 ${(isReadOnly) ? "opacity-50" : ""}`}
				value={(groupName === "manual" && manualPlan?.[id]) ? manualPlan?.[id] : (groupName === "optimized" && optimizedPlan?.[id]) ? optimizedPlan?.[id] : ""}
				onChange={e => handlePlanningInputChange(id, e.target.value)}
				disabled={isReadOnly}
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
			<div className="pe-4 whitespace-nowrap">{label}:</div>
			<button className="bg-violet-600 text-white px-2 py-2 rounded cursor-pointer" onClick={() => simulate(id, true)}>
				Proceed
			</button>

			{(id <= 3)
			?
				<button className="bg-rose-600 text-white px-2 py-2 rounded cursor-pointer" onClick={() => simulate(id, false)}>
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
	

	
	// Handle Destination Cahnge
	const handlePlanningDataChange = () => {
		// to do
	};



	// Generate Sample Locations
	const generateSampleLocations = () => {

		// Scroll to top of page to view the map
		window.scrollTo({ top: 0, behavior: "smooth" });

		
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

		handlePlanningDataChange();

		setManualPlanData({})
		setOptimizedPlanData({})
		setManualPlan([]);
		setOptimizedPlan([]);
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

		if (!isValideSetOfCoordinates([...[{ label:"Depot", lat: depot?.lat, long: depot?.long }], ...points])) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else if (!isValideManualPlanning()) {
			alert("❌ You have to select 4 different destinations");
		}
		else {

			distance = calculateDistanceBetweenMultiPoints({ lat: depot?.lat, long: depot?.long }, points);
			
			if(typeof startingSpeed === 'number' && startingSpeed > 0)
			{
				if(distance > 0)
				{
					time = calculateTravelTimeInMinutes(distance, startingSpeed);
				}

				setManualPlanData({distance:distance, duration:time, polyline:polyline})

				alert(`✅ Planning Completed`);
			}
			else
			{
				alert("❌ Invalid starting speed");
			}
		}
	}



	// Plan Optimized
	const planOptimized = () =>
	{
		let points = [];

		points.push({label:"Depot", lat: depot?.lat, long: depot?.long });

		Object.keys(destinations)?.forEach(key => {
			points.push({ label: key, lat: destinations?.[key]?.lat, long: destinations?.[key]?.long })
		});

		if (!isValideSetOfCoordinates(points)) {
			alert("❌ Invalid Latitude/Longitude Values");
		}
		else {
			getOptimizedRouteUsingHTTPs();
		}
	}	



	// Get optimized rout using HTTPs
	async function getOptimizedRouteUsingHTTPs()
	{
		setIsLoading(true);

		const toWaypoint = ([lat, lng]) => ({
			location: { latLng: { latitude: lat, longitude: lng } }
		});

		let intermediates = [];
		let unorderedDestinations = [];

		Object.keys(destinations)?.forEach(key => {
			intermediates.push(toWaypoint([destinations?.[key]?.lat, destinations?.[key]?.long]));
			unorderedDestinations.push(key)
		});

		const body = {
			origin: toWaypoint([depot?.lat, depot?.long]),
			destination: toWaypoint([depot?.lat, depot?.long]),
			intermediates: intermediates,
			travelMode: "DRIVE",
			// routingPreference: "TRAFFIC_AWARE",
			languageCode: "en-US",
			units: "METRIC",
			optimizeWaypointOrder:"true"
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

		setIsLoading(false);

		if(data?.routes[0])
		{
			const route = data.routes[0];
	
			let distance = route.distanceMeters * 0.001;
			let duration = Math.floor(parseInt(route?.duration?.replace("s", ""), 10)/60);
			let polyline = decodePolyline(route.polyline.encodedPolyline);
			let newOrder = route.optimizedIntermediateWaypointIndex?.map(i => unorderedDestinations?.[i]);

			setOptimizedPlan(newOrder);
			setOptimizedPlanData({distance:distance, duration:duration, polyline:polyline})
			
			alert("✅ Planning Completed");
		}
		else
		{
			alert("❌ Failed to reach Google Server");
		}
	};



	// Simulate
	const simulate = (trip, shouldProceed) =>
	{
		if (!isValideManualPlanning()) {
			alert("❌ You should plan manually first");
		}
		else if (!isValideOptimizedPlanning()) {
			alert("❌ You should plan with optimization first");
		}		
		else {

			// To Do

			alert("✅ Simulation Completed");
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
				<></>
			}
			
			
			<div className="w-full h-[450px]">
				<GoogleMap
					id={"google-map-view"}
					zoom={11}
					ref={mapRef}
					options={mapOptions}
					mapContainerStyle={{ width: '100%', height: '100%' }}
					center={{ lat: parseFloat(mapLat), lng: parseFloat(mapLong) }}
				>
					{(manualPlanData?.polyline)
					?
						<Polyline path={manualPlanData?.polyline} options={manualPolylineOptions}/>
					:
						null
					}

					{(OptimizedPlanData?.polyline)
					?
						<Polyline path={OptimizedPlanData?.polyline} options={optimizedPolylineOptions}/>
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


			<div>
				<div className="flex flex-row gap-5">



					<div className="grow">
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
									<button onClick={generateSampleLocations} className="bg-black text-white px-4 py-2 rounded cursor-pointer">
										Generate Sample
									</button>
								</div>
							</div>
						</div>
					</div>


					<div className="flex flex-row gap-5">
						<div className="grow flex flex-col">
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
										<div className="whitespace-nowrap min-w-20">Distance:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50"
											value={Math.round(manualPlanData?.distance*100)/100}
											disabled={true}
										/>	
										<div className="w-8">km</div>
									</div>
								:
									<></>
								}

								{(manualPlanData?.duration) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap min-w-20">Duration:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50"
											value={Math.round(manualPlanData?.duration*100)/100}
											disabled={true}
										/>	
										<div className="w-8">min</div>
									</div>									
								:
									<></>
								}								
							</div>
							<div className="bg-amber-100 px-4 pb-4">												
								<div className="flex justify-end pt-2">
									<button onClick={planManually} className="bg-green-600 text-white px-8 py-2 rounded cursor-pointer">
										Plan
									</button>
								</div>										
							</div>		
						</div>	



						<div className="grow flex flex-col">
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
										<div className="whitespace-nowrap min-w-20">Distance:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50"
											value={Math.round(OptimizedPlanData?.distance*100)/100}
											disabled={true}
										/>	
										<div className="w-8">km</div>
									</div>
								:
									<></>
								}

								{(OptimizedPlanData?.duration) ? 
									<div className="flex items-center gap-2 pb-2">
										<div className="whitespace-nowrap min-w-20">Duration:</div>
										<input
											type="text"
											className="bg-white rounded p-2 border grow opacity-50"
											value={Math.round(OptimizedPlanData?.duration*100)/100}
											disabled={true}
										/>	
										<div className="w-8">min</div>
									</div>									
								:
									<></>
								}								
							</div>
							<div className="bg-amber-100 px-4 pb-4">												
								<div className="flex justify-end pt-2">
									<button onClick={planOptimized} className="bg-blue-600 text-white px-8 py-2 rounded cursor-pointer">
										Plan
									</button>
								</div>										
							</div>						
						</div>	



						<div className="grow flex flex-col">
							<div className="font-bold bg-amber-200 p-4">
								Step 4: Simulation
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
		</div>
	) : (<></>);
}