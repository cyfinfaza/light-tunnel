import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Sky } from "three/examples/jsm/objects/Sky";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";

let scene,
	camera,
	renderer,
	controls,
	container,
	windowWidth,
	windowHeight,
	clock,
	mouseX = 0,
	mouseY = 0;

function initCore() {
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
	scene = new THREE.Scene();
	window.scene = scene;
	// scene.background = new THREE.Color(0xdddddd);
	camera = new THREE.PerspectiveCamera(
		100,
		windowWidth / windowHeight,
		0.1,
		1000
	);
	camera.position.set(0, 2.5, 0);
	camera.rotation.set(0, Math.PI, 0);
	camera.desiredPosition = { x: 0, y: 2.5, z: 0 };
	camera.tick = delta => {
		camera.position.z = avatar.position.z - 5;
		camera.desiredPosition.y = (1 - mouseY / windowHeight) * 4 + 0.5;
		camera.desiredPosition.x = (1 - mouseX / windowWidth) * 5 - 2.5;
		asymptoticPosition(camera, { x: 15, y: 15 }, delta);
		// camera.lookAt(avatar.position);
	};
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.shadowMapEnabled = true;
	renderer.setSize(windowWidth, windowHeight);
	renderer.setPixelRatio(window.devicePixelRatio);
	window.addEventListener("resize", _ => {
		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;
		renderer.setSize(windowWidth, windowHeight);
		camera.aspect = windowWidth / windowHeight;
		camera.updateProjectionMatrix();
	});
	container.appendChild(renderer.domElement);
	// controls = new OrbitControls(camera, renderer.domElement);
	RectAreaLightUniformsLib.init();
	clock = new THREE.Clock();
}

function asymptoticUpdate(desired, current, weight, delta) {
	const diff = desired - current;
	return current + diff / weight;
}
function asymptoticPosition(object, weights, delta) {
	for (let i = 0; i < Object.keys(weights).length; i++) {
		const axis = Object.keys(weights)[i];
		object.position[axis] = asymptoticUpdate(
			object.desiredPosition[axis],
			object.position[axis],
			weights[axis],
			delta
		);
	}
}

function loop() {
	renderer.render(scene, camera);
	// requestAnimationFrame(loop);
	const dt = clock.getDelta();
	for (let i = 0; i < scene.children.length; i++) {
		const child = scene.children[i];
		if (child.tick) {
			child.tick(dt);
		}
	}
	camera.tick(dt);
}

const RECTLIGHT_PADDING = 1;
function makeRectLight(ind, color) {
	const rectLight = new THREE.RectAreaLight(color, 3, 5, 5);
	rectLight.position.set(
		0,
		4.9,
		2.5 + RECTLIGHT_PADDING + ind * (5 + RECTLIGHT_PADDING)
	);
	rectLight.rotation.set(Math.PI / -2, 0, 0);
	scene.add(rectLight);
	scene.add(new RectAreaLightHelper(rectLight));
	// const pointLight = new THREE.PointLight(color, 1, 10);
	// pointLight.position.set(
	// 	0,
	// 	4.9,
	// 	2.5 + RECTLIGHT_PADDING + ind * (5 + RECTLIGHT_PADDING)
	// );
	// scene.add(pointLight);
	return rectLight;
}

function lighting() {
	for (let i = 0; i < 10; i++) {
		makeRectLight(i, Math.random() * 0xffffff);
	}
}

let avatar;

function initScene() {
	avatar = new THREE.Mesh(
		new THREE.ConeGeometry(),
		new THREE.MeshStandardMaterial({
			color: 0xffffff,
			metalness: 0.8,
			roughness: 0.25,
		})
	);
	avatar.position.set(0, 2.5, 2.5);
	avatar.desiredPosition = { x: 0, y: 0, z: 2.5 };
	avatar.castShadow = true;
	avatar.tick = delta => {
		avatar.desiredPosition.y = (1 - mouseY / windowHeight) * 4 + 0.5;
		avatar.desiredPosition.x = (1 - mouseX / windowWidth) * 5 - 2.5;
		asymptoticPosition(avatar, { x: 2, y: 2, z: 25 }, delta);
		// asymptoticPosition(avatar, { z: 25 }, delta);
	};
	// setInterval(() => {
	// 	object.desiredPosition.z = object.desiredPosition.z == 2.5 ? 50 : 2.5;
	// }, 2000);
	scene.add(avatar);
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
	scene.add(hemiLight);
	const ptLight = new THREE.PointLight(0xffffff, 0.8);
	ptLight.position.z = 10;
	ptLight.position.y = 10;
	// scene.add(ptLight);
	// const fog = new THREE.Fog(0xdddddd, 0, 100);
	// scene.fog = fog;
	const tunnel = new THREE.Mesh(
		new THREE.BoxGeometry(8, 5, 100),
		new THREE.MeshStandardMaterial({
			color: 0x888888,
			metalness: 0.5,
			roughness: 0.5,
			side: THREE.BackSide,
		})
	);
	tunnel.position.set(0, 2.5, 50);
	tunnel.receiveShadow = true;
	scene.add(tunnel);
	// const ground = new THREE.Mesh(
	// 	new THREE.BoxGeometry(2000, 0.1, 2000),
	// 	new THREE.MeshStandardMaterial({
	// 		color: 0xffffff,
	// 		metalness: 0.5,
	// 		roughness: 0.5,
	// 	})
	// );
	// scene.add(ground);
}

function init(elem) {
	container = elem;
	initCore();
	initScene();
	lighting();
	renderer.setAnimationLoop(loop);
}

init(document.getElementById("app"));

document.getElementById("position").addEventListener("input", e => {
	avatar.desiredPosition.z = parseFloat(e.target.value);
});

window.addEventListener("mousemove", e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

window.addEventListener("keydown", e => {
	switch (e.key) {
		case "w":
			avatar.desiredPosition.z += 1;
			break;
		case "s":
			avatar.desiredPosition.z -= 1;
			break;
		case "h":
			document.getElementById("controls").style.display = "none";
			break;
	}
});
