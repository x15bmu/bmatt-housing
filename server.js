"use strict"

var express = require('express');
var app = express();
app.use(express.static(__dirname));
var Promise = require('bluebird');
var request = require('request');
var cheerio = require('cheerio');
var mapsApiKey = 'AIzaSyCI1GoBPD3_D2V6e_4Erek_UQDD-CjTcVg '
var googleplexLat = 37.421915;
var googleplexLon = -122.084100;
var sfStationLat = 37.776597;
var sfStationLon = -122.394685;

console.log('Starting up');

app.get('/', function (req, res) {
  res.sendFile('index.html');
});

app.get('/info', function(req, res) {
	res.sendFile('info.html', { root : __dirname});
});

app.get('/search', function(req, res) {
	var searchString = req.query.search;
	search(searchString).then(function(apartment) {
		res.json(apartment);
	}).catch(function(error) {
		console.log(error);
		res.json({error: error});
	});
});

app.get('/apartments', function(req, res) {
	getAllApartments().then(function(apartments) {
		res.json(apartments);
	});
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port 3000!');
});

function BusStop(lat, long, address) {
	this.lat = lat;
	this.long = long;
	this.address = address;
};

BusStop.prototype.getAddress = function() {
	return this.address;
};
BusStop.prototype.getLat = function() {
	return this.lat;
};
BusStop.prototype.getLong = function() {
	return this.long;
};

class Apartment {
	constructor(address, href, price, img, lat, long, walkScore, transitScore, bikeScore, crimeGrade, 
				closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist, 
				timeToGoogle, timeToSfStation) {
		this.address = address;
		this.href = href;
		this.price = price;
		this.img = img;
		this.lat = lat;
		this.long = long;
		this.walkScore = walkScore;
		this.transitScore = transitScore;
		this.bikeScore = bikeScore;
		this.crimeGrade = crimeGrade;
		this.closestGbusStop = closestGbusStop;
		this.closestGbusStopDist = closestGbusStopDist;
		this.closestFbStop = closestFbStop;
		this.closestFbStopDist = closestFbStopDist;
		this.timeToGoogle = timeToGoogle;
		this.timeToSfStation = timeToSfStation;
	}
}


var gbusStops = [
	new BusStop(37.799374, -122.43905, 'Lombard @ Pierce'),
	new BusStop(37.780259, -122.472442,'Park Presidio @ Geary'),
	new BusStop(37.760079, -122.477024,'19th @ Kirkham'),
	new BusStop(37.737918, -122.475462, '19th @ Wawona'),
	new BusStop(37.79848, -122.424071, 'Van Ness @ Union'),
	new BusStop(37.78796, -122.425311, 'Gough @ Bush'),
	new BusStop(37.78703, -122.41992, 'Polk St @ Post'),
	new BusStop(37.778285, -122.414314, 'Civic Center'),
	new BusStop(37.78795, -122.440462, 'Divisadero @ California'),
	new BusStop(37.773756, -122.432248, 'Oak @ Steiner'),
	new BusStop(37.780452, -122.438954, 'Divisadero @ Eddy'),
	new BusStop(37.771099, -122.437137, 'Divisadero @ Haight'),
	new BusStop(37.768602, -122.453531, 'Stanyan @ Waller'),
	new BusStop(37.761045, -122.435077, '18th @ Castro'),
	new BusStop(37.751598, -122.427704, '24th @ Church'),
	new BusStop(37.748755, -122.420457, 'Valencia @ 26th'),
	new BusStop(37.750969, -122.406313, 'Potrero @ 25th'),
	new BusStop(37.748043, -122.419934, 'Cesar Chavez @ Valencia'),
	new BusStop(37.74815, -122.413958, 'Cesar Chavez @ Folsom'),
	new BusStop(37.748267 -122.409764, 'Cesar Chavez @ Florida'),
	new BusStop(37.741083, -122.423944, 'San Jose @ Dolores'),
	new BusStop(37.789243, -122.388961, 'Google SF Office'),
	new BusStop(37.765535, -122.394787, 'Mississippi @ 17th'),
	new BusStop(37.745667, -122.397201, '201 Toland'),
	new BusStop(37.733362, -122.433555, 'Glen Park Bart'),
	new BusStop(37.79761, -122.40647, 'Columbus @ Broadway'),
	new BusStop(37.77817, -122.39695, 'Brannan @ 4th'),
	new BusStop(37.76502, -122.41928, '16th @ Mission'),
	new BusStop(37.7641673, -122.430559, '16th @ Sanchez')
];

