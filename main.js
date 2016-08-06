$(document).ready(function() {
	var apartments = []
	var template = '';
	$.ajax('li.html').done(function(templateText){
		template = Handlebars.compile(templateText);

		$.ajax('/apartments').done(function(data) {
			for (var i = 0; i < data.length; i++) {
				data[i].closestGbusStopDist = Math.round(data[i].closestGbusStopDist * 1000) / 1000
			}
			var context = {
				apartments: data
			}
			reapplyTemplate(context);
			apartments = data;
			console.log(apartments);
		});
	});

	$('#sort-option').change(function () {
	    var id = $(this).attr('id');
	    sortApartments();
	});

	$('#inc-dec-button').on('click', function() {
		obj = $(this);
		if (obj.hasClass('inc')) {
			obj.removeClass('inc');
			obj.find('.text').text('Dec.')
			obj.find('.glyphicon').removeClass('glyphicon-chevron-up');
			obj.find('.glyphicon').addClass('glyphicon-chevron-down');
			obj.addClass('dec');
		} else {
			obj.removeClass('dec');
			obj.find('.text').text('Inc.')
			obj.find('.glyphicon').removeClass('glyphicon-chevron-down');
			obj.find('.glyphicon').addClass('glyphicon-chevron-up');
			obj.addClass('inc');
		}
		sortApartments();
	});

	function sortApartments() {
		var key = $("#sort-option").find(":selected").attr('id');
		var increasing = $('#inc-dec-button').hasClass('inc');
		console.log(key);

		var newApartments = apartments.slice();
		function sortHelper(map) {
			newApartments.sort(function(a, b){
				if (map !== null && map !== undefined) {
					a_new = map(a);
					b_new = map(b);	
				}
				return a_new-b_new;
			});	
			if (!increasing) {
				newApartments.reverse();
			}
		}
		switch(key) {
			case 'sortPrice':
				sortHelper(function(a) {
					if (typeof(a.price) == 'string') {
						return parseInt(a.price.replace(/[^0-9\.]/g,''));
					}
					if (typeof(a.price) == 'number') {
						return a.price;
					}
					return 0;
				});
				break;
			case 'sortWalkScore':
				sortHelper(function(a) { 
					if (typeof(a.walkScore) == 'string') {
						return parseInt(a.walkScore.replace(/[^0-9\.]/g,''));
					}
					if (typeof(a.walkScore) == 'number') {
						return a.walkScore;
					}
					return 0;
				});
				break;
			case 'sortTransitScore':
				sortHelper(function(a) { 
					return parseInt(a.transitScore.replace(/[^0-9\.]/g,''));
				});
				break;
			case 'sortBikeScore':
				sortHelper(function(a) { 
					return parseInt(a.bikeScore.replace(/[^0-9\.]/g,''));
				});
				break;
			case 'sortGbusDistance':
				sortHelper(function(a) { 
					if (typeof(a.closestGbusStopDist) == 'string') {
						return parseFloat(a.closestGbusStopDist.replace(/\D/g,''));
					}
					if (typeof(a.closestGbusStopDist) == 'number') {
						return a.closestGbusStopDist;
					}
					return 0;
				});
				break;
			case 'sortCrimeGrade':
				sortHelper(function(a) {
					switch($.trim(a.crimeGrade)) {
						case 'A':
							return 4;
							break;
						case 'B':
							return 3;
							break;
						case 'C':
							return 2;
							break;
						case 'D':
							return 1;
							break;
						default:
							return 0;
							break;
					}
				});
				break;
		}
		var context = {
			apartments: newApartments
		};
		reapplyTemplate(context);
	}

	function reapplyTemplate(context) {
		$('#apartment-list').empty();
		$('#apartment-list').append(template(context));
	}
});