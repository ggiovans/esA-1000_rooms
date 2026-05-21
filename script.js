'use strict';

const BGambience = { path: "ambience.ogg", vol: 0.35 };

const SFXa200despawn = { path: "a200despawn.mpeg", vol: 1.0, min: 0.85, max: 1.15};
const SFXa200spawn = { path: "a200spawn.mpeg", vol: 1.0, min: 0.85, max: 1.15 };

const SFXcharge = { path: "charge.mpeg", vol: 0.1, min: 0.95, max: 1.05 };
const SFXfirstdoor = { path: "firstdoor.mpeg", vol: 0.1, min: 0.95, max: 1.05 };
const SFXdoor = { path: "door.mpeg", vol: 0.35, min: 0.95, max: 1.05 };

const SFXhide = { path: "hide.ogg", vol: 1.0, min: 0.98, max: 1.02 };
const SFXtitle = { path: "title.mpeg", vol: 1.0, min: 1, max: 1 };

const SFXflashlight = { path: "flashlight.mpeg", vol: 0.5, min: 0.95, max: 1.05 };

const SFXfootstepsFabric = { path: "foostepsFabric.mp3", vol: 0.15, min: 0.70, max: 1.30 };
const SFXaltfootstepsFabric = { path: "foostepsFabric2.mp3", vol: 0.15, min: 0.70, max: 1.30 };

const SFXfootstepsMetal = { path: "footstepsMetal.mpeg", vol: 0.15, min: 0.95, max: 1.05 };
const SFXfootstepsGrass = { path: "footstepsGrass.mpeg", vol: 0.15, min: 0.95, max: 1.05 };
const SFXfootstepsPlastic = { path: "footstepsPlastic.mpeg", vol: 0.15, min: 0.95, max: 1.05 };

class Game 
{
  constructor(canvasId) 
  {
    this.sp = new SoundPlayer();

    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.rooms = [];
    this.currentRoom = new Room("lobby", "assets/room0.png", 
      [
        new Zone(466, 349, 69, 94, () => this.goToNext()),
      ], 469, 321, 63, 21, "15px"
    );

    this.currentRoom.roomLog();

    this.isHidden = false; //replace with character?

    this.doorNum = 1;
    this.nextRoom = null;
    this.cooldown = 0;
    
    this.fadeAlpha = 0;
    this.fadeDirection = 0;
    this.lightAlpha = Math.floor(Math.random() * 2) == 0? 0 : 0.9;

    this.darkCanvas = document.createElement("canvas");
    this.darkCtx = this.darkCanvas.getContext("2d");
    this.darkCanvas.width = this.canvas.width;
    this.darkCanvas.height = this.canvas.height;

    this.flashlight = new Flashlight(Math.floor(Math.random() * 2) == 0, this.canvas.width, this.canvas.height);

    this.canvas.addEventListener("mousemove", (e) =>
    {
      let rect = this.canvas.getBoundingClientRect();

      this.flashlight.x = e.clientX - rect.left;
      this.flashlight.y = e.clientY - rect.top;
    });

    window.addEventListener("keydown", (e) =>
    {
      if(e.key.toLowerCase() === "f")
      {
        this.flashlight.on = !this.flashlight.wasOn;
        this.flashlight.wasOn = this.flashlight.on;
        this.sp.playSFX(SFXflashlight);
      }
    });

    window.addEventListener("keydown", (e) =>
    {
      if(e.key.toLowerCase() === "r")
      {
        this.sp.playSFX(SFXcharge); //replace with battery recharge
        this.flashlight.on = this.flashlight.wasOn;

        if(this.flashlight.isGummy)
        {
          this.flashlight.batterySegments = Math.min(this.flashlight.batterySegments + 12, this.flashlight.maxBatterySegments);
        }
        else if(this.flashlight.batteryCount > 0)
        {
          this.flashlight.batteryCount--;
          this.flashlight.batterySegments = 4;
          this.flashlight.drain = 0;
        }
      }
    });

    this.init();
  }

