"use strict"

var express = require('express');
var app = express();
app.use(express.static(__dirname));
var Promise = require('bluebird');
var request = require('request');
var cheerio = require('cheerio');
var mapsApiKey = 'AIzaSyCI1GoBPD3_D2V6e_4Erek_UQDD-CjTcVg '

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

function GoogleBusStop(lat, long, address) {
	this.lat = lat;
	this.long = long;
	this.address = address;
};

GoogleBusStop.prototype.getAddress = function() {
	return this.address;
};
GoogleBusStop.prototype.getLat = function() {
	return this.lat;
};
GoogleBusStop.prototype.getLong = function() {
	return this.long;
};

class Apartment {
	constructor(address, href, price, img, lat, long, walkScore, transitScore, bikeScore, crimeGrade, closestGbusStop, closestGbusStopDist) {
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
	}
}


var gbusStops = [
	new GoogleBusStop(37.799374, -122.43905, 'Lombard @ Pierce'),
	new GoogleBusStop(37.780259, -122.472442,'Park Presidio @ Geary'),
	new GoogleBusStop(37.760079, -122.477024,'19th @ Kirkham'),
	new GoogleBusStop(37.737918, -122.475462, '19th @ Wawona'),
	new GoogleBusStop(37.79848, -122.424071, 'Van Ness @ Union'),
	new GoogleBusStop(37.78796, -122.425311, 'Gough @ Bush'),
	new GoogleBusStop(37.78703, -122.41992, 'Polk St @ Post'),
	new GoogleBusStop(37.778285, -122.414314, 'Civic Center'),
	new GoogleBusStop(37.78795, -122.440462, 'Divisadero @ California'),
	new GoogleBusStop(37.773756, -122.432248, 'Oak @ Steiner'),
	new GoogleBusStop(37.780452, -122.438954, 'Divisadero @ Eddy'),
	new GoogleBusStop(37.771099, -122.437137, 'Divisadero @ Haight'),
	new GoogleBusStop(37.768602, -122.453531, 'Stanyan @ Waller'),
	new GoogleBusStop(37.761045, -122.435077, '18th @ Castro'),
	new GoogleBusStop(37.751598, -122.427704, '24th @ Church'),
	new GoogleBusStop(37.748755, -122.420457, 'Valencia @ 26th'),
	new GoogleBusStop(37.750969, -122.406313, 'Potrero @ 25th'),
	new GoogleBusStop(37.748043, -122.419934, 'Cesar Chavez @ Valencia'),
	new GoogleBusStop(37.74815, -122.413958, 'Cesar Chavez @ Folsom'),
	new GoogleBusStop(37.748267 -122.409764, 'Cesar Chavez @ Florida'),
	new GoogleBusStop(37.741083, -122.423944, 'San Jose @ Dolores'),
	new GoogleBusStop(37.789243, -122.388961, 'Google SF Office'),
	new GoogleBusStop(37.765535, -122.394787, 'Mississippi @ 17th'),
	new GoogleBusStop(37.745667, -122.397201, '201 Toland'),
	new GoogleBusStop(37.733362, -122.433555, 'Glen Park Bart'),
	new GoogleBusStop(37.79761, -122.40647, 'Columbus @ Broadway'),
	new GoogleBusStop(37.77817, -122.39695, 'Brannan @ 4th'),
	new GoogleBusStop(37.76502, -122.41928, '16th @ Mission'),
	new GoogleBusStop(37.7641673, -122.430559, '16th @ Sanchez')
]

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

function findClosestGbusStop(lat, long) {
	var minDist = 1e6;
	var minStop = null;
	for (var i = 0; i < gbusStops.length; i++) {
		var stop = gbusStops[i];
		var dist = getDistanceFromLatLonInMiles(lat, long, stop.getLat(), stop.getLong());
		if (dist < minDist) {
			minStop = stop;
			minDist = dist;
		}
	}
	return [minStop, minDist];
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



function getWalkScoreBody(formatted_address) {
	return new Promise(function(resolve, reject) {
		var base_url = 'https://www.walkscore.com/score/'
		formatted_address = formatted_address.replace(',', '').replace(' ', '-');
		request(base_url + formatted_address, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				resolve(body);
			} else {
				reject(error, response);
			}
		});
	});
}

function getAddressData(address) {
	return new Promise(function(resolve, reject) {
		var lat, long, closestGbusStop, closestGbusStopDist, formatted_address, walkScore, transitScore, bikeScore, crimeGrade;
		var llAddress = address;
		if (!llAddress.includes('San Francisco')) {
			llAddress = llAddress + ' San Francisco';
			console.log(llAddress);
		}
		addressToLatLongAddress(llAddress).spread(function(_lat, _long, _formatted_address) {
			lat = _lat;
			long = _long;
			formatted_address = _formatted_address;

			var arr = findClosestGbusStop(lat, long);
			closestGbusStop = arr[0];
			closestGbusStopDist = arr[1];
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
				crimeGrade = $(crimeGrades[0]).html().replace(' ', '') || 'unknown';
			}
			resolve([lat, long, closestGbusStop, closestGbusStopDist, formatted_address, walkScore, transitScore, bikeScore, crimeGrade]);
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
			getAddressData(address).spread(function(lat, long, closestGbusStop, closestGbusStopDist, formatted_address, walkScore, transitScore, bikeScore, crimeGrade) {
				resolve(new Apartment(address, href, price, image, lat, long, walkScore, transitScore, bikeScore, crimeGrade, closestGbusStop, closestGbusStopDist));
			}).catch(function(error) {
				console.log(error);
				reject(error);
			});
		});
	}

	getApartments(url) {
		var self = this;
		return new Promise(function(resolve, reject) {
			request(url, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					var $ = cheerio.load(body);
					var apartmentItems = self.getApartmentItems($);

					var apartments = [];
					Promise.map(apartmentItems, function(apartment) {
						var jqApartment = $(apartment)
						return self.processApartmentAsync(self, jqApartment).catch(function(error) {
							console.log(error);
							return Promise.resolve(null);
						}).then(function(apartment) {
							if (apartment !== null && apartment !== undefined) {
								apartments.push(apartment);
							}
						})
					}).timeout(20000).then(function() {
						resolve(apartments);
					}).catch(Promise.TimeoutError, function(e) {
						console.log('Timed out. Got number of apartments: ' + apartments.length);
						resolve(apartments);
					});
				} else {
					reject(error, response);
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

var apartmentPromises = null;

function timed() {
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
			resolve(apartments)
		});
	}));
	Promise.all(newApartmentPromises).then(function() {
		apartmentPromises = newApartmentPromises;
	});
	setTimeout(timed, 30*60*1000);
}
timed();

function getAllApartments() {
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
		getAddressData(searchString).spread(function(lat, long, closestGbusStop, closestGbusStopDist, formatted_address, walkScore, transitScore, bikeScore, crimeGrade) {
			resolve(new Apartment(formatted_address, '', '', '', lat, long, walkScore, transitScore, bikeScore, crimeGrade, closestGbusStop, closestGbusStopDist));
		}).catch(reject);
	});
}
