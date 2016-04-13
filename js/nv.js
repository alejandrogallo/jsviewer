var chgcarFile="chgcar.list";
var chgcarSelectId="chgcar-list";
var CHGCARS=[];

var CONTCAR_TYPE="vasp";
var CONTCAR="CONTCAR";
//var CHGCAR="CHG.cube";

var MAIN_VIEWER;

function init() {
  console.log("Initialising...");
  getChgcarNames();
  MAIN_VIEWER = $3Dmol.viewers.viewer;
  MAIN_VIEWER.setBackgroundColor(0xffffff);
}

function addChgcarToList() {
  var container = document.getElementById(chgcarSelectId);
  var inputs = container.getElementsByTagName("input");

  CHGCARS=[];
  for (var i = 0; i<inputs.length; i++){
    var inputElement = inputs[i];
    if (inputElement.checked) {
      CHGCARS.push(inputElement.value);
    }
  }
}

function getChgcarNames() {
  console.log("Reading file "+chgcarFile);

  var container = document.getElementById(chgcarSelectId);

  $.get(chgcarFile, function(data){
    data = data.split(/[\n\r]/);
    data.forEach(function(name){
      var li = document.createElement("li");
      var label = document.createElement("label");
      label.innerHTML = name;
      var checkbox = document.createElement("input");
      checkbox.type="checkbox";
      checkbox.value=name;
      checkbox.addEventListener("change", addChgcarToList);

      if (name) {
        container.appendChild(li);
        li.appendChild(label);
        li.appendChild(checkbox);
      }

    });
  },"text");
}


function clear() {
  console.log("Clearing..");
  MAIN_VIEWER.clear();
}


function getBool(inputId) {
  //Get boolean values from input
  var input = document.getElementById(inputId);
  var val = input.checked;
  console.log("Drawing for "+inputId+" = "+val);
  return val;
}
function getF(inputId) {
  //Get float values from input
  var input = document.getElementById(inputId);
  var val = parseFloat(input.value);
  console.log("Drawing for "+inputId+" = "+val.toString());
  return val;
}

function render() {
  clear();
  renderModel();
  renderChgcar();
  MAIN_VIEWER.setSlab(-20,20);
  MAIN_VIEWER.render();
  //MAIN_VIEWER.zoomTo();
}

function renderIso() {
  MAIN_VIEWER.removeAllShapes();
  MAIN_VIEWER.removeAllSurfaces();
  renderChgcar();
}

function renderChgcar() {
  console.log("Rendering Chgcar");

  //var volumetric_path=CHGCAR;

  CHGCARS.forEach(function(volumetric_path, index){
    if (volumetric_path) {
      console.log("Loading volumetric_data from "+volumetric_path);
      $.get(volumetric_path, function (data) {
        console.log("Volumetric data received");
        var isovalue=getF("isovalue");
        var opacity=getF("opacity");
        var alpha=getF("alpha");
        var smoothness=getF("smoothness");
        var voxel=getBool("voxel");
        var voldata = new $3Dmol.VolumeData(data, "cube");
        MAIN_VIEWER.addIsosurface(voldata, {voxel:voxel, isoval: isovalue, color: "blue", opacity:opacity, smoothness:smoothness, alpha: alpha});
        MAIN_VIEWER.addIsosurface(voldata, {voxel:voxel, isoval: -isovalue, color: "red", opacity:opacity, smoothness:smoothness, alpha: alpha});
        MAIN_VIEWER.render();
      }, "text");
    }
  });

}

function renderModel() {
  $.get(CONTCAR, function(data){
    console.log("Structural data received");
    var model = MAIN_VIEWER.addModel(data, CONTCAR_TYPE);
    model.setStyle({}, {sphere:{scale: 0.2}, stick:{radius:0.1}});
        MAIN_VIEWER.render();
  }, "text");
}