let fbBusStops = [
	new BusStop(37.799540, -122.439701, 'Lombard & Pierce'),
	new BusStop(37.798361, -122.424167, 'Van Ness & Union'),
	new BusStop(37.788041, -122.425547, 'Gough & Bush'),
	new BusStop(37.778548, -122.414635, '8th & Market'),
	new BusStop(37.765028, -122.399861, '17th & Wisconsin'),
	new BusStop(37.761889, -122.410250, 'Bryant & 18th'),
	new BusStop(37.755722, -122.409528, 'Bryant & 22nd'),
	new BusStop(37.772167, -122.401917, '7th & Townsend'),
	new BusStop(37.778934, -122.395337, 'Brannan & 4th'),
	new BusStop(37.800361, -122.410972, 'North Point and Mason'),
	new BusStop(37.797639, -122.406528, 'Broadway and Columbus'),
	new BusStop(37.789222, -122.388778, 'Harrison & Embarcadero'),
	new BusStop(37.764524, -122.430593, '16th & Sanchez'),
	new BusStop(37.748847, -122.420791, 'Valencia & 26th'),
	new BusStop(37.748333, -122.418240, 'Cesar Chavez & Mission'),
	new BusStop(37.773361, -122.437361, 'Divisadero & Oak'),
	new BusStop(37.777639, -122.423250, 'Gough & Grove'),
	new BusStop(37.781056, -122.458778, 'Arguello at Geary'),
	new BusStop(37.780382, -122.438787, 'Divisadero at Eddy'),
	new BusStop(37.773354, -122.446226, 'Fell & Masonic'),
	new BusStop(37.768411, -122.453303, 'Stanyan & Waller'),
	new BusStop(37.773674, -122.431938, 'Oak & Steiner'),
	new BusStop(37.749556, -122.433833, 'Castro & 25th'),
	new BusStop(37.751611, -122.427472, '24th St. & Church'),
	new BusStop(37.741083, -122.423944, 'San Jose & Dolores')
];

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function getDistanceFromLatLonInMiles(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d * 0.6214; // Distance in Miles
}

function findClosestBusStop(lat, long, stops) {
	var minDist = 1e6;
	var minStop = null;
	for (var i = 0; i < stops.length; i++) {
		var stop = stops[i];
		var dist = getDistanceFromLatLonInMiles(lat, long, stop.getLat(), stop.getLong());
		if (dist < minDist) {
			minStop = stop;
			minDist = dist;
		}
	}
	return [minStop, minDist];
}

function findClosestGbusStop(lat, long) {
	return findClosestBusStop(lat, long, gbusStops);
}

function findClosestFbBusStop(lat, long) {
	return findClosestBusStop(lat, long, fbBusStops);
}

function addressToLatLongAddress(address) {
	return new Promise(function(resolve, reject) {
		var encAddr = encodeURIComponent(address);
		// reject('maps disabled');
		request('https://maps.googleapis.com/maps/api/geocode/json?address=' + encAddr + '&key=' + mapsApiKey, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				var json = JSON.parse(body);
				if (json['status'] === 'OK'){
					var location = json['results'][0]['geometry']['location'];
					var full_address = json['results'][0]['formatted_address'];
					resolve([location['lat'], location['lng'], full_address]);
				} else {
					reject(json['status'], response);
				}
			} else {
				reject(error, response);
			}
		});
	});
}

function getTravelTime(origins, destinations) {
	return new Promise(function(resolve, reject) {
		var originString = origins.join('|');
		var destString = destinations.join('|');
		var base_url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&departure_time=1476111600&origins=';
		var url = base_url + originString + '&destinations=' + destString + '&key=' + mapsApiKey;
		request(url, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				var json = JSON.parse(body);
				if (json['status'] === 'OK'){
					var elements = json['rows'][0]['elements'];
					var times = [];
					var trafficTimes = [];
					for (var e of elements) {
						times.push(e['duration']['text']);
						trafficTimes.push(e['duration_in_traffic']['text']);
					}
					resolve([times, trafficTimes]);
				} else {
					reject(json['status']);
				}
			} else {
				reject(error || response);
			}
		});
	});
}

function getGoogleSfStationTravelTimes(lat, long) {
	return new Promise(function(resolve, reject) {
		getTravelTime([lat + ',' + long], [googleplexLat + ',' + googleplexLon, sfStationLat + ',' + sfStationLon]).spread(function(times, trafficTimes) {
			resolve([trafficTimes[0], times[1]]);
		}).catch(function(error) {
			console.log('Reject getGoogleSfStationTravelTimes', error, address);
			reject(error);
		});
	});
}

