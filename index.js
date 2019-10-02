


class Paddle {
	constructor(game){
		
		this.gameWidth=game.gamewidth;
		this.width=150;
		this.height=30;
		this.maxSpeed=4;
		this.speed=0;
		
		this.position={
			x: game.gamewidth/2-this.width/2,
			y: game.gameheight-this.height-10
		};
		
	}
	
	moveLeft(){	//move paddle left
		this.speed=-this.maxSpeed;
	}
	
	moveRight(){
		this.speed=this.maxSpeed;
	}
	
	draw(ctx){
		
		ctx.fillStyle="#0ff";
		ctx.fillRect(this.position.x,this.position.y,this.width,this.height);
		
	}
	stop(){
		this.speed=0;
	}
	
	update(delta_time){
		
		this.position.x += this.speed;
		if(this.position.x<0) this.position.x=0;	//prevent paddle from moving off-screen
		if(this.position.x+this.width>this.gameWidth) this.position.x=this.gameWidth-this.width;	//prevent paddle from moving off-screen
	}
}

class InputHandler{
	constructor (paddle,game){
		document.addEventListener("keydown",(event)=> /* pass keypress to function*/{	
			
			switch(event.keyCode){
				case 37:	//left key
					paddle.moveLeft();
					break;
				case 39:	//right key
					paddle.moveRight();
					break;
				case 27:	//esc key
					game.togglePause();
					break;
				case 32:	//spacebar
					game.start();
					break;
			}
		});
		
		document.addEventListener("keyup",(event)=> /* pass key release to function*/{	
			
			switch(event.keyCode){
				case 37:
					if (paddle.speed<0)	paddle.stop();	//if right key is not being pressed (this prevents freezing up of the paddle)
					break;
				case 39:
					if (paddle.speed>0) paddle.stop();	//if left key is not being pressed
					break;
				
			}
		});
	}
}

class Ball{
	constructor(game){
		this.image=document.getElementById('img_ball');
		this.game=game;
		this.size=16;
		this.reset();
		this.gamewidth=game.gamewidth;
		this.gameheight=game.gameheight;
	}
	reset(){
		this.position={x:parseInt(Math.random()*300),y:parseInt((Math.random()*300)+100)};
		this.speed={x:2.9, y:-2.9};
	}
	draw(ctx){
		ctx.drawImage(this.image,this.position.x,this.position.y,this.size,this.size);
	}
	update(delta_time){
		this.position.x+=this.speed.x;
		this.position.y+=this.speed.y;
		
		//collision
		/*collision with vertical walls*/
		if (this.position.x+this.size>this.gamewidth || this.position.x<0){
			this.speed.x=-this.speed.x;
		}
		/*collision with top wall*/
		if (this.position.y<0){
			this.speed.y=-this.speed.y;
		}
		/*bottom wall*/
		if(this.position.y+this.size>this.gameheight){
			this.game.lives--;
			this.reset();
		}
		if (detectCollision(this,this.game.paddle)){	//check collision between ball and paddle
			this.speed.y=-this.speed.y;
			this.position.y=this.game.paddle.position.y-this.size;
		}
	}
}
class Brick{
	constructor(game,position){
		this.image=document.getElementById('img_brick');
		this.game=game;
		this.position=position;
		this.width=80;
		this.height=24;
		this.markedforDeletion=false;
	}
	update(){
		if(detectCollision(this.game.ball,this)){
			this.game.ball.speed.y=-this.game.ball.speed.y;
			this.markedforDeletion=true;
		}
	}
	draw(ctx){
		ctx.drawImage(this.image,this.position.x,this.position.y,this.width,this.height);
	}
}






class Game{
	constructor(gamewidth,gameheight){
		this.gamewidth=gamewidth;
		this.gameheight=gameheight;
		this.gamestate=game_state.menu;
		this.paddle=new Paddle(this);
		this.ball=new Ball(this);
		new InputHandler(this.paddle,this);
		this.gameObjects=[];
		this.lives=3;
		this.bricks=[];
		this.levels=[level_one,level_two,level_three];
		this.currentLevel=0;
		
	}
	
	start(){
		
		if(this.gamestate!==game_state.menu && this.gamestate!== game_state.new_level) return;
		this.bricks=buildLevel(this,this.levels[this.currentLevel]);
		this.ball.reset();
		
		this.gameObjects=[this.ball,this.paddle];
		this.gamestate=game_state.running;	//start the game
		
	}
	
	update(delta_time){
		if(this.lives===0) this.gamestate=game_state.game_over;
		if(this.gamestate===game_state.paused || this.gamestate===game_state.menu || this.gamestate===game_state.game_over) return;
		if(this.bricks.length===0){
			this.currentLevel++;
			if (this.currentLevel>this.levels.length){	//display winning screen if levels are exhausted
				this.gamestate=game_state.finished;
				return
			}
			
			this.gamestate=game_state.new_level;
			this.start();
		} 
		[...this.gameObjects, ...this.bricks].forEach((object) => object.update(delta_time));
		this.gameObjects.forEach((object) => object.update(delta_time));
		this.bricks=this.bricks.filter(brick=>!brick.markedforDeletion);
	
	}
	
