var camera, scene, renderer;
var mesh;
var water;

var gui, guivalues;
var zArray = [];
var lastTerrain;
//Tekstuurid.
var snowTexture, sandTexture, grassTexture, dirtTexture, waterTexture;
var customMaterial;
//x ja y skaalal sagedused.
var pixel;
var xFrequency, yFrequency;
var in_min = 10000;
var in_max = -10000;
window.onload = startScene;
function startScene(){
  setGuiValues();
  setUpSceneAndLights();
  setRenderer();
  cameraSettings();
  loadTextures();
  createRandomTerrain('Perlin');
  render();
}
function loadTextures(){
  /*
  https://www.deviantart.com/paigexv/art/Grass-Texture-282755646
  http://www.fmwconcepts.com/imagemagick/tiler/index.php
  https://www.deviantart.com/nuxlystardust-stock/art/Texture-Sand-LowRes-512-311698720
  https://www.deviantart.com/dudealan2001/art/Snow-Texture-Stock-212550141
  https://github.com/stemkoski/stemkoski.github.com/blob/master/Three.js/images/water512.jpg
  */
  snowTexture = new THREE.TextureLoader().load( 'textures/snow.jpg' );
  sandTexture = new THREE.TextureLoader().load( 'textures/sand.jpg' );
  grassTexture = new THREE.TextureLoader().load( 'textures/grass.png' );
  dirtTexture = new THREE.TextureLoader().load( 'textures/dirt.jpg' );
  waterTexture = new THREE.TextureLoader().load( 'textures/water.jpg' );

  snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;
  sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  dirtTexture.wrapS = dirtTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
  waterTexture.repeat.set(5,5);
}

function setCustomMaterial(){
  this.customUniforms = {
    in_min:	  {value: in_min },
    in_max:	  {value: in_max },
    sandTexture:	{value: sandTexture },
    grassTexture:	{value: grassTexture },
    dirtTexture:	{value: dirtTexture },
    snowTexture:	{value: snowTexture },
    grassStart:	  {value: guivalues.grassStart },
    dirtStart:	{value: guivalues.dirtStart },
    snowStart:	{value: guivalues.snowStart },
  }


  customMaterial = new THREE.ShaderMaterial({
    uniforms: customUniforms,
    side: THREE.DoubleSide,
    wireframe: guivalues.wireframe,
    vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  });
}

