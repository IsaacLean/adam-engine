var canvasId = 'qpcr-crush';
var AE = new AdamEngine(canvasId);

AE.inputMan.addMBInput(0, 'LEFTCLICK');
AE.inputMan.addTouchInput();
AE.inputMan.setup();

AE.assetMan.newImg('bg', '/gfx/bg.jpg');
AE.assetMan.newAtlas('tiles', '/gfx/atlas.png', '/gfx/atlas.json');

var grid = AE.createWorldObj('grid');

grid.setup = function() {
  this.state.pos.x = 0;
  this.state.pos.y = 0;
  this.state.size.w = 650;
  this.state.size.h = 650;
  this.state.worldObjType = 'invis';
  this.spawnGrid();
};

grid.createGrid = function() {
  if (this.state.grid !== undefined) {
    this.clearGrid();
    this.state.tilesToDel = [];
  }

  this.state.grid = []; // grid visible to players
  this.state.gridCheck = []; // grid used to check if player moves are valid
  this.state.tilesCreated = 0;
  this.state.prevClickedTile = null;

  // swapping
  this.state.swapping = null;
  this.state.swapDone = 0;

  // fading
  this.state.fading = false;
  this.state.fadeDone = 0;
  this.state.tilesToDel = [];

  // falling
  this.state.falling = false;
  this.state.fallNum = 0;
  this.state.fallDone = 0;

  // appearing
  this.state.appearing = false;
  this.state.appearNum = 0;
  this.state.appearDone = 0;

  var currY = 0;
  var tileSize = 70;
  var marginYOffset = 2;
  var tileNames = ['BHQ2.png', 'FAM2.png', 'GOLD2.png', 'ORANGE2.png', 'QUASAR2.png', 'RED2.png'];

  // create tiles within grid
  for(var i=0; i < 9; ++i) {
    var row = [];
    var currX = 0;
    var marginXOffset = 2;

    for(var j=0; j < 9; ++j) {
      ++this.state.tilesCreated;
      var tile = AE.createWorldObj('tile' + this.state.tilesCreated);

      // default state vals
      tile.state.atlas = AE.assetMan.getAtlas('tiles');
      tile.state.pos.x = currX + marginXOffset;
      tile.state.pos.y = currY + marginYOffset;
      tile.state.size.w = tileSize;
      tile.state.size.h = tileSize;
      tile.state.zIndex = 2;
      tile.state.alpha = null;
      tile.state.worldObjType = 'img';

      // custom state vals
      tile.state.gridLoc = {x: j, y: i};

      // atlas state
      var atlas = tile.state.atlas.data;
      var randNum = Math.floor(Math.random() * (0, 6));
      var randTileName = tileNames[randNum];

      tile.state.tileType = randTileName;
      tile.state.img = tile.state.atlas.img;
      tile.state.imgData = {
        sx: atlas.frames[randTileName].frame.x,
        sy: atlas.frames[randTileName].frame.y,
        sw: atlas.frames[randTileName].sourceSize.w,
        sh: atlas.frames[randTileName].sourceSize.h
      };

      // move loc
      tile.state.moveTo = null;

      // move tile to moveTo destination
      tile.move = function() {
        if(this.state.pos.x < this.state.moveTo.x) {
          this.state.pos.x = this.state.pos.x + 2;
        } else if(this.state.pos.x > this.state.moveTo.x) {
          this.state.pos.x = this.state.pos.x - 2;
        }

        if(this.state.pos.y < this.state.moveTo.y) {
          this.state.pos.y = this.state.pos.y + 2;
        } else if(this.state.pos.y > this.state.moveTo.y) {
          this.state.pos.y = this.state.pos.y - 2;
        }
      };

      tile.update = function() {
        if(grid.state.swapping && (this.state.moveTo !== null)) {
          this.move();

          // add to swapDone to notify grid when all tiles are done moving
          if((this.state.pos.x === this.state.moveTo.x) && (this.state.pos.y === this.state.moveTo.y)) {
            this.state.moveTo = null;
            ++grid.state.swapDone;
          }
        }

        if(grid.state.fading && this.state.alpha) {
          // fade out the tile
          if(this.state.alpha > 0) {
            this.state.alpha = this.state.alpha - 0.2;
          } else {
            this.state.alpha = 0;
          }

          // add to fadeDone to notify grid when all tiles are done fading
          if(this.state.alpha === 0) {
            this.state.alpha = null;
            ++grid.state.fadeDone;
          }
        }

        if(grid.state.falling && (this.state.moveTo !== null)) {
          this.move();

          // add to fallDone to notify grid when all tiles are done falling
          if((this.state.pos.x === this.state.moveTo.x) && (this.state.pos.y === this.state.moveTo.y)) {
            this.state.moveTo = null;
            ++grid.state.fallDone;
          }
        }
      };

      row.push(tile);

      currX += tileSize;
      marginXOffset += 2;
    }

    this.state.grid.push(row);
    currY += tileSize;
    marginYOffset += 2;
  }
};