function getWalkScoreBody(formatted_address) {
	return new Promise(function(resolve, reject) {
		var base_url = 'https://www.walkscore.com/score/'
		formatted_address = formatted_address.replace(/,/g, '').replace(/ /g, '-');
		request(base_url + formatted_address, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				resolve(body);
			} else {
				reject(error || response);
			}
		});
	});
}

function getAddressData(address) {
	return new Promise(function(resolve, reject) {
		var lat, long, closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist;
		var formatted_address, walkScore, transitScore, bikeScore, crimeGrade;

		var llAddress = address;
		if (!llAddress.includes('San Francisco')) {
			llAddress = llAddress + ' San Francisco';
		}
		addressToLatLongAddress(llAddress).spread(function(_lat, _long, _formatted_address) {
			lat = _lat;
			long = _long;
			formatted_address = _formatted_address;

			var arr = findClosestGbusStop(lat, long);
			closestGbusStop = arr[0];
			closestGbusStopDist = arr[1];

			arr = findClosestFbBusStop(lat, long);
			closestFbStop = arr[0];
			closestFbStopDist = arr[1];
			return formatted_address;
		}).then(getWalkScoreBody).then(function(body) {
			var $ = cheerio.load(body);
			var imgArray = $('#address-header div.score-div img').toArray();

			// Scores
			var scores = [];
			for (var img of imgArray) {
				var imgName = $(img).attr('src').split('/').pop();
				var score = imgName.split('.')[0];
				scores.push(score);
			}
			walkScore = scores[0] || -1;
			transitScore = scores[1] || -1;
			bikeScore = scores[2] || -1;

			// Crime Grade
			var crimeGrades = $('div.crime-units div.letter-grade').toArray();
			crimeGrade = 'unknown';
			if (crimeGrades.length > 0) {
				crimeGrade = $(crimeGrades[0]).html().replace(/ /g, '') || 'unknown';
			}
			resolve([lat, long, closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist,
					 formatted_address, walkScore, transitScore, bikeScore, crimeGrade]);
		}).catch(reject);
	});
}

class ApartmentGetter {
	getApartmentItems($) {
		throw Error();
	}

	getAddress(apartment) {
		throw Error();
	}

	getHref(apartment) {
		throw Error();
	}

	getPrice(apartment) {
		throw Error();
	}

	getImage(apartment) {
		throw Error();
	}

	processApartmentAsync(self, jqApartment) {
		return new Promise(function(resolve, reject) {
			var address = self.getAddress(jqApartment);
			var href = self.getHref(jqApartment);
			var price = self.getPrice(jqApartment);
			var image = self.getImage(jqApartment);
			console.log('processAsync address', address);
			getAddressData(address).spread(function(lat, long, closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist, 
													formatted_address, walkScore, transitScore, bikeScore, crimeGrade) {
				getGoogleSfStationTravelTimes(lat, long).spread(function(googleTime, sfStationTime) {
					console.log('resolve processAsync address', address);
					resolve(new Apartment(address, href, price, image, lat, long, walkScore, transitScore, bikeScore, crimeGrade, 
										  closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist, 
										  googleTime, sfStationTime));
				}).catch(function(error) {
					console.log('Reject getTravelTime', error, address);
					reject(error);
				});
			}).catch(function(error) {
				console.log('Reject processApartmentAsync', error, address);
				reject(error);
			});
		});
	}

	getApartments(url) {
		var self = this;
		console.log('Get Apartments:', url);
		return new Promise(function(resolve, reject) {
			request(url, function(error, response, body) {
				console.log('getApartments url response received', url);
				if (!error && response.statusCode === 200) {
					var $ = cheerio.load(body);
					var apartmentItems = self.getApartmentItems($);

					var apartments = [];
					Promise.map(apartmentItems, function(apartment) {
						var jqApartment = $(apartment);
						return self.processApartmentAsync(self, jqApartment).catch(function(error) {
							console.log('processApartmentAsync error');
							console.log(error);
							return Promise.resolve(null);
						}).then(function(apartment) {
							if (apartment !== null && apartment !== undefined) {
								apartments.push(apartment);
							}
						})
					}).timeout(10000).then(function() {
						console.log('Resolving apartments');
						resolve(apartments);
					}).catch(Promise.TimeoutError, function(e) {
						console.log('Timed out. Got number of apartments: ' + apartments.length);
						resolve(apartments);
					}).catch(function(e) {
						console.log('Unexpected getApartments map error', e);
						reject(e);
					});
				} else {
					reject(error || response);
				}
			});
		});
	}
}

class ZillowApartmentGetter extends ApartmentGetter {
	getApartmentItems($) {
		return $('ul.photo-cards').children().toArray();
	}

	getAddress(apartment) {
		return apartment.find('span.zsg-photo-card-address').html();
	}

