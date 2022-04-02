let progress = 0

function doSomething(){
  for (let i = 0; i < width; i++){
    wait_millis(10)
    progress = i
    redraw()
  }
}

function setup() {
  createCanvas(500, 500);
}

function draw() {
  background(255);
  noStroke()
  fill(255,0,0);

  console.log(progress)  // Works perfectly fine
  rect(0,0,progress,10)  // Does nothing until doSomething finisehd
}

function mouseClicked() {
  doSomething()
}

function wait_millis(ms){
  const start = (new Date()).getTime()
  let end = start
  while (end - start < ms) {
    end = (new Date()).getTime()
  }
}