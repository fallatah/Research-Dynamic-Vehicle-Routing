"use client";

import { useState } from "react";

export default function Home()
{
	const [customerLatA, setcustomerLatA] = useState("");
	const [customerLongA, setcustomerLongA] = useState("");
	const [customerLatB, setcustomerLatB] = useState("");
	const [customerLongB, setcustomerLongB] = useState("");
	const [customerLatC, setcustomerLatC] = useState("");
	const [customerLongC, setcustomerLongC] = useState("");
	const [customerLatD, setcustomerLatD] = useState("");
	const [customerLongD, setcustomerLongD] = useState("");

	const isValidLatitude = (val) =>
	{
		if (!val && val !== 0) return false;

		const n = parseFloat(val);

		return !isNaN(n) && n >= -90 && n <= 90;
	};

	const isValidLongitude = (val) =>
	{
		if (!val && val !== 0) return false;
		
		const n = parseFloat(val);
		
		return !isNaN(n) && n >= -180 && n <= 180;
	};

	const performPreplanned = () =>
	{
		const coords =
		[
			{ label: "A", lat: customerLatA, long: customerLongA },
			{ label: "B", lat: customerLatB, long: customerLongB },
			{ label: "C", lat: customerLatC, long: customerLongC },
			{ label: "D", lat: customerLatD, long: customerLongD },
		];

		for (const { label, lat, long } of coords)
		{
			if(!isValidLatitude(lat))
			{
				alert(`Invalid latitude for point ${label}`);
				return false;
			}
			if(!isValidLongitude(long))
			{
				alert(`Invalid longitude for point ${label}`);
				return false;
			}
		}

		alert("All coordinates are valid!");
	};

	const performReactive = () =>
	{
		const coords =
		[
			{ label: "A", lat: customerLatA, long: customerLongA },
			{ label: "B", lat: customerLatB, long: customerLongB },
			{ label: "C", lat: customerLatC, long: customerLongC },
			{ label: "D", lat: customerLatD, long: customerLongD },
		];

		for (const { label, lat, long } of coords)
		{
			if(!isValidLatitude(lat))
			{
				alert(`Invalid latitude for point ${label}`);
				return false;
			}
			if(!isValidLongitude(long))
			{
				alert(`Invalid longitude for point ${label}`);
				return false;
			}
		}

		alert("All coordinates are valid!");		
	};	

	return (
		<div className="p-4">
			<div className="mb-4">
				<h1 className="text-4xl font-semibold">DVR Research</h1>
			</div>

			<div className="mb-12">
				<div className="mb-2">
					<h2 className="text-2xl font-semibold">1. Customer Details</h2>
				</div>

				<div className="flex items-center space-x-4 mb-4">
					<div className="w-7 h-7 rounded-full items-center flex justify-center bg-white text-center">
						<lable>A</lable>
					</div>
					<div>
						<input type="text" placeholder="Latitude..." className="bg-white rounded p-2" value={customerLatA} onChange={(e) => setcustomerLatA(e.target.value)}/>
					</div>
					<div>
						<input type="text" placeholder="Longitude..." className="bg-white rounded p-2" value={customerLongA} onChange={(e) => setcustomerLongA(e.target.value)}/>
					</div>
				</div>

				<div className="flex items-center space-x-4 mb-4">
					<div className="w-7 h-7 rounded-full items-center flex justify-center bg-white text-center">
						<lable>B</lable>
					</div>
					<div>
						<input type="text" placeholder="Latitude..." className="bg-white rounded p-2" value={customerLatB} onChange={(e) => setcustomerLatB(e.target.value)}/>
					</div>
					<div>
						<input type="text" placeholder="Longitude..." className="bg-white rounded p-2" value={customerLongB} onChange={(e) => setcustomerLongB(e.target.value)}/>
					</div>
				</div>

				<div className="flex items-center space-x-4 mb-4">
					<div className="w-7 h-7 rounded-full items-center flex justify-center bg-white text-center">
						<lable>C</lable>
					</div>
					<div>
						<input type="text" placeholder="Latitude..." className="bg-white rounded p-2" value={customerLatC} onChange={(e) => setcustomerLatC(e.target.value)}/>
					</div>
					<div>
						<input type="text" placeholder="Longitude..." className="bg-white rounded p-2" value={customerLongC} onChange={(e) => setcustomerLongC(e.target.value)}/>
					</div>
				</div>

				<div className="flex items-center space-x-4 mb-4">
					<div className="w-7 h-7 rounded-full items-center flex justify-center bg-white text-center">
						<lable>D</lable>
					</div>
					<div>
						<input type="text" placeholder="Latitude..." className="bg-white rounded p-2" value={customerLatD} onChange={(e) => setcustomerLatD(e.target.value)}/>
					</div>
					<div>
						<input type="text" placeholder="Longitude..." className="bg-white rounded p-2" value={customerLongD} onChange={(e) => setcustomerLongD(e.target.value)}/>
					</div>
				</div>												

			</div>

			<div className="mb-12">
				<div>
					<h2 className="text-2xl font-semibold">2. Manual Routing</h2>
				</div>
				<div>
					<button onClick={performPreplanned} className="bg-black text-white p-2 rounded">Show Alert</button>
				</div>
			</div>

			<div>
				<div>
					<h2 className="text-2xl font-semibold">3. Dynamic Routing</h2>
				</div>
				<div>
					<button onClick={performReactive} className="bg-black text-white p-2 rounded">Show Alert</button>
				</div>				
			</div>
		</div>
	);
}
