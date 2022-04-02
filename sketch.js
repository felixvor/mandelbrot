let min_x = -2.3
let max_x = 0.8
let min_y = -1.5
let max_y = 1.5

// min_x = -1
// max_x = 1
// min_y = -1
// max_y = 1

let max_iterations = 100
let infinity = 100
let canvas_size = 720

// ZOOM:
let zoom_w, zoom_h, zoom_tow, zoom_toh;
let zoom_x, zoom_y, zoom_tox, zoom_toy;
let zoom_step = .001; //zoom step per mouse tick 

let frames_until_rerender = Math.infinity // when this reaches zero, full res rerender starts
let render_wait_frames = 50 // after user interaction, wait this long until new full res render

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
  let pixel_brightness = map(iteration, 0, max_iterations, 0, 255)
  return [pixel_brightness]
}

function make_mandelbrot_image(resolution=1){
  let render_size = canvas_size*resolution
  let img = createImage(render_size, render_size);
  img.loadPixels()
  for (let x = 0; x < render_size; x++){
    for(let y = 0; y < render_size; y++){
      let color = mandelbrot(x, y, render_size)
      let pixel = (x+y*render_size)*4
      img.pixels[pixel+0] = color // r value
      img.pixels[pixel+1] = color // g value
      img.pixels[pixel+2] = color // b value
      img.pixels[pixel+3] = 255 // h value
    }
  }
  img.updatePixels()
  img.resize(canvas_size, canvas_size)
  img.save('saved-image', 'png');
  return img
}


function rerender(resolution = 1){

  let new_img_x = zoom_x-zoom_w/2
  let new_img_y = zoom_y-zoom_h/2
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

  console.log(new_min_x+","+new_max_x)
  console.log(new_min_y+","+new_max_y)

  min_x = new_min_x
  max_x = new_max_x
  min_y = new_min_y
  max_y = new_max_y

  mandelbrot_image = make_mandelbrot_image(resolution)

  // initial zoom position:
  zoom_w = zoom_tow = canvas_size
  zoom_h = zoom_toh = canvas_size
  zoom_x = zoom_tox = canvas_size / 2
  zoom_y = zoom_toy = canvas_size / 2
}

function max_iterations_changed(){
  let sel = max_iterations_select.value()
  if (sel === "auto"){
    return
  }
  max_iterations = sel
  frames_until_rerender = render_wait_frames
}

let mandelbrot_image
let max_iterations_select;

function setup() {
  // canvas_size = Math.min(windowWidth, windowHeight)
  createCanvas(canvas_size, canvas_size);

  mandelbrot_image = make_mandelbrot_image()

  let max_iterations_info = createElement('h5', 'number of iterations:');
  max_iterations_info.position(canvas_size+10, 0);

  max_iterations_select = createSelect();
  max_iterations_select.position(canvas_size+10, 40);
  max_iterations_select.option(100)
  max_iterations_select.option(250)
  max_iterations_select.option(500)
  max_iterations_select.option(750)
  max_iterations_select.option(1000)
  max_iterations_select.option(1500)
  max_iterations_select.option(5000)
  max_iterations_select.option("auto")
  max_iterations_select.changed(max_iterations_changed)




  // initial zoom position:
  zoom_w = zoom_tow = canvas_size
  zoom_h = zoom_toh = canvas_size
  zoom_x = zoom_tox = canvas_size / 2
  zoom_y = zoom_toy = canvas_size / 2
}


function draw() {
  background(55);

  //mandelbrot_image.save('saved-image', 'png');

  //tween/smooth motion
  zoom_x = lerp(zoom_x, zoom_tox, .1);
  zoom_y = lerp(zoom_y, zoom_toy, .1);
  zoom_w = lerp(zoom_w, zoom_tow, .1); // new width of image
  zoom_h = lerp(zoom_h, zoom_toh, .1); // new height of image

  let new_img_x = zoom_x-zoom_w/2
  let new_img_y = zoom_y-zoom_h/2

  image(mandelbrot_image,new_img_x, new_img_y, zoom_w, zoom_h);
  textSize(8);
  fill(255, 255, 255);

  let a_coord = ((min_x+max_x)/2)
  let b_coord = ((min_y+max_y)/2)
  text('a:'+a_coord, 5, 10);
  text('b:'+b_coord, 5, 20)

  let zoom_pow = Math.floor(Math.log10((1/(max_x - min_x)))) // might not be accurate
  text('Zoom: 10^'+zoom_pow, 5, 30)


  // console.log(frames_until_rerender)
  frames_until_rerender = frames_until_rerender - 1


  if (frames_until_rerender == render_wait_frames - 5){
    rerender(0.25) // start full resultion render if user didnt interact for render_wait_frames = 50
  }

  if (frames_until_rerender == 0){
    rerender(1) // start full resultion render if user didnt interact for render_wait_frames = 50
    frames_until_rerender = 5000
  }
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

