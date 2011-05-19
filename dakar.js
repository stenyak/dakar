function init()
{
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


    var size = getViewSize();

    var width = size.w * 0.95;
    var height = size.h * 0.95;
    //width = 220;
    //height = 290;
    document.getElementById("canvas").height = height;
    document.getElementById("canvas").width =  width;
    for (var i=0; i<10; i++)
    {
        //checkPos(i,i);
    }

    createGround(width/30, height/30, 0.2);
    var vehicle = createVehicle(3, 1.5, 0.5, 5,5);

    function createGround(sizex, sizey, border)
    {
        createBox(0,0,sizex,border);
        createBox(0,sizey-border, sizex,sizey);
        createBox(0,0,border,sizey);
        createBox(sizex-border,0,sizex,sizey);
    }
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
    }
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
    }

    function createVehicle(length, height, radius, posx, posy)
    {
        var v = {};

        var sepx = length/2;
        var fwheelsep = 1;
        var rwheelsep = 0.5;
        var hubradius = radius/5;
        var wheelmass = 10;
        var hubmass = wheelmass/10;

        v.fh = createCircle(posx+sepx, posy+(height/2)+radius+fwheelsep, hubradius, hubmass);
        v.fw = createCircle(posx+sepx, posy+(height/2)+radius+fwheelsep, radius, wheelmass);
        attachAxisBody(v.fh, v.fw, false);

        v.rh = createCircle(posx-sepx, posy+(height/2)+radius+rwheelsep, hubradius, hubmass);
        v.rw = createCircle(posx-sepx, posy+(height/2)+radius+rwheelsep, radius, wheelmass);
        v.engine = attachAxisBody(v.rh, v.rw, true);
        v.engine.SetMotorSpeed(10);

        v.body = createBody(length, height, posx, posy, 10);
        v.fs = attachBodyHub(v.body, v.fh, 70, fwheelsep, 2, 0.8);
        v.rs = attachBodyHub(v.body, v.rh, -90, rwheelsep, 4, 0.6);

        return v;
    }
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
    }
    function attachBodyBody(body1, body2)
    {
        var jd = new b2WeldJointDef();
        jd.localAnchorA = new b2Vec2(0,0);
        jd.localAnchorB = new b2Vec2(0,0);
        jd.Initialize(body1, body2, body1.GetPosition());
        jd.collideConnected = false;
        var j = world.CreateJoint(jd);
        return j;
    }
    function attachAxisBody(body1, body2, engine)
    {
        var jd = new b2RevoluteJointDef();
        jd.enableLimit = false;
        jd.enableMotor = engine;
        if (engine)
        {
            jd.motorSpeed = 0;
            jd.maxMotorTorque = 100;
        }
        jd.localAnchorA = new b2Vec2(0,0);
        jd.localAnchorB = new b2Vec2(0,0);
        jd.Initialize(body1, body2, body1.GetPosition());
        jd.collideConnected = false;
        var j = world.CreateJoint(jd);
        return j;
    }
    function createBody(length, height, posx, posy, mass)
    {
        var result;
        var bd = new b2BodyDef;
        bd.type = b2Body.b2_dynamicBody;
        bd.position = new b2Vec2(posx, posy);
        result = world.CreateBody(bd);

        var fd = new b2FixtureDef;
        fd.friction = 0.5;
        fd.restitution = 0.2;
        fd.shape = new b2PolygonShape;
        fd.shape.SetAsBox(length/2, height/2);
        result.CreateFixture(fd);
        var massdata = new b2MassData;
        massdata.center = new b2Vec2(0,0);
        massdata.mass = mass;
        massdata.I = 1;
        result.SetMassData(massdata);

        return result;
    }
    function createCircle(posx, posy, radius, mass)
    {
        var result;
        var bd = new b2BodyDef;
        bd.type = b2Body.b2_dynamicBody;
        bd.position = new b2Vec2(posx, posy);
        result = world.CreateBody(bd);

        var fd = new b2FixtureDef;
        fd.friction = 0.5;
        fd.restitution = 0.2;
        fd.shape = new b2CircleShape(radius);
        result.CreateFixture(fd);
        var massdata = new b2MassData;
        massdata.center = new b2Vec2(0,0);
        massdata.mass = mass;
        massdata.I = 1;
        result.SetMassData(massdata);

        return result;
    }

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
    var physicsRate = 50;
    var graphicsRate = 25;
    var simDuration = 50;
    world.DrawDebugData();
    //return;
    var id = window.setInterval(update, 1000 / graphicsRate);
    setTimeout("clearInterval("+id+")",simDuration*1000);

    //mouse

    var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
    var canvasPosition = getElementPosition(document.getElementById("canvas"));

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
    function handleMouseMove(e) 
    {
        mouseX = (e.clientX - canvasPosition.x) / 30;
        mouseY = (e.clientY - canvasPosition.y) / 30;
    };

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
    }

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
    }
    function stepPhysics(seconds, render)
    {
            world.Step(seconds, 10, 10);

            if (render)
            {
                world.DrawDebugData();
            }
            world.ClearForces();
    }

    function update() 
    {
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
    };
    //helpers
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
    }

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
    }


};