grid.spawnGrid = function() {
  // keep recreating grid until there isn't a match
  do {
    this.createGrid();
  } while(this.findMatches(this.state.grid));

  this.state.gridCheck = this.copyGrid(this.state.grid); // copy grid to gridCheck
  AE.updateRenderPipe();
};

grid.copyGrid = function(grid) {
  var newGrid = [];
  for(var y=0; y < grid.length; ++y) {
    newGrid[y] = grid[y].slice();
  }

  return newGrid;
};

grid.addTilesToDel = function(prevSameTiles) {
  if(prevSameTiles.length > 2) {
    console.log('>3 match occurred');
    for(var i in prevSameTiles) {
      var alreadyInTilesToDel = false;
      console.log(prevSameTiles[i].state.gridLoc.x, prevSameTiles[i].state.gridLoc.y);

      for(var j in this.state.tilesToDel) {
        if(this.state.tilesToDel[j].name === prevSameTiles[i].name) {
          alreadyInTilesToDel = true;
          break;
        }
      }

      if(alreadyInTilesToDel === false) {
        this.state.tilesToDel.push(prevSameTiles[i]);
      }
    }
    console.log('\n');

    return true;
  }
  return false;
};

grid.findMatches = function(grid) {
  var matchesFound = 0;

  // breadth check tiles
  console.log('X check');
  for(var y=0; y < 9; ++y) {
    var prevSameXTiles = [];
    for(var x=0; x < 9; ++x) {
      if(prevSameXTiles.length === 0) {
        prevSameXTiles.push(grid[y][x]);
      } else {
        // there is a match!
        if(prevSameXTiles[0].state.tileType === grid[y][x].state.tileType) {
          prevSameXTiles.push(grid[y][x]);
        } else {
          // match is broken
          if(this.addTilesToDel(prevSameXTiles)) {
            ++matchesFound;
          }

          prevSameXTiles = [];
          prevSameXTiles.push(grid[y][x]);
        }
      }
    }

    if(this.addTilesToDel(prevSameXTiles)) {
      ++matchesFound;
    }

  }

  // depth check tiles
  console.log('Y check');
  for(var x=0; x < 9; ++x) {
    var prevSameYTiles = [];
    for(var y=0; y < 9; ++y) {
      if(prevSameYTiles.length === 0) {
        prevSameYTiles.push(grid[y][x]);
      } else {
        // there is a match!
        if(prevSameYTiles[0].state.tileType === grid[y][x].state.tileType) {
          prevSameYTiles.push(grid[y][x]);
        } else {
          // match is broken
          if(this.addTilesToDel(prevSameYTiles)) {
            ++matchesFound;
          }

          prevSameYTiles = [];
          prevSameYTiles.push(grid[y][x]);
        }
      }
    }

    if(this.addTilesToDel(prevSameYTiles)) {
      ++matchesFound;
    }
  }

  return matchesFound;
};

grid.deleteTile = function(x, y) {
  var tile = this.state.grid[y][x];
  if(tile) {
    AE.deleteWorldObj(tile.name);
  }
  this.state.grid[y][x] = null;
  AE.updateRenderPipe();
};

grid.clearGrid = function() {
  for(var y=0; y < 9; ++y) {
    for(var x=0; x < 9; ++x) {
      this.deleteTile(x, y);
    }
  }
};

grid.tileClicked = function() {
  var mousePos = AE.inputMan.getMBState('LEFTCLICK').pos;

  // check if a tile was clicked
  for(var y=0; y < this.state.grid.length; ++y) {
    for(var x=0; x < this.state.grid.length; ++x) {
      var tile = this.state.grid[y][x];
        
      if(
        (mousePos.x < (tile.state.pos.x + tile.state.size.w)) &&
        (mousePos.x > tile.state.pos.x) &&
        (mousePos.y < (tile.state.pos.y + tile.state.size.h)) &&
        (mousePos.y > tile.state.pos.y)
      ) {
        return tile;
      }
    }
  }
};

