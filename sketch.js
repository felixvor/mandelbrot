let max_iterations = 250
let infinity = 4
let canvas_size = localStorage.getItem('canvas_size') || 512
let color_scheme = "no_scheme"
let trip_progess = 0

// let evolving_color_iteration = 0
let evolving_color_values = []

// the image of the mandelbrot set that is currently shown
let mandelbrot_image

// define an initial area on the complex plane:
let min_x = -2.3
let max_x = 0.8
let min_y = 1.5
let max_y = -1.5

// based on the initial values above, define center coordinates and zoom factor:
let current_coordinate_a = -0.75
let current_coordinate_b = 0
let current_zoom_log10 = -0.5

// the factor to multiply the canvas_size (pixels) for rendering a preview image
let preview_resolution = 1/4

// when this is replaced with a list of coordinates, zoom and pan to the position will start
let current_target = null

// list of targets i found (ie stole)
let targets = {
  "reset":[-0.75, 0, -0.5, 100],
  "julia_islands":[-1.4177481, 0.000140785, 6, 1500],
  "elefant_valley":[0.250745, 0.00003468, 4.5, 3000],
  "seahorse":[-0.743517833, -0.127094578, 1.75, 1000],
  "starfish":[-0.374004139, 0.659792175, 1.75, 1000],
  "tree":[-1.940157343, 0.000001, 5.5, 250],
  "sun":[-0.776592847, -0.136640848, 5, 1000],
  "stormclouds":[-1.746780894, 0.004784543, 5.3, 1000]
}

// zoom variables:
let zoom_w, zoom_h, zoom_tow, zoom_toh;
let zoom_x, zoom_y, zoom_tox, zoom_toy;
let zoom_step = .001; //zoom step per mouse tick

// when this reaches 30 half resolution render starts, when it reaches zero, full resolution rerender starts
// set to a higher value of "render_wait_frames" on every user interaction
let frames_until_rerender = Math.infinity 
let render_wait_frames = 50 // after user interaction, wait this long until new full res render, show half res render earlier

let drop_of_acid
// takes a coordinate and tells you if its on the complex plane
// render size is the pixel width and height of the image, so the x and y coordinates from the complex plane can be mapped accordingly
function mandelbrot(x, y, render_size){
  /*
    Check if f(z) = z^2 + c explodes for growing z_i
    z_0 = 0 
    c = (x,y) on the complex plane (ie a+b*i) where a and b are based on x and y

    if z_0 = 0 => z_0^2 = 0 => 
      z_0^2 + c == c

    when we start with the first z_0 = 0 we know that 
      z_1 = c because 0^2 + c = c
    this means:
      z_2 = z_1^2 + c 
          = c^2 + c
    this means 
      z_3 = z_2^2 + c
    and so on

    but how to calculate c = a+b*i, with i being imaginary?
      => we actually only need c^2 for the formula which is easy:
    c^2 = (a+b*i)*(a+b*i)
        = a^2 + abi + abi + b^2*i^2
        = a^2 + 2abi - b^2  // since i is sqrt(-1) i^2 is just -1, so b^2*i^2 = b^2*(-1)
        = a^2 - b^2 + 2abi // this turns out to be a new complex number :)
  */
  // turn pixel coordinate into coordinate on complex plane:
  let coordinate_a = map(x,0,render_size,min_x, max_x)
  let coordinate_b = map(y,0,render_size,min_y, max_y)
  // initialize iteration:
  let iteration = 0
  // let z = 0
  let a = coordinate_a
  let b = coordinate_b
  while (iteration < max_iterations){
    let real_component = a*a - b*b
    let imag_component = 2 * a * b
    // now we have z_i^2, add c to it to get the z_i+1
    a = real_component + coordinate_a
    b = imag_component + coordinate_b
    if (abs(a+b) > infinity){
      break
    }
    iteration++
  }

  let pixel_brightness

  if (color_scheme === "no_scheme"){
    pixel_brightness = map(iteration, 0, max_iterations, 0, 255)
    return [pixel_brightness, pixel_brightness, pixel_brightness]
  }

  if (color_scheme === "fill"){
    if (iteration === max_iterations){
      pixel_brightness = 0
    }else{
      pixel_brightness = map(iteration- log(log(a*a+b*b))/Math.log(2), 0, max_iterations, 0, 255)
    }
    return [pixel_brightness, pixel_brightness, pixel_brightness]
  }

  if (color_scheme === "colormap" || color_scheme == "evolving"){
    let saturation = 0.7
    if (iteration === max_iterations){
      saturation = 0.6
    }

    let col = iteration //- log(log(a*a+b*b))/Math.log(2);
    let hue = map(col, 0, max_iterations, 0, 1)
    if (color_scheme == "evolving"){
      col = hslToRgb(trip_progess+hue, saturation,0.5)
    }else{
      col = hslToRgb(0.043+hue, 0.7,0.5)
    }
    return col
  }
}


