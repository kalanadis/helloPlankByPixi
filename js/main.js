"use strict";
//<a href="https://www.freepik.com/free-photos-vectors/background">Background photo created by efe_madrid - www.freepik.com</a>
import * as PIXI from 'pixi.js';
import * as PLANK from 'planck-js';


document.addEventListener("DOMContentLoaded", init);

//Rendering
var renderer;
var stage;

//LOOP
var tLastFrame = 0;
var tDelta = 0;
var request_Anim_ID;
var isPaused = false;
var isLoaded = false;

//Game
var ball_sprite;
var PIXI_Loader;

//PLANK js PHYSICS
var plank_world;
var ball_body;

function init() {

    renderer = new PIXI.Renderer({ width: 576, height: 1024, transparent: true, autoDensity: true });
    renderer.autoResize = true;

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;

    stage = new PIXI.Container();

    renderer.render(stage);

    document.body.appendChild(renderer.view);

    window.onresize = resize;

    document.addEventListener("visibilitychange", onVisibilityChanged, false);
    document.addEventListener("mozvisibilitychange", onVisibilityChanged, false);
    document.addEventListener("webkitvisibilitychange", onVisibilityChanged, false);
    document.addEventListener("msvisibilitychange", onVisibilityChanged, false);

    resize();

    //Load Assets
    PIXI_Loader = new PIXI.Loader;
    PIXI_Loader
        .add([
            "images/intro.png",
            "images/ball.png",
            "images/bg.png"
        ])
        .on("progress", loadHandler)
        .on('complete', loadComplete)
        .load(setup);

    var graphics = new PIXI.Graphics();

    stage.addChild(graphics);

    var LoadingIconTex;
    var LoadingIconSprite;

    function loadHandler(loader, res) {

        resize();

        if (res.url === 'images/intro.png') {

            LoadingIconTex = PIXI_Loader.resources['images/intro.png'].texture;
            LoadingIconSprite = new PIXI.Sprite(LoadingIconTex);
            LoadingIconSprite.y = 150;
            LoadingIconSprite.x = 188;

            stage.addChild(LoadingIconSprite);

        }

        graphics.clear();

        graphics.beginFill(0x3333ff, 1);

        graphics.drawRect(163, 400, loader.progress * 2.5, 10);

        graphics.endFill();

        graphics.beginFill(0x3333ff, 0);

        graphics.lineStyle(2, 0xffffff, 1);

        graphics.drawRect(163, 400, 250, 10);

        graphics.endFill();

    }

    function loadComplete(loader, res) {

        stage.removeChild(graphics);
        stage.removeChild(LoadingIconSprite);
        //Keep for GC to clean !!!

    }

    function setup() {

        //ball
        /*
        Ball image size is 128*128 px, real football Diameter is approximately
        0.20 m, Plank.js units are measured in meters, so we need to define a
        unit conversion, for this example, 64px will be equal to 0.10m. 
        */

        var ball_tex = PIXI_Loader.resources["images/ball.png"].texture;
        ball_sprite = new PIXI.Sprite(ball_tex);

        ball_sprite.anchor.set(0.5, 0.5);

        //Init Physics world
        plank_world = PLANK.World(
            {
                gravity: PLANK.Vec2(0, -10)
            }
        );

        //create physics walls
        var walls = plank_world.createBody();
        walls.createFixture(PLANK.Edge(pixiPositionToPlank(64,960),pixiPositionToPlank(64,64)));
        walls.createFixture(PLANK.Edge(pixiPositionToPlank(64,960),pixiPositionToPlank(512,960)));
        walls.createFixture(PLANK.Edge(pixiPositionToPlank(512,960),pixiPositionToPlank(512,64)));
        walls.createFixture(PLANK.Edge(pixiPositionToPlank(64,64),pixiPositionToPlank(512,64)));
        
        //create ball and setup ball properties 
        var ball=plank_world.createDynamicBody(pixiPositionToPlank(288,512)).createFixture(PLANK.Circle(0.1),{density:10,restitution:0.5,friction:0.9});
        ball_body = ball.getBody();
        var po = plankPositionToPixi(ball_body.getPosition());
        ball_sprite.position.set(po.x,po.y);

        //bg     
        var bg_tex = PIXI_Loader.resources["images/bg.png"].texture;
        var bg_sprite = new PIXI.Sprite(bg_tex);

        //ADD FORCE
        
        ball_sprite.interactive = true;
        ball_sprite.on('pointerdown', (evt) => {

            console.log("CLICKED!!44");
            var p = pixiPositionToPlank(evt.data.global.x,evt.data.global.y);

            var f = PLANK.Vec2(ball_body.getPosition());
            
            f = f.sub(p);//force direction
            f.normalize();
            f.mul(2);//force magnitude
            ball_body.applyLinearImpulse(f, p, true);
            /*
            if(f.y>0){
                ball_body.applyLinearImpulse(f, p, true);
            }
            */
        });
        

        //collision check
        /*
        begin ==> handle begin event
        end ==> handle end event
        pre-solve ==> handle pre-solve event
        and post-solve ==> handle post-solve event
        */
        
        
        plank_world.on('pre-solve', function(contact, oldManifold) {
            var manifold = contact.getManifold();
        
            if (manifold.pointCount == 0) {
              return;
            }
            console.log("HIT!!");
            
        });
        
        stage.addChild(bg_sprite);
        stage.addChild(ball_sprite);

        resize();
        isLoaded = true;

    }

    tLastFrame = performance.now();
    game_update(tLastFrame);

}

