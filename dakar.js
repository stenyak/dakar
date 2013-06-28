// QUICK'N'DIRTY DAKAR RALLY SIM IN JS
// An attempt to clone a very simple Dakar game created in flash that I played some years ago.
//
// AUTHOR
// Written by STenyaK <stenyak@stenyak.com>.
//
// COPYRIGHTS
// This Dakar game is Copyright © 2011 Bruno Gonzalez.
// License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
// This is free software: you are free to change and redistribute it.
// There is NO WARRANTY, to the extent permitted by law.
//
// seedrandom.js is Copyright © 2011 David Bau
// box2d.js is Copyright © 2006-2007 Erin Catto
//
// REPORTING BUGS
// The code is not clean, the game has bugs, physics may explode at any time without prior warning :-)
// That said, feel free to report bugs (and bugfixes!) to <stenyak@stenyak.com>.

function init()
{
    function handleMouseMove(e)
    {
        mouseX = (e.clientX - canvasPosition.x) / 30;
        mouseY = (e.clientY - canvasPosition.y) / 30;
    };
    var keyEnum = { left:0, down:1, up:2, right:3 };
    var keyArray = new Array(4);
    function handleKeyDown(e)
    {
        var key = e.keyCode;
        // Detect which key was pressed
        if(key == 37) keyArray[keyEnum.left] = true;
        if(key == 40) keyArray[keyEnum.down] = true;
        if(key == 38) keyArray[keyEnum.up] = true;
        if(key == 39) keyArray[keyEnum.right] = true;

        var text = "";
        if (keyArray[keyEnum.left] == true) text += "< ";
        if (keyArray[keyEnum.right] == true) text += "> ";
        if (keyArray[keyEnum.up] == true) text += "^ ";
        if (keyArray[keyEnum.down] == true) text += "v ";
        document.getElementById("input").innerHTML = text;
    }
    function handleKeyUp(e)
    {
        var key = e.keyCode;
        // Detect which key was pressed
        if(key == 37) keyArray[keyEnum.left] = false;
        if(key == 40) keyArray[keyEnum.down] = false;
        if(key == 38) keyArray[keyEnum.up] = false;
        if(key == 39) keyArray[keyEnum.right] = false;

        var text = "";
        if (keyArray[keyEnum.left] == true) text += "< ";
        if (keyArray[keyEnum.right] == true) text += "> ";
        if (keyArray[keyEnum.up] == true) text += "^ ";
        if (keyArray[keyEnum.down] == true) text += "v ";
        document.getElementById("input").innerHTML = text;
    }

    function onKeyUp()
    {
        // Detect which key was released
        if( key == 'w' )
            keyArray[keyEnum.W_Key] = false;
        // Repeat for each key you care about...
    }

    function isKeyDown(key)
    {
        return keyArray[key];
    }

    function getBodyAtMouse()
    {
        mousePVec = new b2Vec2(mouseX, mouseY);
        var aabb = new b2AABB();
        aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
        aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);

        // Query the world for overlapping shapes.
        selectedBody = null;
        world.QueryAABB(getBodyCB, aabb);
        return selectedBody;
    };
    function getBodyCB(fixture)
    {
        if(fixture.GetBody().GetType() != b2Body.b2_staticBody)
        {
            if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec))
            {
                selectedBody = fixture.GetBody();
                return false;
            }
        }
        return true;
    };
    function stepPhysics(seconds, render)
    {
            updateChunks();
            world.Step(seconds, 10, 10);
            if (keyArray[keyEnum.right] == true)
            {
                vehicle.engine.EnableMotor(true);
                vehicle.engine.SetMotorSpeed(vehicle.maxspeed);
            }
            else
            {
                vehicle.engine.SetMotorSpeed(0);
                vehicle.engine.EnableMotor(false);
            }
            if (keyArray[keyEnum.left] == true)
            {
                vehicle.engine.SetMotorSpeed(0);
                vehicle.engine.EnableMotor(true);
            }
            if (render)
            {
                var size = getRenderSize();
                var scale = debugDraw.GetDrawScale();
                size.w /= scale;
                size.h /= scale;
                posx = (-vehicle.body.GetPosition().x) + (size.w/2);
                posy = (-vehicle.body.GetPosition().y) + (size.h/2);
                world.DrawDebugData(posx, posy);
                document.getElementById("speed").innerHTML = Math.round(vehicle.body.GetLinearVelocity().x * 3.6);
                document.getElementById("height").innerHTML = Math.round(-vehicle.body.GetPosition().y);
                document.getElementById("distance").innerHTML = Math.round(vehicle.body.GetPosition().x);
                document.getElementById("torque").innerHTML = Math.round(vehicle.engine.GetMotorTorque());
            }
            world.ClearForces();
    };
    var updating = false;
    function update()
    {
        if (updating)
            return;
        else updating = true;
        var date = new Date();
        var wallClock = date.getTime();

        if(isMouseDown && (!mouseJoint))
        {
            var body = getBodyAtMouse();
            if(body)
            {
                var md = new b2MouseJointDef();
                md.bodyA = world.GetGroundBody();
                md.bodyB = body;
                md.target.Set(mouseX, mouseY);
                md.collideConnected = true;
                md.maxForce = 300.0 * body.GetMass();
                mouseJoint = world.CreateJoint(md);
                body.SetAwake(true);
            }
        }
        if(mouseJoint)
        {
            if(isMouseDown)
            {
                mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
            }
            else
            {
                world.DestroyJoint(mouseJoint);
                mouseJoint = null;
            }
        }
        var drawn = false;
        while (wallClock > virtualClock)
        {
            stepPhysics(1./physicsRate, !drawn)
            virtualClock += 1000 / physicsRate;
            if (!drawn) drawn = true;
        }
        updating = false;
    };
    function getViewSize()
    {
        var viewportwidth;
        var viewportheight;
        // the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight

        if (typeof window.innerWidth != 'undefined')
        {
            viewportwidth = window.innerWidth, viewportheight = window.innerHeight
        }


        else if (typeof document.documentElement != 'undefined'
                && typeof document.documentElement.clientWidth !=
                'undefined' && document.documentElement.clientWidth != 0)
        {
            // IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
            viewportwidth = document.documentElement.clientWidth,
            viewportheight = document.documentElement.clientHeight
        }
        else
        {
            // older versions of IE
            viewportwidth = document.getElementsByTagName('body')[0].clientWidth,
            viewportheight = document.getElementsByTagName('body')[0].clientHeight
        }
        return {w: viewportwidth, h:viewportheight};
    };
    //http://js-tut.aardon.de/js-tut/tutorial/position.html
    function getElementPosition(element)
    {
        var elem=element, tagname="", x=0, y=0;

        while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined"))
        {
            y += elem.offsetTop;
            x += elem.offsetLeft;
            tagname = elem.tagName.toUpperCase();

            if(tagname == "BODY")
                elem=0;

            if(typeof(elem) == "object")
            {
                if(typeof(elem.offsetParent) == "object")
                    elem = elem.offsetParent;
            }
        }

        return {x: x, y: y};
    };
    function getRenderSize()
    {
        var size = getViewSize();
        var width = size.w; - 32;
        var height = size.h; - 32;
        if (width > 1000) width = 1000;
        if (height > 600) height = 600;
        width -= 32;
        height -= 32;
        return {w: width, h:height};
    };
    function getWorldSize()
    {
        var result = getViewSize();
        result.w /= 30;
        result.h /= 30;
        return result;
    };
    function createRocks (nrocks, size, mass, worldx, worldy)
    {
        while (nrocks > 0)
        {
            createBody(size, size, Math.random()*worldx, worldy, size );
            nrocks -= 1;
        }
    };
    function getLastChunk()
    {
        return chunks[chunks.length-1];
    }
    function sanitizeRebound(value, minValue, maxValue)
    {
        var result = value;
        var max = maxValue;
        var min = minValue;
        if (minValue > maxValue)
        {
            max = minValue;
            min = maxValue;
        }
        if (result > max) result = max - (result - max)/3;
        if (result < min) result = min + (min - result)/3;
        return result;
    }
    function sanitize(value, minValue, maxValue)
    {
        var result = value;
        var max = maxValue;
        var min = minValue;
        if (minValue > maxValue)
        {
            max = minValue;
            min = maxValue;
        }
        if (result > max) result = max;
        if (result < min) result = min;
        return result;
    }
    function addChunk()
    {
        var chunkSize = getChunkSize();
        var lastChunk = getLastChunk();
        var speed = Math.abs(vehicle.body.GetLinearVelocity().x);
        var madMin = 3;
        //madMin = 0;
        var madMax = 0.02;
        var maMin = 10;
        var maMax = 40;
        var speedMax = 100 / 3.6;
        var maxanglediff = madMin+(speed*(madMax-madMin)/speedMax);
        maxanglediff = sanitizeRebound(maxanglediff, madMin, madMax);
        var maxangle = maMin+(speed*(maMax-maMin)/speedMax);
        maxangle = sanitize(maxangle, maMin, maMax);
        var chunk;
        if (lastChunk == null)
        {
            chunk = createGroundSimple(0, chunkSize, 0, 0, maxanglediff, maxangle);
        }
        else
        {
            chunk = createGroundSimple(lastChunk.endx, lastChunk.endx+chunkSize, lastChunk.endy, lastChunk.endangle, maxanglediff, maxangle);
        }
        chunks.push(chunk);
    }
    function updateChunks()
    {
        var chunkSize = getChunkSize();
        var curx = vehicle.body.GetPosition().x;
        //console.log("Checking chunks: curx = "+curx);

        if (getLastChunk() == null)
        {
            addChunk();
        }
        var desiredNumberOfChunks = Math.ceil(getWorldSize().w / chunkSize) / 2;
        while ( curx > getLastChunk().initx )
        {
            console.log("Adding chunk due to vehicle position")
            addChunk();
        }
        while (chunks.length > desiredNumberOfChunks )
        {
            console.log("Removing chunk due to excess")
            var chunk = chunks.shift();
            while (chunk.edges.length > 0)
            {
                var edge = chunk.edges.shift();
                world.DestroyBody(edge.body);
                //world.DestroyFixture(edge.fixture);
            }
        }
        while (chunks.length < desiredNumberOfChunks)
        {
            console.log("Adding chunk due to lack of chunks")
            addChunk();
        }
    };
    function getnewangle(oldangle, seed, maxanglediff, maxangle)
    {
        var result = 0;
        Math.seedrandom(seed+2);
        var anglediff = -( (Math.random() - 0.5) * 2)* maxanglediff; //up to +/- maxanglediff degrees in difference
        anglediff += sanitize(anglediff, -maxanglediff, maxanglediff);
        result = oldangle + anglediff;
        result = sanitize(result, -maxangle, maxangle);
        return result;
    };
    function getstepy(stepx, angle)
    {
        var result = 0;
        var rads = angle * (Math.PI / 180);
        result = Math.sin(rads) * stepx;
        return result;
    };
    function createGroundSimple(initx, endx, inity, initangle, maxanglediff, maxangle)
    {
        console.log("Creating new ground with mad: " + maxanglediff + " and ma: " + maxangle);
        var x = initx;
        var y = inity;
        var angle = initangle;
        var stepx = (endx - initx) / 100.;
        stepx = 0.2;
        var edges = new Array();
        while (x < endx)
        {
            var seed = x;
            var date = new Date();
            seed = date.getTime();
            angle = getnewangle(angle, seed, maxanglediff, maxangle);
            var stepy = getstepy(stepx, angle);
            var edge = createEdge(x, y, x+stepx, y+stepy);
            edges.push(edge);
            x += stepx;
            y += stepy;
        }

        var result = {
            'initx': initx,
            'endx': x,
            'endy': y,
            'endangle': angle,
            'edges': edges
        };
        return result;

    };
    function createEdge(vecax, vecay, vecbx, vecby)
    {
        var result;
        veca = new b2Vec2(vecax, vecay);
        vecb = new b2Vec2(vecbx, vecby);

        var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 1.0;
        fixDef.restitution = 0.0;
        fixDef.shape = new b2PolygonShape;

        var bodyDef = new b2BodyDef;
        bodyDef.type = b2Body.b2_staticBody;

        fixDef.shape.SetAsEdge(veca, vecb);
        bodyDef.position.Set(0,0);
        var body = world.CreateBody(bodyDef);
        var fixture = body.CreateFixture(fixDef);

        return { 'body': body, 'fixture': fixture };
    };
    function createBox(originx, originy, endx, endy)
    {
        sizeX = (endx - originx)/2;
        sizeY = (endy - originy)/2;
        posX = originx + sizeX;
        posY = originy + sizeY;

        var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
        fixDef.shape = new b2PolygonShape;

        var bodyDef = new b2BodyDef;
        bodyDef.type = b2Body.b2_staticBody;

        fixDef.shape.SetAsBox(sizeX, sizeY);
        bodyDef.position.Set(posX, posY);
        world.CreateBody(bodyDef).CreateFixture(fixDef);
    };
    function checkPos(x, y)
    {
        var result;
        var bd = new b2BodyDef;
        bd.type = b2Body.b2_staticBody;
        bd.position = new b2Vec2(x,y);
        result = world.CreateBody(bd);

        var fd = new b2FixtureDef;
        fd.density = 0.0;
        fd.shape = new b2CircleShape(0.1);
        result.CreateFixture(fd);

        return result;
    };
    function createVehicle(length, height, radius, posx, posy, speed)
    {
        var v = {};

        var sepx = length/1.3;
        var fwheelsep = 0.2;
        var rwheelsep = 0.2;
        var hubradius = radius/5;
        var bodymass = 500;
        var wheelmass = bodymass/10;
        var hubmass = wheelmass/10;

        v.fh = createCircle(posx+sepx, posy+(height/2), hubradius, hubmass);
        v.fw = createCircle(posx+sepx, posy+(height/2), radius, wheelmass);
        attachAxisBody(v.fh, v.fw, 0);

        v.rh = createCircle(posx-sepx, posy+(height/2), hubradius, hubmass);
        v.rw = createCircle(posx-sepx, posy+(height/2), radius, wheelmass);
        v.maxspeed = speed;
        //v.torque = Math.max(speed * 300, 1500);
        v.torque = 1850;
        v.engine = attachAxisBody(v.rh, v.rw, v.torque);

        v.body = createBody(length, height, posx, posy, bodymass);
        v.fs = attachBodyHub(v.body, v.fh, 60, fwheelsep, 15, 6);
        v.rs = attachBodyHub(v.body, v.rh, -80, rwheelsep, 20, 8);

        return v;
    };
    function attachBodyHub(body, hub, angle, length, k, c)
    {
        var length = 3;
        var axis = new b2Vec2();
        axis.x = hub.GetPosition().x - (body.GetPosition().x);
        axis.y = hub.GetPosition().y - (body.GetPosition().y);
        axis.x = Math.cos(angle * Math.PI/180);
        axis.y = Math.sin(angle * Math.PI/180);
        var dist = Math.sqrt(Math.pow(axis.x, 2) + Math.pow(axis.y, 2));
        axis.x = axis.x/dist;
        axis.y = axis.y/dist;

        var jd = new b2PrismaticJointDef();
        jd.Initialize(hub, body, hub.GetWorldCenter(), axis);
        jd.collideConnected = false;
        j = world.CreateJoint(jd); // prismatic

        jd = new b2DistanceJointDef();
        jd.length = length;
        jd.frequencyHz = k;
        jd.dampingRatio = c;
        jd.bodyA = body;
        jd.bodyB = hub;
        jd.localAnchorA = new b2Vec2(0,0);
        jd.localAnchorB = new b2Vec2(0,0);
        jd.collideConnected = false;
        j = world.CreateJoint(jd); // spring

        return j;
    };
    function attachBodyBody(body1, body2)
    {
        var jd = new b2WeldJointDef();
        jd.localAnchorA = new b2Vec2(0,0);
        jd.localAnchorB = new b2Vec2(0,0);
        jd.Initialize(body1, body2, body1.GetPosition());
        jd.collideConnected = false;
        var j = world.CreateJoint(jd);
        return j;
    };
    function attachAxisBody(body1, body2, torque)
    {
        var jd = new b2RevoluteJointDef();
        jd.enableLimit = false;
        jd.enableMotor = torque > 0;
        if (jd.enableMotor)
        {
            jd.motorSpeed = 0;
            jd.maxMotorTorque = torque;
        }
        jd.localAnchorA = new b2Vec2(0,0);
        jd.localAnchorB = new b2Vec2(0,0);
        jd.Initialize(body1, body2, body1.GetPosition());
        jd.collideConnected = false;
        var j = world.CreateJoint(jd);
        return j;
    };
    function createBody(length, height, posx, posy, mass)
    {
        var result;
        var bd = new b2BodyDef;
        bd.type = b2Body.b2_dynamicBody;
        bd.position = new b2Vec2(posx, posy);
        result = world.CreateBody(bd);

        var fd = new b2FixtureDef;
        fd.friction = 0.6;
        fd.restitution = 0.1;
        fd.shape = new b2PolygonShape;
        fd.shape.SetAsBox(length/2, height/2);
        result.CreateFixture(fd);
        var massdata = new b2MassData;
        massdata.center = new b2Vec2(0,0);
        massdata.mass = mass;
        massdata.I = 1;
        result.SetMassData(massdata);

        return result;
    };
    function createCircle(posx, posy, radius, mass)
    {
        var result;
        var bd = new b2BodyDef;
        bd.type = b2Body.b2_dynamicBody;
        bd.position = new b2Vec2(posx, posy);
        result = world.CreateBody(bd);

        var fd = new b2FixtureDef;
        fd.friction = 0.6;
        fd.restitution = 0.3;
        fd.shape = new b2CircleShape(radius);
        result.CreateFixture(fd);
        var massdata = new b2MassData;
        massdata.center = new b2Vec2(0,0);
        massdata.mass = mass;
        massdata.I = 1;
        result.SetMassData(massdata);

        return result;
    }
    function getChunkSize()
    {
        var result = 0;
        var renderSize = getRenderSize();
        result = renderSize.w / 30;
        return result / 4;
    }
    var   b2Vec2 = Box2D.Common.Math.b2Vec2
        ,  b2AABB = Box2D.Collision.b2AABB
        ,	b2BodyDef = Box2D.Dynamics.b2BodyDef
        ,	b2Body = Box2D.Dynamics.b2Body
        ,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
        ,	b2Fixture = Box2D.Dynamics.b2Fixture
        ,	b2World = Box2D.Dynamics.b2World
        ,	b2MassData = Box2D.Collision.Shapes.b2MassData
        ,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
        ,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
        ,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
        ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
        ,  b2DistanceJointDef =  Box2D.Dynamics.Joints.b2DistanceJointDef
        ,  b2RevoluteJointDef =  Box2D.Dynamics.Joints.b2RevoluteJointDef
        ,  b2WeldJointDef = Box2D.Dynamics.Joints.b2WeldJointDef
        ,  b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef
        ;

    var world = new b2World(
            new b2Vec2(0, 9.8)    //gravity
            ,  true                 //allow sleep
            );




    var size = getRenderSize();
    document.getElementById("canvas").height = size.h;
    document.getElementById("canvas").width =  size.w;
    for (var i=0; i<10; i++)
    {
        //checkPos(i,i);
    }

    var chunkSize = getChunkSize();
    var worldsize = getWorldSize();
    //createRocks(10,0.2,1, chunkSize*2, -5);
    var vehicle = createVehicle(3, 0.8, 0.4, 3.5,-4, 80);
    var chunks = new Array();
    updateChunks();

    //setup debug draw
    var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
    debugDraw.SetDrawScale(30.0);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);

    //update
    var date = new Date();
    var virtualClock = date.getTime();
    var physicsRate = 200;
    var graphicsRate = 25;
    var simDuration = 0;
    world.DrawDebugData();
    //return;
    var id = window.setInterval(update, 1000 / graphicsRate);
    if (simDuration > 0) setTimeout("clearInterval("+id+")",simDuration*1000);

    //mouse

    var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
    var canvasPosition = getElementPosition(document.getElementById("canvas"));
    document.addEventListener("keydown", function(e)
            {
            isMouseDown = true;
            handleKeyDown(e);
            document.addEventListener("keydown", handleKeyDown, true);
            }, true);
    document.addEventListener("keyup", function(e)
            {
            isMouseDown = true;
            handleKeyUp(e);
            document.addEventListener("keyup", handleKeyUp, true);
            }, true);

    document.addEventListener("mousedown", function(e)
            {
            isMouseDown = true;
            handleMouseMove(e);
            document.addEventListener("mousemove", handleMouseMove, true);
            }, true);

    document.addEventListener("mouseup", function()
            {
            document.removeEventListener("mousemove", handleMouseMove, true);
            isMouseDown = false;
            mouseX = undefined;
            mouseY = undefined;
            }, true);


};