  init() 
  {
    this.rooms = //replace with json later?? nah
    [
      new Room("standard_2locks", "assets/room1.png", 
      [
        new Zone(457, 310, 87, 120, () => this.goToNext()),
        new Zone(219, 316, 84, 119, () => this.hide()),
      ], 460, 274, 81, 27, "18px"),

      new Room("alt_standard_2locks", "assets/room2.png", 
      [
        new Zone(457, 310, 87, 120, () => this.goToNext()),
      ], 460, 274, 81, 27, "18px"),    
      
      new Room("r_3locks", "assets/room3.png", 
      [
        new Zone(301, 303, 97, 133, () => this.goToNext()),
      ], 305, 263, 90, 30, "20px"),

      new Room("r_corner_table", "assets/room4.png", 
      [
        new Zone(405, 347, 60, 82, () => this.goToNext()),
      ], 407, 323, 55, 18, "14px"),

      new Room("hallway", "assets/room5.png", 
      [
        new Zone(479, 357, 88, 120, () => this.goToNext()),
      ], 483, 321, 80, 27, "18px"),

      new Room("alt_r_corner_table", "assets/room6.png", 
      [
        new Zone(535, 347, 60, 82, () => this.goToNext()),
      ], 538, 323, 55, 18, "14px"),

      new Room("alt_r_3locks", "assets/room7.png", 
      [
        new Zone(601, 303, 98, 133, () => this.goToNext()),
      ], 605, 263, 90, 30, "20px")
    ];
    
    this.canvas.addEventListener("click", (e) => {
      let rect = this.canvas.getBoundingClientRect();
      let x = e.clientX - rect.left, y = e.clientY - rect.top;
      this.currentRoom.handleClick(x, y);
    });

    this.canvas.addEventListener("mousemove", (e) =>
    {
      let rect = this.canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      let hoveringDoor = this.currentRoom.zones.some(z =>
        x >= z.x && x <= z.x + z.w &&
        y >= z.y && y <= z.y + z.h
      );

      if(this.lightAlpha < 0.95 || this.flashlight.on)
        this.canvas.style.cursor = hoveringDoor ? "pointer" : "default";
    });

    this.ctx.textBaseline = "middle"; //might be moved if I wanna have subtitles as well
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "black";
    this.ctx.font = `bold ${this.currentRoom.fontSize} Calibri`;

    this.showMessage("A-" + ((this.doorNum).toString().padStart(3, "0"))); //first load of number tag

    this.loop();
  }

  randomRoom() 
  {
    let tmp;

    do
    {
      tmp = this.rooms[Math.floor(Math.random() * this.rooms.length)];
    } while(tmp.name == this.currentRoom.name);
        
    tmp.roomLog();

    let sfx = SFXfootstepsFabric;
    switch(tmp.floor)
    {
      case "metal": sfx = SFXfootstepsMetal; break;
      case "grass": sfx = SFXfootstepsGrass; break;
      case "plastic": sfx = SFXfootstepsPlastic; break;
      default: if(Math.floor(Math.random() * 2) == 0) sfx = SFXaltfootstepsFabric;
    }

    this.sp.playSFX(sfx);

    return new Room(tmp.name, tmp.image.src, tmp.zones, tmp.numTag.x, tmp.numTag.y, tmp.numTag.w, tmp.numTag.h, tmp.fontSize, tmp.floor); //wtf is THIS!!
  }

  goToNext() 
  {
    if(this.clickCooldown > 0) 
      return;

    this.clickCooldown = 105;

    this.doorNum++;
    this.startTransition(this.randomRoom());

    this.sp.playSFX(SFXdoor);
  }

  hide() 
  {
    console.log("hide");
  }

  // spawnEnemy() 
  // {
  //   this.showMessage("Enemy appears!");
  //   // Example: handle movement separately...
  // }

  update()
  {
    if(this.fadeDirection !== 0)
    {
      this.fadeAlpha += 0.025 * this.fadeDirection;

      if(this.fadeAlpha >= 1)
      {
        this.fadeAlpha = 1;

        this.currentRoom = this.nextRoom;
        this.showMessage("A-" + ((this.doorNum).toString().padStart(3, "0")));

        this.fadeDirection = -1;
      }

      if(this.fadeAlpha <= 0)
      {
        this.fadeAlpha = 0;
        this.fadeDirection = 0;
      }
    }

    if(this.clickCooldown > 0)
    {
      this.clickCooldown--;
    }

    if(this.flashlight.on)
    {
      this.flashlight.drain += this.flashlight.drainFactor;
    }

    if(this.flashlight.drain >= 25)
    {
      this.flashlight.batterySegments--;
      this.flashlight.drain = 0;
    }

    if(this.flashlight.batterySegments <= 0)
    {
      this.flashlight.on = false;
    }
  }