function resetZvalues(){
  in_min = 10000;
  in_max = -10000;
}
var customSeed;
function createRandomTerrain(terrainName){

  resetZvalues();
  customSeed = Math.floor(Math.random() * 65536) + 1;
  scene.remove(mesh);
  scene.remove(water);
  if (terrainName === "Perlin" || terrainName === "Diamond-square algorithm"
  || terrainName === "Heightmap"){
    lastTerrain = terrainName;
    zArray = [];
  }

  console.time('Function #1');
  var geometry = new THREE.BufferGeometry();
  var indices = [];
  var vertices = [];
  var normals = [];
  var colors = [];
  var uvs = [];
  var size = guivalues.size;

  var segments;
  if(terrainName === "Perlin" || (terrainName === "ChangingHeights" && lastTerrain === "Perlin")){
    segments = guivalues.segments;
  } else if (terrainName === "Diamond-square algorithm" || (terrainName === "ChangingHeights" && lastTerrain === "Diamond-square algorithm")){
    segments = parseInt(guivalues.segmentsForDiamond, 10);

  } else if (terrainName === "Heightmap" || (terrainName === "ChangingHeights" && lastTerrain === "Heightmap")){
    segments = pixel.width;
  }

  var halfSize = size / 2;
  var segmentSize = size / segments;

  //Diamond code
  var hillinessFactor = guivalues.heightOnGeneration / 50;
  var terrain, terrainData;
  if (terrainName === "Diamond-square algorithm"){
    terrain = new Terrain(segments + 1);
    terrain.generate(guivalues.terrainRoughness)
    terrainData = parseData(terrain.data);
  }
  var iOff = 0.01;
  var segmentsMinusOne = true;
  var count = 0;
  for (var i = 0; i <= segments; i++) {
    var jOff = 0.01;
    var y = (i * segmentSize) - halfSize;
    for (var j = 0; j <= segments; j++){
      var x = (j * segmentSize) - halfSize;
      //https://www.youtube.com/watch?v=MRNFcywkUSA
      var frequency = 1;
      var amplitude = 1;
      var noiseHeight = 0;
      if(terrainName === "Perlin"){
        for(var k = 0; k < guivalues.octaves; k++) {
          var realX = jOff * frequency;
          var realY = iOff* frequency;
          var perlinValue = createPerlinNoise(realX,realY);
          noiseHeight += perlinValue * amplitude;
          amplitude *= guivalues.persistance;
          frequency *= guivalues.lacunarity;
        }
        var z = noiseHeight * guivalues.heightOnGeneration;
        vertices.push(x, y, z);
        saveZhigherANDlower(z);
      } else if(terrainName === "Diamond-square algorithm"){
          var z = terrainData[j][i].z * hillinessFactor;
          vertices.push(x, y, z);
          saveZhigherANDlower(z);
      } else if(terrainName === "Heightmap"){
          var z = pixel.data[j * 4 + (segments * i * 4)];
          vertices.push(y, x, z);
          saveZhigherANDlower(z);
      } else if (terrainName === "ChangingHeights" && lastTerrain === "Perlin") {
          var z = zArray[count] * guivalues.height;
          vertices.push(x, y, z);
          saveZhigherANDlower(z);
          count++;
      } else if (terrainName === "ChangingHeights" && lastTerrain === "Diamond-square algorithm") {
          var z = zArray[count] * guivalues.height;
          vertices.push(x, y, z);
          saveZhigherANDlower(z);
          count++;
      } else if (terrainName === "ChangingHeights" && lastTerrain === "Heightmap") {
          var z = zArray[count] * guivalues.height;
          vertices.push(y, x, z);
          saveZhigherANDlower(z);
          count++;
      }
      uvs.push( j / segments );
			uvs.push( 1 - ( i / segments ) );
      normals.push(0, 0, 1);
      colors.push(0, 0, 1);
      jOff += guivalues.xFrequency;
    }
  iOff += guivalues.yFrequency;
  }


    if(terrainName === "Heightmap" || (terrainName === "ChangingHeights" && lastTerrain === "Heightmap")){
      for (var i = 0; i < segments - 1; i++) {
        for (var j = 0; j < segments - 1; j++) {
          var a = i * (segments + 1) + (j + 1);
          var b = i * (segments + 1) + j;
          var c = (i + 1) * (segments + 1) + j;
          var d = (i + 1) * (segments + 1) + (j + 1);

          // line goes through triangle vetrices.
          indices.push(a, b, d); // triangle 1
          indices.push(b, c, d); // tringle 2
          }
      }
    } else {
      for (var i = 0; i < segments ; i++) {
        for (var j = 0; j < segments; j++) {
          var a = i * (segments + 1) + (j + 1);
          var b = i * (segments + 1) + j;
          var c = (i + 1) * (segments + 1) + j;
          var d = (i + 1) * (segments + 1) + (j + 1);

          // line goes through triangle vetrices.
          indices.push(a, b, d); // triangle 1
          indices.push(b, c, d); // tringle 2
          }
      }
    }


  geometry.computeBoundingSphere();
  geometry.setIndex(indices);
  geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

  if (terrainName === "Perlin" || terrainName === "Diamond-square algorithm"
  || terrainName === "Heightmap"){

    var zValueLength = geometry.attributes.position.count * 3;
    for (var i = 2; i < zValueLength; i = i + 3 ){
      zArray.push(geometry.attributes.position.array[i]);
    }
  }
  setCustomMaterial();
  mesh = new THREE.Mesh(geometry, customMaterial);
  scene.add(mesh);
  console.timeEnd('Function #1')


  var waterGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
  var waterMaterial = new THREE.MeshBasicMaterial({map: waterTexture, transparent:true, opacity:0.50});
  water = new THREE.Mesh(waterGeometry, waterMaterial);
  scene.add(water);
  water.position.set(0, 0, guivalues.waterLevel);


}

function saveZhigherANDlower(z){
  if(z < in_min){
    in_min = z;
  }
  if(z > in_max){
    in_max = z;
  }
}

function cameraSettings() {
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 15000 );
  camera.position.z = 1000;
  camera.up = new THREE.Vector3(0,0,1);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();
}

function setUpSceneAndLights(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x050505 );
  var cubeGeometry = new THREE.BoxGeometry(10000,10000,10000);
  var loader = new THREE.TextureLoader();
  /*
  http://www.custommapmakers.org/skyboxes.php
  */
  var cubeMaterials = [
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_ft.png'), side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_bk.png'), side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_up.png'), side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_dn.png'), side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_rt.png'), side: THREE.DoubleSide}),
    new THREE.MeshBasicMaterial({map: loader.load('background/cloudtop_lf.png'), side: THREE.DoubleSide}),
  ];
  var cube = new THREE.Mesh(cubeGeometry,cubeMaterials);
  scene.add(cube);
  cube.rotation.y = -Math.PI / 2;
  cube.rotation.z = -Math.PI / 2;

}

