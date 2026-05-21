"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Particles({ count = 120 }: { count?: number }) {
	const ref = useRef<THREE.Points>(null!);

	const positions = useMemo(() => {
		const arr = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			arr[i * 3]     = (Math.random() - 0.5) * 14;
			arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
			arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
		}
		return arr;
	}, [count]);

	useFrame((state) => {
		const t = state.clock.getElapsedTime();
		ref.current.rotation.y = t * 0.04;
		ref.current.rotation.x = Math.sin(t * 0.02) * 0.08;
	});

	return (
		<Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
			<PointMaterial
				transparent
				color="#6ee7b7"
				size={0.08}
				sizeAttenuation
				depthWrite={false}
				opacity={0.75}
			/>
		</Points>
	);
}

function Edges({ count = 120 }: { count?: number }) {
	const ref = useRef<THREE.LineSegments>(null!);

	const { geometry } = useMemo(() => {
		const nodes: [number, number, number][] = [];
		for (let i = 0; i < count; i++) {
			nodes.push([
				(Math.random() - 0.5) * 14,
				(Math.random() - 0.5) * 10,
				(Math.random() - 0.5) * 8,
			]);
		}

		const positions: number[] = [];
		for (let i = 0; i < count; i++) {
			for (let j = i + 1; j < count; j++) {
				const dx = nodes[i][0] - nodes[j][0];
				const dy = nodes[i][1] - nodes[j][1];
				const dz = nodes[i][2] - nodes[j][2];
				const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
				if (dist < 3.5) {
					positions.push(...nodes[i], ...nodes[j]);
				}
			}
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
		return { geometry: geo };
	}, [count]);

	useFrame((state) => {
		const t = state.clock.getElapsedTime();
		ref.current.rotation.y = t * 0.04;
		ref.current.rotation.x = Math.sin(t * 0.02) * 0.08;
	});

	return (
		<lineSegments ref={ref} geometry={geometry}>
			<lineBasicMaterial color="#14b8a6" transparent opacity={0.28} />
		</lineSegments>
	);
}

export default function NodeGraph() {
	return (
		<Canvas
			camera={{ position: [0, 0, 10], fov: 60 }}
			gl={{ antialias: true, alpha: true }}
			style={{ position: "absolute", inset: 0 }}
		>
			<ambientLight intensity={0.5} />
			<Particles count={140} />
			<Edges count={140} />
		</Canvas>
	);
}