// return an image of canvas_size*canvas_size of the mandelbrot set
// based on the global variables that define the currently visible area
// use resolution < 1 to be faster but with less detail
function make_mandelbrot_image(preview=false){

  trip_progess += 0.005
  if (trip_progess>1){
    trip_progess=0
  }

  let render_size
  if (preview){
    render_size = Math.floor(canvas_size*preview_resolution)
  }else{
    render_size = canvas_size
  }
  
  let img = createImage(render_size, render_size);
  img.loadPixels()
  evolving_color_values = [render_size*render_size]
  for (let x = 0; x < render_size; x++){
    for(let y = 0; y < render_size; y++){
      let color = mandelbrot(x, y, render_size)
      let pixel_index = (x+y*render_size)*4
      img.pixels[pixel_index+0] = color[0] // r value
      img.pixels[pixel_index+1] = color[1] // g value
      img.pixels[pixel_index+2] = color[2] // b value
      img.pixels[pixel_index+3] = 255 // h value
    }
  }
  img.updatePixels()
  img.resize(canvas_size, canvas_size)
  // img.save('saved-image', 'png');
  return img
}


// after the global variables of the zoom and image position change
// call this to update the image of the mandelbrot set accordingly
function rerender(preview){
  let new_img_x = zoom_x - zoom_w/2
  let new_img_y = zoom_y - zoom_h/2
  let new_img_w = zoom_w
  let new_img_h = zoom_h

  let percentage_top_left_x = -1 * new_img_x / new_img_w
  let percentage_top_left_y = -1 * new_img_y / new_img_h
  let percentage_w = canvas_size / new_img_w
  let percentage_h = canvas_size / new_img_h
  
  let new_top_left_x = canvas_size * percentage_top_left_x
  let new_top_left_y = canvas_size * percentage_top_left_y
  let new_bottom_right_x = new_top_left_x + (percentage_w * canvas_size)
  let new_bottom_right_y = new_top_left_y + (percentage_h * canvas_size)

  let new_min_x = map(new_top_left_x,0,canvas_size,min_x, max_x)
  let new_max_x = map(new_bottom_right_x,0,canvas_size,min_x, max_x)
  let new_min_y = map(new_top_left_y,0,canvas_size,min_y, max_y)
  let new_max_y = map(new_bottom_right_y,0,canvas_size,min_y, max_y)

  // console.log(new_min_x+","+new_max_x)
  // console.log(new_min_y+","+new_max_y)

  min_x = new_min_x
  max_x = new_max_x
  min_y = new_min_y
  max_y = new_max_y

  current_coordinate_a = ((min_x+max_x)/2)
  current_coordinate_b = ((min_y+max_y)/2)
  current_zoom_log10 =Math.log10((1/(max_x - min_x))) // might not be accurate

  mandelbrot_image = make_mandelbrot_image(preview=preview)

}

// make the current view the new default
function reset_zoom(){
  zoom_w = zoom_tow = canvas_size
  zoom_h = zoom_toh = canvas_size
  zoom_x = zoom_tox = canvas_size / 2
  zoom_y = zoom_toy = canvas_size / 2
}