//UTIL================

function pixiPositionToPlank(x, y) {
    /*
    Orientation Change
    ==================
    Pixi cordinate system      +
    -------------->+           ^
    |                          |
    |                          |
    |                  ==>     |
    |                          |
    v                           ------------->+
    +                           Plank cordinate system 
    */

    //change Y origin point and direction
    y=(y-1024)*-1;
    //convert pixels to meters (64px = 0.1m)
    y *= 0.0015625;
    x *= 0.0015625;
    
    return PLANK.Vec2(x,y);
}

function plankPositionToPixi(v) {


     /*
    Orientation Change
    ==================
    Pixi cordinate system      +
    -------------->+           ^
    |                          |
    |                          |
    |                  <==     |
    |                          |
    v                           ------------->+
    +                           Plank cordinate system 
    */

    
    //convert pixels to meters (64px = 0.1m)
    var retY = v.y*640;
    var retX = v.x*640;
    //change Y origin point and direction
    retY = (retY*-1)+1024;
    return { x: retX, y: retY };
}

function onVisibilityChanged() {
    if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden) {
        onAppPause(false);
    }
    else {
        onAppPause(true);
    }
}

function resize() {

    var w = 0;
    var h = 0;
    var ratio = 9 / 16;

    var y = 0;
    var x = 0;

    if (window.innerWidth > window.innerHeight * ratio) {
        w = window.innerHeight * ratio;
        h = window.innerHeight;

        x = (window.innerWidth - w) * 0.5;


    } else {
        w = window.innerWidth;
        h = window.innerWidth / ratio;

        y = (window.innerHeight - h) * 0.5;

    }

    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';

    renderer.view.style.margin = y + "px " + x + "px";

}

function onAppPause(status) {

    if (status) {

        if (isPaused) {
            tLastFrame = performance.now();
            game_update(tLastFrame);
            isPaused = false;
        }

    }
    else if (request_Anim_ID) {

        if (!isPaused) {
            cancelAnimationFrame(request_Anim_ID);
            isPaused = true;
        }

    }

}

//===========================

function game_update(tFrame) {

    tDelta = tFrame - tLastFrame;
    request_Anim_ID = requestAnimationFrame(game_update);

    if (isLoaded) {
        //Update Physics
        plank_world.step(tDelta * 0.001);
        var po = plankPositionToPixi(ball_body.getPosition());
        ball_sprite.position.set(po.x,po.y);
        ball_sprite.rotation = ball_body.getAngle()*-1;
    }

    tLastFrame = tFrame;
    renderer.render(stage);
}
