let min_x = -2.3
let max_x = 0.8
let min_y = -1.5
let max_y = 1.5

// min_x = -1
// max_x = 1
// min_y = -1
// max_y = 1

let max_iterations = 100
let infinity = 999
let image_size = 720

// ZOOM:
var zoom_w, zoom_h, zoom_tow, zoom_toh;
var zoom_x, zoom_y, zoom_tox, zoom_toy;
var zoom_step = .001; //zoom step per mouse tick 

function mandelbrot(x, y){
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
  let coordinate_a = map(x,0,image_size,min_x, max_x)
  let coordinate_b = map(y,0,image_size,min_y, max_y)
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

function make_mandelbrot_image(){
  let img = createImage(image_size, image_size);
  img.loadPixels()
  for (let x = 0; x < image_size; x++){
    for(let y = 0; y < image_size; y++){
      let color = mandelbrot(x, y)
      let pixel = (x+y*width)*4
      img.pixels[pixel+0] = color // r value
      img.pixels[pixel+1] = color // g value
      img.pixels[pixel+2] = color // b value
      img.pixels[pixel+3] = 255 // h value
    }
  }
  img.updatePixels()
  //img.save('saved-image', 'png');
  return img
}


function update_boundaries(){

  max_iterations = max_iterations_input.value()
  // infinity = infinity_value_input.value()

  let new_img_x = zoom_x-zoom_w/2
  let new_img_y = zoom_y-zoom_h/2
  let new_img_w = zoom_w
  let new_img_h = zoom_h

  let percentage_top_left_x = -1 * new_img_x / new_img_w
  let percentage_top_left_y = -1 * new_img_y / new_img_h
  let percentage_w = image_size / new_img_w
  let percentage_h = image_size / new_img_h
  
  let new_top_left_x = image_size * percentage_top_left_x
  let new_top_left_y = image_size * percentage_top_left_y
  let new_bottom_right_x = new_top_left_x + (percentage_w * image_size)
  let new_bottom_right_y = new_top_left_y + (percentage_h * image_size)

  let new_min_x = map(new_top_left_x,0,image_size,min_x, max_x)
  let new_max_x = map(new_bottom_right_x,0,image_size,min_x, max_x)
  let new_min_y = map(new_top_left_y,0,image_size,min_y, max_y)
  let new_max_y = map(new_bottom_right_y,0,image_size,min_y, max_y)

  console.log(new_min_x+","+new_max_x)
  console.log(new_min_y+","+new_max_y)

  min_x = new_min_x
  max_x = new_max_x
  min_y = new_min_y
  max_y = new_max_y

  mandelbrot_image = make_mandelbrot_image()

  // initial zoom position:
  zoom_w = zoom_tow = image_size
  zoom_h = zoom_toh = image_size
  zoom_x = zoom_tox = image_size / 2
  zoom_y = zoom_toy = image_size / 2
}


let mandelbrot_image
let max_iterations_input, infinity_value_input, update_button;

function setup() {
  image_size = Math.min(windowWidth, windowHeight)
  createCanvas(image_size, image_size);

  mandelbrot_image = make_mandelbrot_image()

  let max_iterations_info = createElement('h5', 'number of iterations:');
  max_iterations_info.position(image_size+10, 0);

  max_iterations_input = createInput(max_iterations, int);
  max_iterations_input.position(image_size+10, 40);

  // let infinity_info = createElement('h5', 'infinity value:');
  // infinity_info.position(image_size+10, 50);

  // infinity_value_input = createInput(infinity, int);
  // infinity_value_input.position(image_size+10, 90);

  update_button = createButton('Rerender Current View');
  update_button.position(image_size+10, 70);
  update_button.mousePressed(update_boundaries);

  // initial zoom position:
  zoom_w = zoom_tow = image_size
  zoom_h = zoom_toh = image_size
  zoom_x = zoom_tox = image_size / 2
  zoom_y = zoom_toy = image_size / 2
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
}


function mouseDragged() {
  if (mouseX > image_size || mouseY > image_size){
    return
  }
  zoom_tox += (mouseX-pmouseX)*0.3;
  zoom_toy += (mouseY-pmouseY)*0.3;
}


function mouseWheel(event) {

  if (mouseX > image_size || mouseY > image_size){
    return
  }

  var e = -event.delta;

  if (e>0) { //zoom in
    for (var i=0; i<e; i++) {
      if (zoom_tow>30*image_size) return; //max zoom
      zoom_tox -= zoom_step * (mouseX - zoom_tox);
      zoom_toy -= zoom_step * (mouseY - zoom_toy);
      zoom_tow *= zoom_step+1;
      zoom_toh *= zoom_step+1;
    }
  }
  
  if (e<0) { //zoom out
    for (var i=0; i<-e; i++) {
      if (zoom_tow<image_size) return; //min zoom
      zoom_tox += zoom_step/(zoom_step+1) * (mouseX - zoom_tox); 
      zoom_toy += zoom_step/(zoom_step+1) * (mouseY - zoom_toy);
      zoom_toh /= zoom_step+1;
      zoom_tow /= zoom_step+1;
    }
  }
}