// call this function to move the camera a little closer to the current target
function move_to_target(){
  let target_a = current_target[0]
  let target_b = current_target[1]
  let target_zoom = current_target[2]

  let a_width = max_x-min_x
  let b_width = max_y-min_y

  let target_width = 1 / Math.pow(10, target_zoom)
  let diff_to_width = target_width - a_width

  let diff_to_width_pixel = map(diff_to_width, 0, a_width, 0, canvas_size)

  let diff_to_a = target_a - current_coordinate_a
  let diff_to_b = target_b - current_coordinate_b

  let diff_to_a_pixel = map(diff_to_a, 0, a_width, 0, canvas_size)
  let diff_to_b_pixel = map(diff_to_b, 0, b_width, 0, canvas_size)

  if (abs(diff_to_a_pixel) < 5 && abs(diff_to_b_pixel) < 5 && abs(diff_to_width_pixel) < 10){
    current_target = null
    frames_until_rerender = 1 //trigger a high res after one frame render now that we are here
    reset_zoom()
    return
  }

  let zoom_to_wh = canvas_size - diff_to_width_pixel
  if (zoom_to_wh < canvas_size/2) {
    // oh boy slow that down
    zoom_to_wh = canvas_size/2
  }
  if (zoom_to_wh > canvas_size*1.5) {
    zoom_to_wh = canvas_size*1.5
  }
  // ^ if zoom in or out too fast to be followed

  zoom_tow = zoom_to_wh
  zoom_toh = zoom_to_wh
  zoom_tox = (canvas_size / 2) - diff_to_a_pixel
  zoom_toy = (canvas_size / 2) - diff_to_b_pixel

  // dont rerender instantly, wont keep up and will cause circling around the target instead of nearing it
  frames_until_rerender = render_wait_frames
}


let resolution_select, color_scheme_select, max_iterations_select, max_iterations_info
let test_button

/**
 * 
 * SETUP
 * 
 */
function setup() {

  
  let selected_canvas_size = 512 // value to show in dropdown select, might be string
  if (canvas_size === "window"){
    canvas_size = Math.min(windowWidth, windowHeight)
    selected_canvas_size = "window"
  }else{
    canvas_size = parseFloat(canvas_size)
    selected_canvas_size = canvas_size
  }

  createCanvas(canvas_size, canvas_size);

  mandelbrot_image = make_mandelbrot_image()

  let resolution_select_info = createElement('h5', 'Image Resoultion:');
  resolution_select_info.position(canvas_size+10, 0);
  resolution_select = createSelect();
  resolution_select.position(canvas_size+10, 40);
  resolution_select.option(360)
  resolution_select.option(512)
  resolution_select.option(720)
  resolution_select.option(1080)
  resolution_select.option("window")
  resolution_select.selected(selected_canvas_size)
  resolution_select.changed(resolution_changed)

  let color_scheme_select_info = createElement('h5', 'Color Scheme:');
  color_scheme_select_info.position(canvas_size+10, 40);
  color_scheme_select = createSelect();
  color_scheme_select.position(canvas_size+10, 80);
  color_scheme_select.option("no_scheme")
  color_scheme_select.option("fill")
  color_scheme_select.option("colormap")
  color_scheme_select.option("evolving")
  color_scheme_select.changed(color_scheme_changed)

  max_iterations_info = createElement('h5', 'number of iterations: ('+max_iterations+')');
  max_iterations_info.position(canvas_size+10, 80);
  max_iterations_select = createSlider(4,450,50,1);
  max_iterations_select.position(canvas_size+10, 120);
  max_iterations_select.input(max_iterations_changed)


  let available_targets = Object.keys(targets)
  for (let i = 0; i < available_targets.length; i++){
    let target_button = test_button = createButton(available_targets[i])
    target_button.position(canvas_size+10, 160 + (30*i))
    target_button.mouseClicked(() => target_clicked(available_targets[i]))
  }

  // initial zoom position:
  reset_zoom()
}


/**
 * 
 * DRAW
 * 
 */