grid.tilePressed = function() {
  var touch = {start: null, end: null};

  var touchState = AE.inputMan.getTouchState();

  // check if the touch path is valid
  for(var y=0; y < this.state.grid.length; ++y) {
    for(var x=0; x < this.state.grid.length; ++x) {
      var tile = this.state.grid[y][x];

      if(
        (touchState.pos.startX < (tile.state.pos.x + tile.state.size.w)) &&
        (touchState.pos.startX > tile.state.pos.x) &&
        (touchState.pos.startY < (tile.state.pos.y + tile.state.size.h)) &&
        (touchState.pos.startY > tile.state.pos.y)
      ) {
        touch.start = tile;
        this.state.prevClickedTile = touch.start;
        // touch.start.state.stroke = {
        //   pos: touch.start.state.pos,
        //   size: {w: touch.start.state.size.w, h: touch.start.state.size.h},
        //   color: '#FF0000'
        // };
      }

      if(
        (touchState.pos.endX < (tile.state.pos.x + tile.state.size.w)) &&
        (touchState.pos.endX > tile.state.pos.x) &&
        (touchState.pos.endY < (tile.state.pos.y + tile.state.size.h)) &&
        (touchState.pos.endY > tile.state.pos.y)
      ) {
        touch.end = tile;
      }
    }
  }

  return touch;
};

grid.validSwap = function(clickedTile, prevClickedTile) {
  if(
    (clickedTile.state.gridLoc.y === (prevClickedTile.state.gridLoc.y - 1) &&
    clickedTile.state.gridLoc.x === (prevClickedTile.state.gridLoc.x)) ||
    (clickedTile.state.gridLoc.x === (prevClickedTile.state.gridLoc.x + 1) &&
    clickedTile.state.gridLoc.y === prevClickedTile.state.gridLoc.y) ||
    (clickedTile.state.gridLoc.y === (prevClickedTile.state.gridLoc.y + 1) &&
    clickedTile.state.gridLoc.x === (prevClickedTile.state.gridLoc.x)) ||
    (clickedTile.state.gridLoc.x === (prevClickedTile.state.gridLoc.x - 1) &&
    clickedTile.state.gridLoc.y === prevClickedTile.state.gridLoc.y)
  ) {
    return true;
  }
  return false;
};

grid.processInput = function(clickedTile, prevClickedTile) {
  if(clickedTile) {
    console.log(this.state.grid);
    console.log('clicked a tile');
    // check if clicked tile is within range of prev
    if(prevClickedTile) {
      console.log('prevClickedTile is set');
      this.state.prevClickedTile.state.stroke = null;

      if(this.validSwap(clickedTile, prevClickedTile)) {
        console.log('swap is valid');
        // if player clicked up, right, down, or left of prevClickedTile
        var clickedTileGridLoc = clickedTile.state.gridLoc;
        var prevClickedTileGridLoc = prevClickedTile.state.gridLoc;

        var tempTile = this.state.gridCheck[clickedTileGridLoc.y][clickedTileGridLoc.x];
        this.state.gridCheck[clickedTileGridLoc.y][clickedTileGridLoc.x] = this.state.gridCheck[prevClickedTileGridLoc.y][prevClickedTileGridLoc.x];
        this.state.gridCheck[prevClickedTileGridLoc.y][prevClickedTileGridLoc.x] = tempTile;

        console.log(this.state.gridCheck);
        if(this.findMatches(this.state.gridCheck)) {
          console.log('match found');
          // if swap results to a match, updated grid
          var grid = this.state.grid;
          var gridCheck = this.state.gridCheck;

          var newClickedTile = gridCheck[prevClickedTileGridLoc.y][prevClickedTileGridLoc.x];
          var newPrevClickedTile = gridCheck[clickedTileGridLoc.y][clickedTileGridLoc.x];

          // begin swap animation
          var tile1 = grid[clickedTileGridLoc.y][clickedTileGridLoc.x];
          var tile2 = grid[prevClickedTileGridLoc.y][prevClickedTileGridLoc.x];

          this.state.swapping = {tile1: tile1, tile2: tile2};
          tile1.state.moveTo = {x: tile2.state.pos.x, y: tile2.state.pos.y};
          tile2.state.moveTo = {x: tile1.state.pos.x, y: tile1.state.pos.y};

          this.finishSwap = function() {
            // swap gridLoc
            var tempGridLoc = {x: newClickedTile.state.gridLoc.x, y: newClickedTile.state.gridLoc.y};
            newClickedTile.state.gridLoc.x = newPrevClickedTile.state.gridLoc.x;
            newClickedTile.state.gridLoc.y = newPrevClickedTile.state.gridLoc.y;
            newPrevClickedTile.state.gridLoc.x = tempGridLoc.x;
            newPrevClickedTile.state.gridLoc.y = tempGridLoc.y;

            this.state.grid = this.copyGrid(this.state.gridCheck); // update grid with valid gridCheck

            // delete tiles
            this.state.fading = true;

            // assign each tile an alpha value
            for(var i in this.state.tilesToDel) {
              var currTile = this.state.tilesToDel[i];
              currTile.state.alpha = 1;
            }
          };
        } else {
          this.state.gridCheck = this.copyGrid(this.state.grid); // sync grid check with grid
        }
      }
    }

    if(this.state.prevClickedTile) {
      this.state.prevClickedTile = null;
    } else {
      this.state.prevClickedTile = clickedTile;

      clickedTile.state.stroke = {
        pos: clickedTile.state.pos,
        size: {w: clickedTile.state.size.w, h: clickedTile.state.size.h},
        color: '#FF0000'
      };
    }
  }
};