	draw(ctx){
		[...this.gameObjects,...this.bricks].forEach((object) => object.draw(ctx));
		
		//paused state
		if (this.gamestate===game_state.paused){
			ctx.rect(0,0,this.gamewidth,this.gameheight);
			ctx.fillStyle="rgba(0,0,0,0.5)";
			ctx.fill();
			
			ctx.font="30px Arial";
			ctx.fillStyle="white";
			ctx.textAlign="center";
			ctx.fillText("Paused. Press 'esc' to resume",this.gamewidth/2,this.gameheight/2);
		}
		
		//menu state
		if (this.gamestate===game_state.menu){
			ctx.rect(0,0,this.gamewidth,this.gameheight);
			ctx.fillStyle="rgba(0,0,0,1)";
			ctx.fill();
			
			ctx.font="30px Arial";
			ctx.fillStyle="white";
			ctx.textAlign="center";
			ctx.fillText("Press SPACEBAR to start",this.gamewidth/2,this.gameheight/2);
		}
		//game over state
		if (this.gamestate===game_state.game_over){
			ctx.rect(0,0,this.gamewidth,this.gameheight);
			ctx.fillStyle="rgba(0,0,0,1)";
			ctx.fill();
			
			ctx.font="30px Arial";
			ctx.fillStyle="white";
			ctx.textAlign="center";
			ctx.fillText("Game Over! Reload webpage to play again",this.gamewidth/2,this.gameheight/2);
		}
		//finished game
		if (this.gamestate===game_state.finished){
			ctx.rect(0,0,this.gamewidth,this.gameheight);
			ctx.fillStyle="rgba(0,0,0,1)";
			ctx.fill();
			
			ctx.font="30px Arial";
			ctx.fillStyle="white";
			ctx.textAlign="center";
			ctx.fillText("You Won!!! Reload page to play again",this.gamewidth/2,this.gameheight/2);
			
		}
	
	}
	togglePause(){
		
		if (this.gamestate==game_state.paused){
			this.gamestate=game_state.running;
		}
		else{
			this.gamestate=game_state.paused;
		}
	}
}
function detectCollision(ball,gameObject){
	let bottomOfBall=ball.position.y+ball.size;
	let topOfBall=ball.position.y;
	let topOfObject=gameObject.position.y;
	let leftSideOfObject=gameObject.position.x;
	let rightSideOfObject=gameObject.position.x+gameObject.width;
	let bottomOfObject=gameObject.position.y+gameObject.height;
	
	if (bottomOfBall>=topOfObject && topOfBall<=bottomOfObject && ball.position.x>=leftSideOfObject && ball.position.x+ball.size <=rightSideOfObject){
		return true;
	} else{
		return false;
	}
}
function buildLevel(game,level){
	let bricks=[];
	
	level.forEach((row, rowIndex) => {
	row.forEach((brick, brickIndex) => {
	  if (brick === 1) {
		let position = {
		  x: 80 * brickIndex,
		  y: 70 + 24 * rowIndex
		};
		bricks.push(new Brick(game, position));
	  }
	});
	});

	return bricks;
}
//game loop - runs every frame
function gameLoop(timestamp){
	let delta_time=timestamp-lasttime;	//calculate elapsed time
	lasttime=timestamp;
	
	ctx.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);	//clear screen
	game.update(delta_time);
	game.draw(ctx);
	
	requestAnimationFrame(gameLoop);	//request next animation frame from gameloop
}
const level_one=[[0,0,0,0,0,0,0,1,0,0]];
const level_two=[[0,1,1,0,0,0,0,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1]];
const level_three=[[1,1,1,0,1,1,0,1,1,0],[1,0,1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0,1,0],[0,0,0,0,0,1,0,0,0,0]];

const game_state={
	paused:0,
	running:1,
	menu:2,
	game_over:3,
	new_level:4,
	finished:5
};
let canvas=document.getElementById("gamescreen");	//the let keyword limits the scope of variable, as opposed to var that deeclares global variable
let ctx=canvas.getContext('2d');	//sets context, can be 3d or 2d
const GAME_WIDTH=800;
const GAME_HEIGHT=600;
ctx.clearRect(0,0,800,600);	//clear the screen
/* the clear method is frequently used in games on the canvas to draw afresh on each frame of the game
*	this ensures that elements previously drawn on the screen are removed, else we would be drawing on top
*	of them. 
*/

let game=new Game(GAME_WIDTH,GAME_HEIGHT);



let lasttime=0;





requestAnimationFrame(gameLoop);


