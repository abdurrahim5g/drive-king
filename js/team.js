(function (w, d, s, l, i) {
    w[l] = w[l] || []; w[l].push({
        'gtm.start':
            new Date().getTime(), event: 'gtm.js'
    }); var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
            'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-MJGSB2L');

$( document ).ready(function() {
	var scrollFactor = -100;
	var href = window.location.href;
	if (href.endsWith("id=applyNow")) {
		scrollRelativeTo("#applyNow", scrollFactor);
	}
	else if (href.endsWith("id=partneringApproaches")) {
		scrollRelativeTo("#partneringApproaches", scrollFactor);
	}
	$('[data-toggle="tooltip"]').tooltip();
	$("#includeheader").load("header.html");
	$("#includefooter").load("footer.html");
});


$(".forgot-password-link").click(function () {
    $('#myTabs li:nth-child(2) a').tab('show')
});

function scrollRelativeTo(id, px) {
	var x = $(id).position();
	window.scrollTo(x.left, x.top + px)
}
// <!-- Google Tag Manager -->
	
(function (i, s, o, g, r, a, m) {
	i['GoogleAnalyticsObject'] = r;
	i[r] = i[r] || function () {
		(i[r].q = i[r].q || []).push(arguments)
	}, i[r].l = 1 * new Date();
	a = s.createElement(o), m = s.getElementsByTagName(o)[0];
	a.async = 1;
	a.src = g;
	m.parentNode.insertBefore(a, m)
})(window, document, 'script',
	'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-122497508-1', 'auto');
ga('send', 'pageview');

// <!-- End Google Tag Manager -->

$(document).on("scroll", function () {
	if ($(document).scrollTop() > 100) {
		$(".navbar-fixed-top").addClass("navbar-shrink");
		$(".navbar-brand").addClass("navbar-brand-shrink");
	} else {
		$(".navbar-fixed-top").removeClass("navbar-shrink");
		$(".navbar-brand").removeClass("navbar-brand-shrink");
	}
});


// parse team.csv file
function parseCSVToCallback(file, callback, param = null) {
	// This reads in CSV and then calls the callback function to process it
	Papa.parse(file, {
		download: true,
		header:true,
		skipEmptyLines:true,
		delimiter:",",
		complete: function(results) {
			callback(results.data, param);
		}
	});
}

function parseCSVToCallbackUpdate(file) {
	// This reads in CSV and then calls the callback function to process it
	parseCSVToCallback(file, makeTeamMemberGallery)
}

function parseCSVToCallbackForDetail(csvfile, id) {
	parseCSVToCallback(csvfile, makePersonalInfo, id)
}

function makeTeamMemberGallery(teamList) {
	console.log("team list => ", teamList);
	let output = '<div class="row list-team">';
	teamList.map((member, index) => {
		output += `
			<div class="row-col-2">
				<div class="mt-card-item">
					<div class="mt-card-avatar mt-overlay-1">
						<img class="card-img-top" src="img/${member.Headshot}" alt="Card image cap"
							data-nsfw-filter-status="sfw" style="visibility: visible;">
						<div class="mt-overlay">
							<ul class="mt-info">
								<li>`;
							if (member.Description != "")
								output +=
									`<a class="btn default btn-outline" href="team_member.html?id=${index}">
										<i class="fas fa-link grey"></i><span class="grey ml-1">READ MORE</span>
									</a>`;
					output +=  `</li>
							</ul>
						</div>
					</div>
					<div class="mt-card-content">
						<h3 class="mt-card-name mt-3 ">${member.Name}</h3>
						<p class="mt-card-desc font-grey-mint line" data-nsfw-filter-status="swf">${member.Title}</p>
						<div class="mt-card-social">
							<ul>`;
			if (member.LinkedIn) {
					output +=  `<li>
									<a href="${member.LinkedIn}" target="blank">
										<i class="fab fa-linkedin-in"></i>
									</a>
								</li>`;
			}
			if (member.Twitter) {
					output +=  `<li>
									<a href="${member.Twitter}" target="blank">
										<i class="fab fa-twitter"></i>
									</a>
								</li>`;
			}
			output += `
							</ul>
						</div>
					</div>
				</div>
			</div>
		`;
	});
	output += '</div>';
	$("#team-gallery").html(output);
}

function makePersonalInfo(teamList, id) {
	console.log("id => ", id);
	let outputHeader = `
		<div class="row header-banner col-lg-12">
			<img src="img/bio_bg.jpg" alt="" class="banner-bg">
			<div class="back-btn-group">
				<a href="./team.html" aria-label="" data-nsfw-filter-status="swf" class="arrow-group">
					<svg class="arrow-back" xmlns="http://www.w3.org/2000/svg" width="200" height="200"
						viewBox="0 0 200 200" xml:space="preserve">
						<path class="bb1"
							d="M12.733 36.733l32.067-32L40.067 0 0 40.066l40.067 40.067L44.8 75.4l-32.067-32h180.601V200H200V36.733z">
						</path>
						<path class="bb2 visible"
							d="M79.4 36.733l32.067-32L106.733 0 66.667 40.066l40.066 40.067 4.734-4.733-32.067-32h113.934V200H200V36.733z"
							data-original="M79.4 36.733l32.067-32L106.733 0 66.667 40.066l40.066 40.067 4.734-4.733-32.067-32h113.934V200H200V36.733z"
							style="fill: rgb(255, 204, 79); font-weight:700"></path>
					</svg>
				</a>
				<div class="main-breadcrumb-links">
					<a class="crumb bread-item-0" href="./about.html" aria-label="About us"
						data-nsfw-filter-status="swf">About us</a>
					<a class="crumb bread-item-1" href="./team.html" aria-label="Team"
						data-nsfw-filter-status="swf">Team</a>
				</div>
			</div>
			<div class="title text-left">
				<h3 class="text-right">
					${teamList[id].Name}
				</h3>
				<h4 class="mt-2 text-right" style="text-transform: none; margin-top: 10px;">     ${teamList[id].Title}</h4>
			</div>
			<div class="skewspare"></div>
		</div>
		<img class="img-fluid person-avatar" src="img/${teamList[id].Headshot}" alt=""/>
	`;
	let outputDescription = `
		<div class="col-lg-6 col-md-6 text-left pl-5 pr-5 text-content-box" style="z-index: 20;">
			<p>
				${teamList[id].Description}
			</p>
		</div>
	`;
	$("#banner").html(outputHeader);
	$("#member-description").html(outputDescription);
}