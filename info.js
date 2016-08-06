$(document).ready(function() {
	var template = '';
	$.get('li.html').done(function(templateText){
		template = Handlebars.compile(templateText);
		$('#search').submit(function(event) {
			event.preventDefault();
			$('#apartment-list').empty();
			$('#loading').show();
			
			 $.ajax('/search?' + $(this).serialize()).done(function(data) {
				for (var i = 0; i < data.length; i++) {
					data[i].closestGbusStopDist = Math.round(data[i].closestGbusStopDist * 1000) / 1000
				}
				var context = {
					apartments: [data]
				}
				$('#loading').hide();
				$('#apartment-list').append(template(context));
			});
		});
	});
});