	getHref(apartment) {
		return 'http://zillow.com' + apartment.find('a.zsg-photo-card-overlay-link').attr('href');
	}

	getPrice(apartment) {
		return apartment.find('span.zsg-photo-card-price').html();
	}

	getImage(apartment) {
		var img = apartment.find('div.zsg-photo-card-img img');
		if (!!img.attr('data-src')) {
			return img.attr('data-src');
		} else {
			return img.attr('src');
		}
	}
}

class TruliaApartmentGetter extends ApartmentGetter {
	getApartmentItems($) {
		return $('ul.srpResultList.propertyList').children().toArray();
	}

	getAddress(apartment) {
		return apartment.find('[itemprop=streetAddress]').html();
	}

	getHref(apartment) {
		return 'http://trulia.com' + apartment.find('div[itemprop=address] a.primaryLink').attr('href');
	}

	getPrice(apartment) {
		return apartment.find('div.line div.lastCol span.h4 span').html();
	}

	getImage(apartment) {
		var img = apartment.find('.mediaImg img');
		if (!!img.attr('data-lazy-src')) {
			return img.attr('data-lazy-src');
		} else {
			return apartment.find('.mediaImg img').attr('src');
		}
	}
}

class PadMapperApartmentGetter extends ApartmentGetter {
	getApartmentItems($) {
		return $('.listings-container').children().toArray();
	}

	getAddress(apartment) {
		return apartment.find('.listing-address').html();
	}

	getHref(apartment) {
		return 'http://zumper.com' + apartment.find('.feedItem-details h3 a').attr('href');
	}

	getPrice(apartment) {
		return apartment.find('.feedItem-details span[ng-bind=::item.priceText]').html();
	}

	getImage(apartment) {
		var img = apartment.find('.feedItem-img');
		if (!!img.attr('ng-src')) {
			return img.attr('ng-src');
		} else {
			return img.attr('src');
		}
	}
}

var apartmentPromises = null;

function timed() {
	console.log('Executing timed');
	var newApartmentPromises = [];
	if (apartmentPromises === null) {
		apartmentPromises = newApartmentPromises;
	}

	var z = new ZillowApartmentGetter();
	newApartmentPromises.push(new Promise(function(resolve) {
		z.getApartments('http://www.zillow.com/homes/for_rent/San-Francisco-CA/apartment_duplex_type/20330_rid/4-_beds/1.5-_baths/0-2304149_price/0-8000_mp/featured_sort/37.785435,-122.364779,37.733593,-122.545023_rect/12_zm/').then(function(apartments) {
			resolve(apartments);
		});
	}));

	var t = new TruliaApartmentGetter();
	newApartmentPromises.push(new Promise(function(resolve) {
		t.getApartments('http://www.trulia.com/for_rent/San_Francisco,CA/4p_beds/2p_baths/0-8000_price/APARTMENT%7CCONDO%7CTOWNHOUSE%7CMULTI-FAMILY%7CLOFT_type').then(function(apartments) {
			resolve(apartments);
		});
	}));

	// var zu = new ZumperApartmentGetter();
	// newApartmentPromises.push(new Promise(function(resolve) {
	// 	zu.getApartments('https://www.zumper.com/apartments-for-rent/san-francisco-ca/4+beds/under-8000?property-categories=apartment').then(function(apartments) {
	// 		resolve(apartments);
	// 	});
	// }));

	Promise.all(newApartmentPromises).then(function() {
		apartmentPromises = newApartmentPromises;
	});
	setTimeout(timed, 30*60*1000);
}
timed();

function getAllApartments() {
	for (var p of apartmentPromises) {
		console.log(p.isFulfilled(), p.isRejected());
	}
	return new Promise(function(resolve) {
		var bigApartmentList = [];
		console.log('big');
		Promise.map(apartmentPromises, function(apartments) {
			bigApartmentList.push(apartments);
			console.log('push');
		}).then(function(){
			resolve([].concat.apply([], bigApartmentList));
			console.log('done');
		});
	});
}

function search(searchString) {
	return new Promise(function(resolve, reject) {
		getAddressData(searchString).spread(function(lat, long, closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist, 
													 formatted_address, walkScore, transitScore, bikeScore, crimeGrade) {
			getGoogleSfStationTravelTimes(lat, long).spread(function(googleTime, sfStationTime) {
				resolve(new Apartment(formatted_address, '', '', '', lat, long, walkScore, transitScore, bikeScore, crimeGrade, 
									  closestGbusStop, closestGbusStopDist, closestFbStop, closestFbStopDist, googleTime, sfStationTime));
			}).catch(reject);
		}).catch(reject);
	});
}
