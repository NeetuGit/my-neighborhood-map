import React, {Component} from 'react';
import { styles } from './styles';

import { CLIENT_ID } from './credentials.js';
import { CLIENT_SECRET } from './credentials.js';
import LocationList from './ListofLocations';


class App extends Component {
    /**
     * Constructor
     */
    constructor(props) {
        super(props);
        this.state = {
            'alllocations': [
                {
                    'name':  "Parramatta Correctional Centre",
                    'type': "Prison",
                    'latitude': -33.799568,
                    'longitude': 151.000962,
                    'streetAddress': "125 O'Connell Street, North Parramatta"
                },
                {
                    'name': "Australian Coffee And Chocolate",
                    'type': "Desssert Shop",
                    'latitude': -33.802800582698396,
                    'longitude':  151.00205641841342,
                    'streetAddress': "321 Church St, Parramatta"
                },
                {
                    'name': "Parramatta Physio on Church",
                    'type': "Medical Center",
                    'latitude': -33.80503490771444,
                    'longitude': 151.003215989127,
                    'streetAddress': "470 Church St, North Parramatta"
                },
                {
                    'name': "Bloc Climbing Centre",
                    'type': "Gym",
                    'latitude': -33.79793677,
                    'longitude': 151.00423,
                    'streetAddress': "Unit2\/23 Castle St, North Parramata"
                },
                {
                    'name': "ProfessioNail",
                    'type': "Shopping Mall",
                    'latitude': -33.8175391766754,
                    'longitude': 151.00290335890813,
                    'streetAddress': "159-175 Church St, Parramatta"
                },
                {
                    'name': "Institute Of Psychiatry",
                    'type': "Education",
                    'latitude': -33.80325794219971,
                    'longitude': 151.00004196166992,
                    'streetAddress': "Australia"
                },
                {
                    'name': "Parramatta SES",
                    'type': "Government Buildings",
                    'latitude': -33.79749595291125,
                    'longitude':  150.9999532977382,
                    'streetAddress': "75 O'connel st, North Parramata"
                },
                {
                    'name': "Petbarn",
                    'type': "Pet Store",
                    'latitude': -33.79812,
                    'longitude': 151.00162,
                    'streetAddress': "126 O'Connell Street, North Parramata"
                },
                {
                    'name': "Starbucks",
                    'type': "Coffee Shop",
                    'latitude': -33.817833581665,
                    'longitude': 151.00279152274194,
                    'streetAddress': "Westfield Parramatta, Shop 2164\/2165, Level 2, 159-175 Church Street"
                },
                {
                    'name': "Cumberland Psychiatric Hospital",
                    'type': "Hospital",
                    'latitude': -33.801866450417215,
                    'longitude':150.99652015708708,
                    'streetAddress': "11 Hainsworth St, Westmead"
                }
            ],
            'map': '',
            'infowindow': '',
            'prevmarker': ''
        };

        // retain object instance when used in the function
        this.initMap = this.initMap.bind(this);
        this.openInfoWindow = this.openInfoWindow.bind(this);
        this.closeInfoWindow = this.closeInfoWindow.bind(this);
    }

    componentDidMount() {
        // Connect the initMap() function within this class to the global window context,
        // so Google Maps can invoke it
        window.initMap = this.initMap;
        // Asynchronously load the Google Maps script, passing in the callback reference
        loadMapJS('https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyDiQFku0XlPS6r6hSlEePWIqNCHOIjho88&callback=initMap')
    }

    /**
     * Initialise the map once the google map script is loaded
     */
    initMap() {
        var self = this;
        var mapview = document.getElementById('map');
        mapview.style.height = window.innerHeight + "px";
        var map = new window.google.maps.Map(mapview, {
            center: {lat:  -33.8032, lng: 151.0055},
            zoom: 15,
            styles: styles,
            mapTypeControl: false
        });

        var InfoWindow = new window.google.maps.InfoWindow({});

        window.google.maps.event.addListener(InfoWindow, 'closeclick', function () {
            self.closeInfoWindow();
        });

        this.setState({
            'map': map,
            'infowindow': InfoWindow
        });

        window.google.maps.event.addDomListener(window, "resize", function () {
            var center = map.getCenter();
            window.google.maps.event.trigger(map, "resize");
            self.state.map.setCenter(center);
        });

        window.google.maps.event.addListener(map, 'click', function () {
            self.closeInfoWindow();
        });

        var alllocations = [];
        this.state.alllocations.forEach(function (location) {
            var longname = location.name + ' - ' + location.type;
            var marker = new window.google.maps.Marker({
                position: new window.google.maps.LatLng(location.latitude, location.longitude),
                animation: window.google.maps.Animation.DROP,
                map: map
            });

            marker.addListener('click', function () {
                self.openInfoWindow(marker);
            });

            location.longname = longname;
            location.marker = marker;
            location.display = true;
            alllocations.push(location);
        });
        this.setState({
            'alllocations': alllocations
        });
    }

    /**
     * Open the infowindow for the marker
     * @param {object} location marker
     */
    openInfoWindow(marker) {
        this.closeInfoWindow();
        this.state.infowindow.open(this.state.map, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        this.setState({
            'prevmarker': marker
        });
        this.state.infowindow.setContent('Loading Data...');
        this.state.map.setCenter(marker.getPosition());
        this.state.map.panBy(0, -200);
        this.getMarkerInfo(marker);
    }

    /**
     * Retrive the location data from the foursquare api for the marker and display it in the infowindow
     * @param {object} location marker
*/
    getMarkerInfo(marker) {
        var self = this;
        var clientId = CLIENT_ID;
        var clientSecret = CLIENT_SECRET;
        var url = "https://api.foursquare.com/v2/venues/search?client_id=" + clientId + "&client_secret=" + clientSecret + "&v=20130815&ll=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&limit=1";
        fetch(url)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        self.state.infowindow.setContent("Sorry data can't be loaded");
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function (data) {
                        var location_data = data.response.venues[0];
                        var name = '<b>Name: </b>' + location_data.name + '<br>';
                        var city = '<b>City: </b>' + location_data.location.city + '<br>';
                        var address = '<b>Address: </b>' + location_data.location.address+ '<br>';
                        var readMore = '<a href="https://foursquare.com/v/'+ location_data.id +'" target="_blank">Read More on Foursquare Website</a>'
                        self.state.infowindow.setContent(name + address + city  +readMore);
                    });
                }
            )
            .catch(function (err) {
                self.state.infowindow.setContent("Sorry data can't be loaded");
            });
    }

    /**
     * Close the infowindow for the marker
     * @param {object} location marker
     */
    closeInfoWindow() {
        if (this.state.prevmarker) {
            this.state.prevmarker.setAnimation(null);
        }
        this.setState({
            'prevmarker': ''
        });
        this.state.infowindow.close();
    }

    /**
     * Render function of App
     */
    render() {
        return (
            <div className="container">
                <LocationList key="100" alllocations={this.state.alllocations} openInfoWindow={this.openInfoWindow}
                              closeInfoWindow={this.closeInfoWindow}/>
                <div id="map" ></div>
            </div>
        );
    }
}

export default App;

/**
 * Load the google maps Asynchronously
 * @param {url} url of the google maps script
 */
function loadMapJS(src) {
    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    script.onerror = function () {
        document.write("Google Maps can't be loaded");
    };
    ref.parentNode.insertBefore(script, ref);
}
