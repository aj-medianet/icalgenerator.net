function dropdown() {
	var x = document.getElementById("nav");
	if (x.className === "topNav") {
		x.className += " responsive";
	} else {
		x.className = "topNav";
	}
}


//slideshow

$(document).ready(function () {
	//console.log("slideshow setup"); //to know the script is actually running

	var slides = $("#slides"); //get the slides object

	//make sure slides object has children (the slides to show)
	if (slides.children().length) {
		slides.children().first().show(); //show the first one since they are all set to display: none;
		slides.children().first().addClass("active"); //set a class "active to classes so we know which one is displaying
		setTimeout(slideShow, 5000); //call the slideShow() function in 2s, to change the slides
	}

	function slideShow() {
		//console.log('slideshow'); //to know we are in slideshow function

		var s = slides.children(".active"); //get current slide
		s.removeClass("active"); //removes active class from slides

		//the next slide
		var next;

		//checks if last slide by seeing if it is the last child
		if (s.is(":last-child")) {
			next = slides.children().first(); //get first child
		} else {
			next = s.next(); //gets next child
		}
		next.addClass("active"); //add the active class so we can get this slide next slideShow()


		//this is where you can fade in/out, slide in/out, etc..
		s.hide(); //hide the current slide
		next.show(); //show the new slide


		setTimeout(slideShow, 5000); //call again in 2s
	}
});

//returns whatever your type back to you in the console after posting to httpbin
function doStuff() {
	document.getElementById('binSubmit').addEventListener('click', function (event) {
		let req = new XMLHttpRequest();
		payload = document.getElementById('bin').value;
		req.open('POST', 'http://httpbin.org/anything/' + payload, true);
		req.setRequestHeader('Content-Type', 'application/json');
		req.addEventListener('load', function () {
			if (req.status >= 200 && req.status < 400) {
				let response = JSON.parse(req.responseText);
				console.log(response);
			} else {
				console.log("Error in network request: " + req.statusText);
			}
		});
		req.send(JSON.stringify(payload));
		event.preventDefault();
	});
}