grid.calcFall = function() {
  var gridSize = this.state.grid.length;

  for(var x=0; x < gridSize; ++x) {
    for(var y=0; y < gridSize; ++y) {
      // move tile to the cell below it if it is an empty space
      if(y < 8) {
        if((this.state.grid[y][x] !== null) && (this.state.grid[y + 1][x] === null)) {
          var tile = this.state.grid[y][x];

          // update tile state
          tile.state.moveTo = {x: tile.state.pos.x, y: ((y + 1) * 70) + (y * 2)};
          ++tile.state.gridLoc.y;

          // swap tile locs in grid
          this.state.grid[y + 1][x] = this.state.grid[y][x];
          this.state.grid[y][x] = null;

          // reset grid traversal
          x = 0;
          y = 0;
        }
      }
    }
  }

  // count how many tiles need to move
  for(var y=0; y < gridSize; ++y) {
    for(var x=0; x < gridSize; ++x) {
      if(this.state.grid[y][x]) {
        if(this.state.grid[y][x].state.moveTo !== null) {
          ++this.state.fallNum;
        }
      }
    }
  }
};

grid.spawnNewTiles = function() {
  var gridSize = this.state.grid.length;
  var tileNames = ['BHQ2.png', 'FAM2.png', 'GOLD2.png', 'ORANGE2.png', 'QUASAR2.png', 'RED2.png'];
  var tileSize = 70;

  for(var y=0; y < gridSize; ++y) {
    for(var x=0; x < gridSize; ++x) {
      if(this.state.grid[y][x] === null) {
        ++this.state.tilesCreated;
        var newTile = AE.createWorldObj('tile' + this.state.tilesCreated);

        // default state vals
        newTile.state.atlas = AE.assetMan.getAtlas('tiles');
        newTile.state.pos.x = (x * 70) + (x * 2);
        newTile.state.pos.y = (y * 70) + (y * 2);
        newTile.state.size.w = tileSize;
        newTile.state.size.h = tileSize;
        newTile.state.zIndex = 2;
        newTile.state.alpha = 0;
        newTile.state.worldObjType = 'img';

        // custom state vals
        newTile.state.gridLoc = {x: x, y: y};

        // atlas state
        var atlas = newTile.state.atlas.data;
        var randNum = Math.floor(Math.random() * (0, 6));
        var randTileName = tileNames[randNum];

        newTile.state.tileType = randTileName;
        newTile.state.img = newTile.state.atlas.img;
        newTile.state.imgData = {
          sx: atlas.frames[randTileName].frame.x,
          sy: atlas.frames[randTileName].frame.y,
          sw: atlas.frames[randTileName].sourceSize.w,
          sh: atlas.frames[randTileName].sourceSize.h
        };

        // move loc
        newTile.state.moveTo = null;

        // move tile to moveTo destination
        newTile.move = function() {
          if(this.state.pos.x < this.state.moveTo.x) {
            this.state.pos.x = this.state.pos.x + 2;
          } else if(this.state.pos.x > this.state.moveTo.x) {
            this.state.pos.x = this.state.pos.x - 2;
          }

          if(this.state.pos.y < this.state.moveTo.y) {
            this.state.pos.y = this.state.pos.y + 2;
          } else if(this.state.pos.y > this.state.moveTo.y) {
            this.state.pos.y = this.state.pos.y - 2;
          }
        };

        newTile.update = function() {
          if(grid.state.swapping && (this.state.moveTo !== null)) {
            this.move();

            // add to swapDone to notify grid when all tiles are done moving
            if((this.state.pos.x === this.state.moveTo.x) && (this.state.pos.y === this.state.moveTo.y)) {
              this.state.moveTo = null;
              ++grid.state.swapDone;
            }
          }

          if(grid.state.fading && this.state.alpha) {
            // fade out the tile
            if(this.state.alpha > 0) {
              this.state.alpha = this.state.alpha - 0.2;
            } else {
              this.state.alpha = 0;
            }

            // add to fadeDone to notify grid when all tiles are done fading
            if(this.state.alpha === 0) {
              this.state.alpha = null;
              ++grid.state.fadeDone;
            }
          }

          if(grid.state.falling && (this.state.moveTo !== null)) {
            this.move();

            // add to fallDone to notify grid when all tiles are done falling
            if((this.state.pos.x === this.state.moveTo.x) && (this.state.pos.y === this.state.moveTo.y)) {
              this.state.moveTo = null;
              ++grid.state.fallDone;
            }
          }

          if(grid.state.appearing && (this.state.alpha !== null)) {
            // fade out the tile
            if(this.state.alpha < 1) {
              this.state.alpha = this.state.alpha + 0.1;
            } else {
              this.state.alpha = 1;
            }

            // add to fadeDone to notify grid when all tiles are done fading
            if(this.state.alpha >= 1) {
              this.state.alpha = null;
              ++grid.state.appearDone;
            }
          }
        };

        this.state.grid[y][x] = newTile;
        ++this.state.appearNum;
      }
    }
  }

  this.state.gridCheck = this.copyGrid(this.state.grid); // sync grid check with grid
  AE.updateRenderPipe();
};

