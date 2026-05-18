class Flashlight
{
  constructor(isGummy, width, height) 
  {
    this.wasOn = false;
    this.on = false;
    this.x = width / 2;
    this.y = height / 2;
    this.radius = 200;

    this.isGummy = isGummy;

    this.color = isGummy ? "#5bfaa2" : "#FFFFFF"; 

    this.maxBatterySegments = isGummy ? 84 : 4;
    this.batterySegments = isGummy ? 84 : 4;
    this.drainFactor = isGummy ? 2 : 0.01;
    this.segW = isGummy? 1 : 18;
    this.gap = isGummy? 0 : 4;

    this.batteryCount = 3;
    this.drain = 0;
  }
}

class Zone 
{
  constructor(x, y, w, h, action) 
  {
    this.x = x; 
    this.y = y; 
    this.w = w; 
    this.h = h;
    this.action = action;
  }

  contains(px, py) 
  {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }
  
  draw(ctx) 
  {
    ctx.strokeStyle = "transparent"; //transparent when finished
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}

class Room 
{
  constructor(name, imageSrc, zones = [], numTagX, numTagY, numTagW, numTagH, fontSize, floor = "fabric") 
  {
    this.name = name;
    this.image = new Image();
    this.image.src = imageSrc;
    this.zones = zones;  
    this.floor = floor;

    this.numTag = { x: numTagX, y: numTagY, w: numTagW, h: numTagH }; //ts SUCKS!!! so unoptimized BRUH!!
    this.fontSize = fontSize;
  }

  draw(ctx) 
  {
    ctx.drawImage(this.image, 0, 0);
    this.zones.forEach(z => z.draw(ctx));
  }

  handleClick(x, y) 
  {
    for (let z of this.zones) 
    {
      if (z.contains(x, y)) 
      {
        z.action();
        return;
      }
    }
  }

  roomLog()
  {
    console.log(this.name + " | " + this.fontSize + " | " + this.numTag.x + ", " + this.numTag.y + ", " + this.numTag.w + ", " + this.numTag.h + ", " + this.floor);
  }
}

// class Player
// {
//   constructor(items, health)
//   {
//     this.items = items;
//     this.health = health;
//     this.isHidden = false;
//   }
// }

class SoundPlayer
{
  constructor()
  {
    let bg = null;
    let a = null;
  }

  playSFX(audio)
  {
    let a = new Audio("mus/"+audio.path);
    a.volume = audio.vol;

    let min = audio.min ?? 1;
    let max = audio.max ?? 1;

    a.preservesPitch = false;
    a.playbackRate = Math.random() * (max - min) + min;

    console.log(audio.path, (Math.round((a.volume + Number.EPSILON) * 100) / 100), (Math.round((a.playbackRate + Number.EPSILON) * 100) / 100));

    a.play();
  }
  
  playBG(audio)
  {
    let bg = new Audio("mus/"+audio.path);
    bg.volume = audio.vol;
    bg.loop = true;

    bg.play();
  }

  stopBG()
  {
    this.bg.pause();
    this.bg.currentTime = 0;
  }
}