function draw() {
  //mandelbrot_image.save('mandeldarm', 'png');

  background(55);

  //tween/smooth motion
  zoom_x = lerp(zoom_x, zoom_tox, .1);
  zoom_y = lerp(zoom_y, zoom_toy, .1);
  zoom_w = lerp(zoom_w, zoom_tow, .1); // new width of image
  zoom_h = lerp(zoom_h, zoom_toh, .1); // new height of image

  let new_img_x = zoom_x-zoom_w/2
  let new_img_y = zoom_y-zoom_h/2


  // draw the current image of the mandelbrot set
  image(mandelbrot_image,new_img_x, new_img_y, zoom_w, zoom_h);


  // information top left:
  textSize(8);
  fill(125, 125, 125);
  text('a:'+current_coordinate_a, 5, 10);
  text('b:'+current_coordinate_b, 5, 20)
  text('Zoom: 10^'+ Math.floor(current_zoom_log10*100)/100, 5, 30)

  frames_until_rerender = frames_until_rerender - 1

  if (frames_until_rerender == render_wait_frames - 5){
    rerender(preview=true) // start full resultion render if user didnt interact for render_wait_frames = 50
    reset_zoom()
    return
  }

  if (frames_until_rerender == 0){
    rerender(preview=false) // start full resultion render if user didnt interact for render_wait_frames = 50
    reset_zoom()
    return
  }

  // a little hacky,
  // if there is a target currently, call this function to move closer to it
  // this will then set "frames_until_rerender" to "render_wait_frames"
  // wait 7 frames to move closer again (will allow low res render to happen in time)
  if (current_target != null && frames_until_rerender < render_wait_frames - 5){
    move_to_target()
    return
  }

}


/**
 * 
 * EVENT LISTENERS:
 * 
 */

function target_clicked(button_text){
  min_x = -2.3
  max_x = 0.8
  min_y = 1.5
  max_y = -1.5

  max_iterations = targets[button_text][3]

  max_iterations_select.value(Math.ceil(Math.pow(max_iterations, 2/3)))
  max_iterations_changed()

  if (button_text === "reset"){
    current_target=null
    rerender()
  }else{
    current_target = targets[button_text]
    move_to_target()
  }
}

// Event Listener for the resolution dropdown menu
function resolution_changed(){
  let sel = resolution_select.value()
  // i wish resize canvas and a call to setup would work
  // but p5 doesnt like manual setup calls :(
  localStorage.setItem('canvas_size', sel);
  window.location.reload();
}

// Event Listener for the color sheme dropdown menu
function color_scheme_changed(){
  let sel = color_scheme_select.value()
  color_scheme = sel
  frames_until_rerender = render_wait_frames
}

// Event Listener for the max_iterations dropdown menu
function max_iterations_changed(){
  let sel = Math.floor(Math.pow(max_iterations_select.value(), 1.5))
  max_iterations_info.html("number of iterations ("+sel+"):")
  if (sel === "auto"){
    // do something smart
    return
  }
  max_iterations = parseFloat(sel)
  frames_until_rerender = render_wait_frames-4
}

function mouseDragged() {
  if (mouseX > canvas_size || mouseY > canvas_size){
    return
  }
  zoom_tox += (mouseX-pmouseX)*0.3;
  zoom_toy += (mouseY-pmouseY)*0.3;

  frames_until_rerender = render_wait_frames
}


function mouseWheel(event) {
  if (mouseX > canvas_size || mouseY > canvas_size){
    return
  }
  var e = -event.delta;
  if (e>0) { //zoom in
    for (var i=0; i<e; i++) {
      if (zoom_tow>30*canvas_size) return; //max zoom
      zoom_tox -= zoom_step * (mouseX - zoom_tox);
      zoom_toy -= zoom_step * (mouseY - zoom_toy);
      zoom_tow *= zoom_step+1;
      zoom_toh *= zoom_step+1;
    }
  }
  if (e<0) { //zoom out
    for (var i=0; i<-e; i++) {
      if (zoom_tow*30<canvas_size) return; //min zoom
      zoom_tox += zoom_step/(zoom_step+1) * (mouseX - zoom_tox); 
      zoom_toy += zoom_step/(zoom_step+1) * (mouseY - zoom_toy);
      zoom_toh /= zoom_step+1;
      zoom_tow /= zoom_step+1;
    }
  }

  frames_until_rerender = render_wait_frames
}



function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}