  draw()  //idfk what any of this does 
  {
    if (!this.currentRoom.image.complete) return;

    this.currentRoom.draw(this.ctx);

    let text = this.message;
    this.ctx.font = `bold ${this.currentRoom.fontSize} Calibri`;

    const tag = this.currentRoom.numTag;

    let m = this.ctx.measureText(text);

    let centerX = tag.x + tag.w / 2;
    let centerY = tag.y + tag.h / 2;

    let x = centerX;
    let y = centerY + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;

    this.ctx.fillText(text, x, y);

    this.darkCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.darkCtx.clearRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    this.darkCtx.globalCompositeOperation = "source-over";
    this.darkCtx.globalAlpha = this.lightAlpha;
    this.darkCtx.fillStyle = "black";
    this.darkCtx.fillRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    if(this.flashlight.on)
    {
      let r = this.flashlight.radius;

      this.darkCtx.globalCompositeOperation = "destination-out";

      let g = this.darkCtx.createRadialGradient(this.flashlight.x, this.flashlight.y, 0, this.flashlight.x, this.flashlight.y, r);

      let strenght = [0.37, 0.35, 0];

      if(this.flashlight.batterySegments <= Math.ceil(this.flashlight.maxBatterySegments / 2) || true)
      {
        strenght[0] *= Math.min(0.75 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, 0.4);
        strenght[1] *= Math.min(0.75 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, 0.4);

        r = Math.min(this.flashlight.radius * 3.5 * this.flashlight.batterySegments / this.flashlight.maxBatterySegments, this.flashlight.radius);
      }

      g.addColorStop(0, "rgba(0,0,0," + strenght[0] + ")"); //37, 35, 0
      g.addColorStop(0.3, "rgba(0,0,0," + strenght[1] + ")");
      g.addColorStop(1, "rgba(0,0,0," + strenght[2] + ")");

      this.darkCtx.fillStyle = g;

      this.darkCtx.beginPath();
      this.darkCtx.arc(this.flashlight.x, this.flashlight.y, r, 0, Math.PI * 2);
      this.darkCtx.fill();

      this.darkCtx.globalCompositeOperation = "source-over";
      this.darkCtx.globalAlpha = 1;

      let glow = this.darkCtx.createRadialGradient(this.flashlight.x, this.flashlight.y, 0, this.flashlight.x, this.flashlight.y, r);
      
      if(!this.flashlight.isGummy)
      {
        glow.addColorStop(0, "rgba(255, 220, 40, 0.14)");
        glow.addColorStop(0.4, "rgba(255, 200, 30, 0.08)");
        glow.addColorStop(1, "rgba(255, 160, 20, 0)"); 
      }
      else
      {
        glow.addColorStop(0, "rgba(0, 255, 50, 0.22)");
        glow.addColorStop(0.2, "rgba(0, 180, 40, 0.20)");
        glow.addColorStop(0.4, "rgba(0, 180, 40, 0.15)");
        glow.addColorStop(1, "rgba(0, 90, 30, 0)");
      }

      this.darkCtx.fillStyle = glow;

      this.darkCtx.beginPath();
      this.darkCtx.arc(this.flashlight.x, this.flashlight.y, r, 0, Math.PI * 2);

      this.darkCtx.fill();
    }

    let steppedFade = Math.round(this.fadeAlpha * 3) / 3;

    this.darkCtx.globalCompositeOperation = "source-over";
    this.darkCtx.globalAlpha = steppedFade;
    this.darkCtx.fillStyle = "black";
    this.darkCtx.fillRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    this.ctx.drawImage(this.darkCanvas, 0, 0);

    this.drawUI();
  }

  drawUI()
  {
    const x = 10;
    const y = this.canvas.height - 50;

    const segH = 38;
    const segW = this.flashlight.segW;
    const gap = this.flashlight.gap;

    this.ctx.save();

    this.ctx.fillStyle = this.flashlight.color;
    this.ctx.strokeStyle = this.flashlight.color;
    this.ctx.lineWidth = 2;

    this.ctx.strokeRect(x, y, segW * this.flashlight.maxBatterySegments + gap * 3 + 8, segH);
    this.ctx.fillRect(x + segW * this.flashlight.maxBatterySegments + gap * 3 + 8, y + 8, 5, segH / 2);

    for(let i = 0; i < this.flashlight.batterySegments; i++)
    {
      this.ctx.fillRect(x + 4 + i * (segW + gap), y + 4, segW, segH - 8);
    }

    if(!this.flashlight.isGummy && this.flashlight.batteryCount > 0)
    {
      this.ctx.font = "24px Calibri";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("X" + this.flashlight.batteryCount, x + 105, y + segH / 2);
    }

    this.ctx.restore();
  }

  loop() 
  {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  showMessage(text) 
  {
    this.message = text;
    console.log(text + " | " + (Math.round((this.lightAlpha + Number.EPSILON) * 100) / 100));
  }

  doorAnimation() //maybe another time :P
  {

  }

  startTransition(newRoom)
  {
    this.canvas.style.cursor = "default";
    this.nextRoom = newRoom;
    this.fadeDirection = 1;

    this.lightAlpha = Math.min(this.lightAlpha + 0.005, 1);
  }
}

window.onload = () => 
{
  const game = new Game("game");

  setTimeout(function() 
  {
    game.sp.playSFX(SFXtitle);
    game.sp.playBG(BGambience);
  }, 1800);

  game.sp.playSFX(SFXfirstdoor);
};
