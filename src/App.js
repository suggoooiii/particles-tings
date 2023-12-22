import * as THREE from "three";
import GUI from "lil-gui";
import vertex from "./glsl/vertex.glsl";
import fragment from "./glsl/fragment.glsl";

export default class App {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 2;
    this.camera.frustumCulled = false;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    this.holder = new THREE.Object3D();
    this.holder.sortObjects = false;
    this.scene.add(this.holder);

    this.gui = new GUI();

    this.time = 0;

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: 2 },
        frequency: { value: 2 },
        amplitude: { value: 0.8 },
        offsetGain: { value: 0.5 },
        maxDistance: { value: 1.8 },
      },
    });

    setInterval(() => {
      if (this.guiProperties.autoRandom) {
        this.guiProperties.randomizeMeshes();
      }
    }, 1000);

    this.setGUI();
    this.createCube();

    this.update();

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  createCube() {
    let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40));
    let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80));

    this.geometry = new THREE.BoxGeometry(
      1,
      1,
      1,
      widthSeg,
      heightSeg,
      depthSeg
    );
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.holder.add(this.pointsMesh);

    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    this.guiProperties.segments = {
      width: widthSeg,
      height: heightSeg,
      depth: depthSeg,
    };
    this.segmentsFolder.add(this.guiProperties.segments, "width", 5, 20);
    this.segmentsFolder.add(this.guiProperties.segments, "height", 1, 40);
    this.segmentsFolder.add(this.guiProperties.segments, "depth", 5, 80);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");

    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.BoxGeometry(
        1,
        1,
        1,
        this.guiProperties.segments.width,
        this.guiProperties.segments.height,
        this.guiProperties.segments.depth
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.holder.add(this.pointsMesh);
    });
  }

  createCylinder() {
    let radialSeg = Math.floor(THREE.MathUtils.randInt(64, 192));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(64, 320));

    this.geometry = new THREE.CylinderGeometry(
      1,
      1,
      4,
      radialSeg,
      heightSeg,
      true
    );
    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.rotation.set(Math.PI / 2, 0, 0);
    this.holder.add(this.pointsMesh);

    this.segmentsFolder?.destroy();
    this.segmentsFolder = this.gui.addFolder("Segments");
    this.guiProperties.segments = {
      height: heightSeg,
      radial: radialSeg,
    };
    this.segmentsFolder.add(this.guiProperties.segments, "height", 32, 192);
    this.segmentsFolder.add(this.guiProperties.segments, "radial", 32, 320);
    this.segmentsFolder
      .add(this.guiProperties, "randomizeSegments")
      .name("Randomize Segments");

    this.segmentsFolder.onChange(() => {
      this.holder.remove(this.pointsMesh);
      this.geometry = new THREE.CylinderGeometry(
        1,
        1,
        4,
        this.guiProperties.segments.radial,
        this.guiProperties.segments.height,
        true
      );
      this.pointsMesh = new THREE.Points(this.geometry, this.material);
      this.pointsMesh.rotation.set(Math.PI / 2, 0, 0);
      this.holder.add(this.pointsMesh);
    });
  }

  setGUI() {
    this.guiProperties = {
      segments: {},
      mesh: "Cube",
      autoRotate: true,
      autoRandom: true,
      randomizeSegments: () => {
        this.holder.remove(this.pointsMesh);
        if (this.guiProperties.mesh === "Cube") {
          this.createCube();
        } else {
          this.createCylinder();
        }
      },
      randomizeMeshes: () => {
        this.holder.remove(this.pointsMesh);
        if (Math.random() < 0.5) {
          this.guiProperties.mesh = "Cube";
          this.createCube();
        } else {
          this.guiProperties.mesh = "Cylinder";
          this.createCylinder();
        }
      },
    };

    this.gui
      .add(this.guiProperties, "mesh", ["Cube", "Cylinder"])
      .onChange((value) => {
        this.holder.remove(this.pointsMesh);
        if (value === "Cube") {
          this.createCube();
        } else {
          this.createCylinder();
        }
      })
      .listen();

    this.gui.add(this.guiProperties, "autoRotate").name("Auto Rotate");
    this.gui.add(this.guiProperties, "autoRandom").name("Auto Randomize");
    this.gui
      .add(this.guiProperties, "randomizeMeshes")
      .name("Randomize Meshes");

    this.shaderFolder = this.gui.addFolder("Shader");
    this.shaderFolder
      .add(this.material.uniforms.frequency, "value", 0, 5)
      .name("Frequency");
    this.shaderFolder
      .add(this.material.uniforms.amplitude, "value", 0, 5)
      .name("Amplitude");
    this.gui.close();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  update() {
    requestAnimationFrame(() => this.update());

    if (this.guiProperties.autoRotate) {
      this.holder.rotation.x += 0.01;
      this.holder.rotation.y += 0.01;
    } else {
      this.holder.rotation.set(0, 0, 0);
    }

    this.time += 0.1;
    this.material.uniforms.time.value = this.time;

    this.renderer.render(this.scene, this.camera);
  }
}