function setRenderer(){
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function createPerlinNoise(x,y){
  noise.seed(customSeed);
  var value = noise.perlin2(x, y);
  return value;
}

// Code from https://github.com/lschlessinger1/fractalTerrainGeneration
// from 2D array data[x][y] = z to 2D array in form: data[x][y] = {x: x_i, y: y_i, z: z_i}
function parseData(data) {
    var dataArr = [];
    for (var x = 0; x < data.length; x++) {
      dataArr[x] = [];
      for (var y = 0; y < data.length; y++) {
        dataArr[x][y] = {x: x, y: y, z: data[x][y]};
    }
  }
  return dataArr;
}


var ctx;
function setGuiValues(){
  var GuiValues = function() {
    this.materialScale = 20;
    this.noiseSelect = 'Perlin';
    this.size = 500;
    this.segments = 128;
    this.xFrequency = 0.02;
    this.yFrequency = 0.02;
    this.wireframe = false;
    this.height = 1;
    this.terrainRoughness = 0.5;
    this.heightOnGeneration = 100;
    this.grassStart = 0.2;
    this.dirtStart = 0.6;
    this.snowStart = 0.8;
    this.waterLevel = -20;
    this.persistance = 0;
    this.octaves = 1;
    this.lacunarity = 1;
    this.segmentsForDiamond = 128;

    this.Regenerate = function() {
      createRandomTerrain(this.noiseSelect);
    };
  };

  guivalues = new GuiValues();
  gui = new dat.GUI();
  gui.width = 320;
  var perlinFolder = gui.addFolder('Perlin noise');
  var diamondFolder = gui.addFolder('Diamond-square algorithm');
  var materialFolder = gui.addFolder('Materials');
  var modelFolder = gui.addFolder('Model parameters');
  materialFolder.add(guivalues, 'grassStart', 0.01, 0.2).step(0.01).name('Grass texture').onFinishChange(function (newValue){
    grassStart = newValue;
    setCustomMaterial();
    mesh.material = customMaterial;
  });
  materialFolder.add(guivalues, 'dirtStart', 0.3, 0.5).step(0.01).name('Rock texture').onFinishChange(function (newValue){
    dirtStart = newValue;
    setCustomMaterial();
    mesh.material = customMaterial;
  });
  materialFolder.add(guivalues, 'snowStart', 0.6, 0.9).step(0.01).name('Snow Texture').onFinishChange(function (newValue){
    snowStart = newValue;
    setCustomMaterial();
    mesh.material = customMaterial;
  });

  perlinFolder.add(guivalues, 'xFrequency', 0.005, 0.10).step(0.005);
  perlinFolder.add(guivalues, 'yFrequency', 0.005, 0.10).step(0.005);
  perlinFolder.add(guivalues, 'persistance', 0, 1).name('Persistance').step(0.01);
  perlinFolder.add(guivalues, 'lacunarity', 1, 10).name('Lacunarity').step(0.01);
  perlinFolder.add(guivalues, 'octaves', 1, 5).name('Octaves').step(1);
  modelFolder.add(guivalues, 'size', 100, 2000).step(10).name('Size').onFinishChange(function (newValue){
    createRandomTerrain("ChangingHeights");
  });
  modelFolder.add(guivalues, 'heightOnGeneration', 4, 100).step(2).name('Height on generation');
  modelFolder.add(guivalues, 'height', 0, 2).step(0.01).name('Height on model').onFinishChange(function (newValue){
    createRandomTerrain("ChangingHeights");
  });
  diamondFolder.add(guivalues, 'terrainRoughness', 0, 1).step(0.01).name('Roughness');
  modelFolder.add(guivalues, 'wireframe').name('Wireframe').onChange(function (newValue){
    mesh.material.wireframe = newValue;
  });
  gui.add(guivalues, 'waterLevel',-100, 100).name('Water level').onFinishChange(function (newValue){
    water.position.set(0, 0, newValue);
  });
  gui.add(guivalues, 'noiseSelect', ['Perlin', 'Diamond-square algorithm','Heightmap']).name('Noise Select').onFinishChange(function (newValue){
    if(newValue === 'Heightmap'){
      document.getElementById('myInput').click();
      document.getElementById('myInput').onchange = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          pixel = ctx.getImageData(0, 0, this.width, this.height);
          createRandomTerrain("Heightmap");
        }
      img.src = URL.createObjectURL(this.files[0]);
      };
    }
  });
  gui.add(guivalues, 'Regenerate');
  perlinFolder.add(guivalues, 'segments',0, 512).name('Perlin Segments').step(1);
  diamondFolder.add(guivalues, 'segmentsForDiamond',[2,4,8,16,32,64,128,256,512]).name('Diamond Segments');
  }