grid.update = function() {
  var touchState = AE.inputMan.getTouchState();

  // disable inputs when an animation is occurring
  if(
    (this.state.swapping === null) &&
    (this.state.fading === false) &&
    (this.state.falling === false) &&
    (this.state.appearing === false)
  ) {
    if(touchState.fullPress) {
      var touch = this.tilePressed();

      if(touch.start && touch.end) {
        grid.processInput(touch.start, touch.end);
      }
    } else if(AE.inputMan.getMBState('LEFTCLICK').fullClick) {
      var clickedTile = this.tileClicked();
      var prevClickedTile = this.state.prevClickedTile;

      grid.processInput(clickedTile, prevClickedTile);
    }
  }

  // if swapping is done
  if(this.state.swapping && (this.state.swapDone === 2)) {
    console.log('swapping done');
    this.state.swapping = null;
    this.state.swapDone = 0;
    this.finishSwap();
  }

  // if fading is done
  if(this.state.fading && (this.state.fadeDone === this.state.tilesToDel.length)) {
    console.log('fading done');
    this.state.fading = false;
    this.state.fadeDone = 0;
    
    // delete tiles from grid
    for(var i in this.state.tilesToDel) {
      var currTile = this.state.tilesToDel[i];
      this.deleteTile(currTile.state.gridLoc.x, currTile.state.gridLoc.y);
    }

    this.state.tilesToDel = [];
    this.state.gridCheck = this.copyGrid(this.state.grid); // sync grid check with grid

    // start falling
    this.state.falling = true;
    this.calcFall();
  }

  // if falling is done
  if(this.state.falling && (this.state.fallDone === this.state.fallNum)) {
    console.log('falling done');
    this.state.falling = false;
    this.state.fallNum = 0;
    this.state.fallDone = 0;

    this.state.gridCheck = this.copyGrid(this.state.grid); // sync grid check with grid

    // start appearing
    this.state.appearing = true;
    this.spawnNewTiles();
  }

  // if appearing is done
  if(this.state.appearing && (this.state.appearDone === this.state.appearNum)) {
    console.log('appearing done');
    this.state.appearing = false;
    this.state.appearNum = 0;
    this.state.appearDone = 0;

    this.state.gridCheck = this.copyGrid(this.state.grid); // sync grid check with grid

    if(this.findMatches(this.state.grid)) {
      // delete tiles
      this.state.fading = true;

      // assign each tile an alpha value
      for(var i in this.state.tilesToDel) {
        var currTile = this.state.tilesToDel[i];
        currTile.state.alpha = 1;
      }
    }
  }
};

var bg = AE.createWorldObj('bg');

bg.setup = function() {
  this.state.img = AE.assetMan.getImg('bg');
  this.state.pos.x = 0;
  this.state.pos.y = 0;
  this.state.size.w = 850;
  this.state.size.h = 650;
  this.state.zIndex = 1;
  this.state.alpha = null;
  this.state.worldObjType = 'img';
};

AE.start();