import mapboxgl, { type CustomLayerInterface, type Map as MapboxMap } from "mapbox-gl";
import type * as THREE from "three";
import {
  birdSilhouetteColor,
  createBirdOrbits,
  sampleBirdOrbit,
  type BirdOrbit,
} from "@/lib/parisBirds";
import type { LightPreset } from "@/lib/parisWeather";

export const BIRDS_LAYER_ID = "lp-paris-birds";

type ThreeModule = typeof import("three");

interface BirdMesh {
  root: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  orbit: BirdOrbit;
  t: number;
}

interface BirdsLayerState {
  map: MapboxMap;
  THREE: ThreeModule;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  birds: BirdMesh[];
  lastTime: number;
  getPreset: () => LightPreset;
  getBirdCount: () => number;
}

function createBirdMesh(THREE: ThreeModule, color: number): Omit<BirdMesh, "orbit" | "t"> {
  const root = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.88,
  });

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(5.5, 1.2);
  wingShape.lineTo(5.5, -0.4);
  wingShape.lineTo(0, -0.8);
  wingShape.closePath();
  const wingGeom = new THREE.ShapeGeometry(wingShape);

  const leftWing = new THREE.Mesh(wingGeom, material);
  leftWing.position.set(-0.3, 0, 0);
  leftWing.rotation.z = 0.35;

  const rightWing = new THREE.Mesh(wingGeom, material);
  rightWing.position.set(0.3, 0, 0);
  rightWing.rotation.y = Math.PI;
  rightWing.rotation.z = -0.35;

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 5, 5), material);
  root.add(leftWing, rightWing, body);

  return { root, leftWing, rightWing };
}

function syncBirdCount(state: BirdsLayerState) {
  const target = state.getBirdCount();
  if (state.birds.length === target) return;

  for (const bird of state.birds) state.scene.remove(bird.root);
  state.birds = [];

  const orbits = createBirdOrbits(target);
  const color = birdSilhouetteColor(state.getPreset());
  for (const orbit of orbits) {
    const parts = createBirdMesh(state.THREE, color);
    parts.root.visible = target > 0;
    state.scene.add(parts.root);
    state.birds.push({ ...parts, orbit, t: orbit.phase / (Math.PI * 2) });
  }
}

function updateBirdMeshes(state: BirdsLayerState, now: number) {
  syncBirdCount(state);
  const preset = state.getPreset();
  const color = birdSilhouetteColor(preset);
  const dt = state.lastTime ? Math.min(0.05, (now - state.lastTime) / 1000) : 0.016;
  state.lastTime = now;

  for (const bird of state.birds) {
    bird.t = (bird.t + bird.orbit.speed * dt) % 1;
    const sample = sampleBirdOrbit(bird.orbit, bird.t);
    const mc = mapboxgl.MercatorCoordinate.fromLngLat([sample.lng, sample.lat], sample.alt);
    const scale = mc.meterInMercatorCoordinateUnits();

    bird.root.position.set(mc.x, mc.y, mc.z);
    bird.root.scale.set(scale, scale, scale);
    bird.root.rotation.set(0, 0, -sample.heading);

    const flap = Math.sin(now * 0.009 + bird.orbit.flapPhase) * 0.42;
    bird.leftWing.rotation.z = 0.35 + flap;
    bird.rightWing.rotation.z = -0.35 - flap;

    const mat = bird.leftWing.material as THREE.MeshBasicMaterial;
    if (mat.color.getHex() !== color) mat.color.setHex(color);
  }
}

export function createParisBirdsLayer(opts: {
  getPreset: () => LightPreset;
  getBirdCount: () => number;
}): CustomLayerInterface {
  let state: BirdsLayerState | null = null;

  return {
    id: BIRDS_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      void import("three").then((THREE) => {
        const scene = new THREE.Scene();
        const camera = new THREE.Camera();
        const renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl as WebGLRenderingContext,
          antialias: true,
        });
        renderer.autoClear = false;

        state = {
          map,
          THREE,
          renderer,
          scene,
          camera,
          birds: [],
          lastTime: 0,
          getPreset: opts.getPreset,
          getBirdCount: opts.getBirdCount,
        };
        syncBirdCount(state);
      });
    },

    render(_gl, matrix) {
      if (!state) return;

      updateBirdMeshes(state, performance.now());
      if (state.birds.length === 0) return;

      const m = new state.THREE.Matrix4().fromArray(matrix);
      state.camera.projectionMatrix = m;
      state.renderer.resetState();
      state.renderer.render(state.scene, state.camera);
      state.map.triggerRepaint();
    },

    onRemove() {
      if (!state) return;
      state.renderer.dispose();
      state.scene.clear();
      state = null;
    },
  };
}
