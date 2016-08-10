$(document).ready(function() {
	var template = '';
	$.get('li.html').done(function(templateText){
		template = Handlebars.compile(templateText);
		$('#search').submit(function(event) {
			event.preventDefault();
			$('#apartment-list').empty();
			$('#loading').show();
			
			 $.ajax('/search?' + $(this).serialize()).done(function(data) {
				data.closestGbusStopDist = Math.round(data.closestGbusStopDist * 1000) / 1000;
				data.closestFbStopDist = Math.round(data.closestFbStopDist * 1000) / 1000;
				var context = {
					apartments: [data]
				}
				$('#loading').hide();
				$('#apartment-list').empty(); // empty again in case it gets filled
				$('#apartment-list').append(template(context));
			});
		});
	});
});