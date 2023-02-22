var map = L.map('map').setView([19.359372, -155.268355], 13);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    id: 'mapbox/satellite-streets-v12',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic3FuZ3V5ZW4iLCJhIjoiY2w5eXd1YXc0MDk3MjNucDg2cDhyN3JrbyJ9.aMzoD2AZBPUtaVP2yV5N-A'
}).addTo(map);

L.Control.measureControl().addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url = "https://178.128.228.240:4000/sql?q=";

var sqlQuery = "SELECT geom, startpinid, goalpinid, calcone, calctwo, calcthree, calcfour, collectiondate FROM crackteam";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b><center>" + feature.properties.startpinid + ' to ' + feature.properties.goalpinid + "</b><br>" +
        'Collected on: <i>' + feature.properties.collectiondate + "</i><br>Calculations: <br><i>" +
        feature.properties.calcone + '<br>' + feature.properties.calctwo +
        '<br>' + feature.properties.calcthree + '<br>' + feature.properties.calcfour + '</i></center>'
    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : false,
        polyline : true,
        rectangle : false,                                                      // Rectangles disabled
        circle : false,                                                         // Circles disabled 
        circlemarker : false,                                                   // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent = 
        '<form> <center>' + 
        'Starting plate pin ID:<br><input type="text" id="pinstart"><br>' +
        '<br>Goal plate pin ID:<br><input type="text" id="pinend"><br>' +
        '<br>Calculation measurements:<br>'+
        '<input type="number" id="calcone" name="calcone"><br>' +
        '<input type="number" id="calctwo" name="calctwo"><br>' +
        '<input type="number" id="calcthree" name="calcthree"><br>' +
        '<input type="number" id="calcfour" name="calcfour"><br>' +
        '<br>Collection date:' +
        '<input type="date" id="collect" name="collect"><br>' +
        '<br><input type="button" value="Submit" id="submit">' + 
        '</center></form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {                                //Event listener for created/drawn shapes.
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {
    if(e.target && e.target.id == "submit") {
        var pinstartid = document.getElementById("pinstart").value;               // Get user name and description
        var pingoal = document.getElementById("pinend").value;
        var calcuone = document.getElementById("calcone").value;
        var calcutwo = document.getElementById("calctwo").value;
        var calcuthree = document.getElementById("calcthree").value;
        var calcufour = document.getElementById("calcfour").value;
        var collectday = document.getElementById("collect").value;
        drawnItems.eachLayer(function(layer) {                                    // For each drawn layer
           
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);                 // Create SQL expression to insert layer
        var sql =
            "INSERT INTO crackteam (geom, startpinid, goalpinid, calcone, calctwo, calcthree, calcfour, collectiondate) " +
            "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
            drawing + "'), 4326), '" +
            pinstartid + "', '" +
            pingoal + "', '" +
            calcuone + "', '" +
            calcutwo + "', '" +
            calcuthree + "', '" +
            calcufour + "', '" +
            collectday + "');";
        console.log(sql);

        fetch(url, {                        // Send the data
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "q=" + encodeURI(sql)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("Data saved:", data);
        })
        .catch(function(error) {
            console.log("Problem saving the data:", error);
        });

        // Transfer submitted drawing to the tableData layer 
        // so it persists on the map without you having to refresh the page
        var newData = layer.toGeoJSON();
            newData.properties.startpinid = pinstartid;
            newData.properties.goalpinid = pingoal;
            newData.properties.calcone = calcuone;
            newData.properties.calctwo = calcutwo;
            newData.properties.calcthree = calcuthree;
            newData.properties.calcfour = calcufour;
            newData.properties.collectiondate = collectday;
        L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

        });

        drawnItems.closePopup();                                                // Clear drawn items layer
        drawnItems.clearLayers();
    }
}

document.addEventListener("click", setData);