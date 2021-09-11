//Hack for IE to implement startsWith
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

//The id of the currently active tab.
//Defaults to the set value.
var activeTabId = "impact-areas";

//The default selector when the page loads.
var defaultSelector = "#sepsisselector";

//Returns the id of the element in the currently active tab.
//Element ids have the form <prefix>-<activeTabId>.
var resolveId = function(prefix) {
	return "#" + prefix + "-" + activeTabId;
};

var holderwidth = $(resolveId("mapholder")).width();
var holderheight = holderwidth * .58;

if ($(window).height() < $(window).width()) {

	$(resolveId("picholder")).height($("body").height());
}

var margin = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
},
width = holderwidth - margin.left - margin.right,
height = holderheight - margin.top - margin.bottom;

var active = d3.select(null);

var projection = d3.geoAlbersUsa()
// this is preferable but ha bug breaking point mapping
// var projection = albersUsaPr()
.scale(width)
.translate([width / 2, (height / 2) + 30]);

var zoom = d3.zoom()
.scaleExtent([1, 9])
.on("zoom", zoomed);

var rateById = d3.map();

var path = d3.geoPath()
.projection(projection);

var tooltip = d3.selectAll(".mapholder")
.append("div")
.attr("class", "tooltip")
.style("position", "absolute")
.style("z-index", "10")
.style("opacity", "0");

var dottip = d3.selectAll(".vizholder")
.append("div")
.attr("class", "dottip")
.style("z-index", "10")
d3.select(".dottip").style("height", height + "px")
.style("opacity", "0");

var color = d3.scaleQuantile()
// dark to light for dark ground map
// .range(['#1c3650', '#405870', '#647d92', '#89a3b5', '#afccd9',
// '#d7f6ff']);

// .range(['#1c3650', '#496178', '#7690a3', '#a5c1d0', '#d7f6ff']);

// grayscale for white ground map
.range(d3.schemeGreys[5]);

// logo greens range
// .range(['#d9e6db', '#b4ceb8', '#8fb696', '#6a9e76', '#458656',
// '#156f38']);

var x = d3.scaleLinear()
.domain([0, 10])
.rangeRound([0, width * .25]);

var x2 = d3.scaleTime();
var weekOfYear = d3.timeFormat("%U");

var insert;

var resetbutton = d3.selectAll(".mapdiv")
.append("div")
.attr("class", "reset_map ovelaytext")
.html("reset zoom")
.style("top", height - 30 + "px")

var svg = d3.selectAll(".mapdiv")
.append("svg")
.attr("width", holderwidth)
.attr("height", holderheight);

var sources = d3.select(resolveId("vizholder")).append("div")
.attr("class", "sources");

// Horizontal Lines
svg
.append('defs')
.append('pattern')
.attr('id', 'texture0')
.attr('patternUnits', 'userSpaceOnUse')
.attr("patternTransform", "rotate(45)")
.attr('width', 2.5)
.attr('height', 3)
.append('path')
.attr('class', 'stripeline')
.attr('d', 'M 0 0 L 0 10')

// Horizontal Lines
svg
.append('defs')
.append('pattern')
.attr('id', 'texture1')
.attr('patternUnits', 'userSpaceOnUse')

.attr('width', 6)
.attr('height', 6)
.append('path')
.attr('class', 'stripeline')
.attr('d', 'M 5 0 L 5 0')

var background = svg.append("rect")
.attr("class", "background")
.attr("width", width)
.attr("height", height)
.on("click", reset);
var wholemap = svg.append("g")
.attr("class", ".wholemap")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

queue()

.defer(d3.json, "data/us-states.json")
// .defer(d3.json, "data/US_States_w_PR_labels.json")
.defer(d3.json, "data/us-counties.json")
.defer(d3.json, "data/us-115th-congress-members_mapshaped.json")
.defer(d3.csv, "data/sepsis_deaths_county_1999-2016.csv")
.defer(d3.csv, "data/ILI_StateDatabySeason57_culled.csv")
.defer(d3.csv, "data/product-types.csv")
.defer(d3.csv, "data/impact-areas.csv")
.defer(d3.csv, "data/technology-levels.csv")
.defer(d3.csv, "data/countries.csv")
.defer(d3.csv, "data/AcceleratorList_20180518.csv")
.defer(d3.csv, "data/ProductList_20180913.csv")
.await(ready);

function ready(error, us, counties, districts, sepsis, flu, productTypes, impactAreas, technologyLevels, countries, acceleratorList, productList) {
	
	makeCounters(productList);
	
	if (error) throw error;
	
	//Set the default active tab pane.
	activeTabId = d3.select(".tab-content > .active").attr("id");
	
	// Handler that dispatches a 'click' event that loads the default map for the selected tab.
	var onShowTab = function(e) {
		
		// Update the tab id.
		var id = $(e.target).attr("href");
		id = id.substring(1);
		activeTabId = id;
		
		// Dispatch click event to load map.
		var newTab = $(e.target).text().trim();
		var oldTab = $(e.relatedTarget).text().trim();
		if (newTab == "Impact Areas") {
			d3.select(defaultSelector).dispatch("click");
		}
		else if (newTab == "Investments") {
			d3.select("#accelselector").dispatch("click");
		}
		else if (newTab == "Gallery") {	
			// Sort	by company and then product
			makeGallery(productList.sort(function(a,b) {
				return ( d3.ascending(a.Name + a.ProductName, b.Name + b.ProductName) )
			}
			));
		}
	};
	
	// Register onShowTab() as the 'onclick' handler for the tab links.
	$("a[data-toggle='tab']").on("shown.bs.tab", onShowTab);
	
	//===========================================
	//Initialize the gallery filters.
	
	// Reset all filters except for the selected filter back to its default value.
	// Then update the gallery based on the selected filter.
	var onFilterSelect = function() {
		var id = d3.select(this).select("select").attr("id");
		var value = d3.select(this).select("select").property("value");
		d3.selectAll(".gallery-drop-down")
			.each(function() {
				var selectionId = d3.select(this).select("select").attr("id");
				if (selectionId != id) {
					d3.select("#" + selectionId).property("selectedIndex", 0);
				}
				else {
					updateGallery(value);
				}
			});
	};
	
	function initializeSelectionList(listItems, dropDownId, defaultValue) {
		var menuList = listItems.map(function(item) {
			return {"id" : item.id, "type" : item.type, "name" : item.name};
		});
		menuList.unshift({"id" : 0, "type" : defaultValue, "name" : defaultValue });
		d3.select(dropDownId)
			.append("select")
			.attr("id", function (item) {
				return dropDownId.substring(1) + "-select";
			})
			.attr("class", "dropdown_portfolio")
			.selectAll("option")
			.data(menuList)
			.enter()
			.append("option")
			.attr("value", function (item) {
				return item.type; //item.id;
			})
			.attr("class", "dropdown_portfolio")
			.text(function (item) {
				return item.name;
			});
		d3.select(dropDownId).on('change', onFilterSelect);
	}
		
	initializeSelectionList(impactAreas, "#zoomdrop-impact-area-drop-down", "Select impact area");
	initializeSelectionList(productTypes, "#zoomdrop-product-type-drop-down", "Select product type");
	initializeSelectionList(technologyLevels, "#zoomdrop-technology-level-drop-down", "Select technology level");
	initializeSelectionList(countries, "#zoomdrop-country-level-drop-down", "Select country");
	
	//===========================================

	var districtdefs = districts.features;
	var statedefs = us.features;
	var countydefs = counties.features;

	menulist = statedefs.map(function (d) {
		return d.properties.name
	});

	menulist.unshift("Select a State");

	dropDownClass = ".us-state-drop-down";
	d3.selectAll(dropDownClass)
	.append("select")
	.selectAll("option")
	.data(menulist)
	.enter()
	.append("option")
	.attr("value", function (d) {
		return d;
	})
	.text(function (d) {
		return d;
	})

	d3.selectAll(dropDownClass).on('change', function () {

		var selectedState = d3.select(this)
		.select("select")
		.property("value")

		var thisfill = statefills.filter(function (d) {
			return d.properties.name == selectedState
		});

		thisfill.dispatch("click");
	});

	var formatDateIntoMonthYear = d3.timeFormat("%b %Y");
	var formatDate = d3.timeFormat("%b %Y");
	var parseDate = d3.timeParse("%b-%d-%Y");

	flu.forEach(function (d) {
		d.WEEKEND = parseDate(d.WEEKEND);
	})

	var counties = wholemap.append("g")
	.attr("class", "counties")
	.selectAll("path")
	.data(countydefs)
	.enter()
	.append("path")
	.attr("id", function (d) {
		return d.properties.County
	})
	.attr("d", path);

	var districts = wholemap.append("g")
	.attr("class", "districts")
	// .attr("clip-path", "url(#clip-land)")
	.selectAll("path")
	// .data(topojson.feature(congress,
	// congress.objects.districts).features)
	.data(districtdefs)
	.enter().append("path")
	.attr("d", path)
	.on("click", clicked);

	var statefills = wholemap.append("g")
	.attr("class", "states")
	.selectAll("path")
	// .datum(topojson.mesh(us, us.objects.states))
	.data(statedefs)
	.enter().append("path")
	.attr("id", function (d) {
		return d.properties.name
	})
	.attr("d", path)
	.on("click", clicked);

	var key = svg.append("g")
	.attr("class", "key")
	.attr("transform", "translate(" + (width - 40 - x.range()[1]) + ",30 )");

	var keybg = key.append("rect")
	.attr("class", "keybg")
	.attr("width", x.range()[1] + 20)
	.attr("height", 60)
	.attr("x", 0)
	.attr("transform", "translate(-10,-30)");

	var keyrects = key.selectAll(".keyrect");

	var keytext = key.append("text")
	.attr("class", "caption")
	.attr("x", x.range()[1])
	.attr("y", -6)
	.attr("text-anchor", "end");

	key.call(d3.axisBottom(x)
			.tickSize(13)
			.tickFormat(function (x, i) {
				return i ? x : x;
			})
			.tickValues(color.domain()))
			.select(".domain")
			.remove();

	//var sliderholder = d3.select(resolveId("mapdiv-impact-areas")).append("svg")
	var sliderholder = d3.select("#mapdiv-impact-areas").append("svg")
	.attr("width", width)
	.attr("height", height / 4 + 25)
	.attr("class", "sliderholder");

	function shademap(shadedata, stringlabel, shadevar, shadearea) {
		// zoom back out for init view
		reset();
		dottip.style("opacity", 0)


		if (d3.select(".slider").empty() == false) {
			d3.select(".slider")
			.transition()
			.duration(800)
			.ease(d3.easePolyOut)
			.style("opacity", 0)
			.on("end", function () {
				d3.select(this).remove()
			});

		}

		color.domain(d3.extent(shadedata.map(function (d) {
			return +d[shadevar];

		})))

		x.domain([d3.min(shadedata, function (d) {
			return +d[shadevar];
		}), d3.max(shadedata, function (d) {
			return +d[shadevar];
		})])

		keyrects = key.selectAll(".keyrect")
		.data(color.range());

		keyrects
		.enter()
		.append("rect")
		.attr("class", "keyrect")
		.merge(keyrects);

		keyrects = d3.selectAll(".keyrect");

		keyrects
		.data(color.range().map(function (d) {
			d = color.invertExtent(d);
			if (d[0] == null) d[0] = x.domain()[0];
			if (d[1] == null) d[1] = x.domain()[1];

			return d;
		})).attr("height", 8)
		.attr("x", function (d) {
			return x(d[0]);
		})
		.attr("width", function (d) {
			return x(d[1]) - x(d[0]);
		})
		.attr("fill", function (d) {
			return color(d[0]);
		});

		var tickvals = color.range().map(function (d, i) {
			d = color.invertExtent(d);
			if (d[0] == null) d[0] = x.domain()[0];
			if (d[1] == null) d[1] = x.domain()[1];
			return d[1].toFixed(0);

		});

		tickvals.unshift(color.domain()[0].toFixed(0));

		key.call(d3.axisBottom(x)
				.tickSize(13)
				.tickFormat(function (x, i) {
					return i ? x : x;
				}).tickValues(tickvals)

		)
		.select(".domain")
		.remove();

		if (stringlabel == "sepsis") {
			$("#instructions").html("<h3>Sepsis Deaths by County 1999-2016 </h3>").css("opacity", 1)

			d3.select(resolveId("picholder"))
			.transition()
			.duration(800)
			.style("opacity", 0)
			.on("end", function () {
				d3.select(resolveId("picholder"))
				.transition()
				.duration(800)
				.style("opacity", .1)
				.style("background-size", "cover")
				.style("height", $(resolveId("map-col")).height());
				d3.select(resolveId("map-col"))
				.style("background", "url(images/e_coli.jpg)");
			})

			shadedata.forEach(function (d) {
				// ****NEW EDIT ***** this is replacement for .includes
				// which breaks IE

				var string = d[shadevar],
				substring = "(Unreliable)";

				if (string.indexOf(substring) !== -1) {
					rateById.set(d.CountyCode, "na");
				} else {

					rateById.set(d.CountyCode, parseFloat(d[shadevar]));
				}
			});

			countyShade();

			var keylabel = "septecimia death rate per 100,000";
//			$("#instructions").css("opacity", 0);
			sources.html("¹The number of deaths per 100,000 total population. Source: https://wonder.cdc.gov<br/>Image Courtesy: National Institute of Allergy and Infectious Diseases</br><a href='data/sepsis_deaths_county_1999-2016.csv'>Download sepsis by county data displayed on this map</a>")

			$(resolveId("picholder")).height($("body").height());
		} 
		else if (stringlabel == "flu") {


			var keylabel = "CDC Influenza-Like Illness (ILI) Activity Level Indicator";

			$("#instructions").html("<h3>2017-18 Influenza Season</h3> press play on timeline below to animate").css("opacity", 1)

			d3.select(resolveId("picholder"))
			.transition()
			.duration(800)
			.style("opacity", 0)
			.on("end", function () {
				d3.select(resolveId("picholder"))
				.transition()
				.duration(800)
				.style("opacity", .1)
				.style("background-size", "cover")
				.style("height", $(resolveId("map-col")).height());
				d3.select(resolveId("map-col"))
				.style("background", "url(images/flu_small_faded.jpg)");
			})

			var currentweek = 40;

			var currentweekdata = shadedata.filter(function (d) {

				return parseInt(d.WEEK) == currentweek;

			});




			currentweekdata.forEach(function (d) {
				// *****NEW EDIT for where includes breaks IE
				var string = d[shadevar],
				substring = "NA";

				if (string.indexOf(substring) !== -1) {
					rateById.set(d.State, "na");
				} else {

					rateById.set(d.State, parseFloat(d[shadevar]));
				}
			});

			var timespan = d3.extent(flu.map(function (d) {
				return d.WEEKEND;
			}));


			var allweeks = d3.scaleOrdinal()
			.domain(flu.map(function (d) {
				return d.WEEK
			}));

			var moving = false;
			var currentValue = 0;
			var targetValue = width / 2;

			x2.domain(timespan)
			.range([0, targetValue])
			.clamp(true)
			.nice();

			var slider = sliderholder.append("g")
			.attr("class", "slider")
			// .attr("transform", "translate(" + (margin.left + width/4)
			// + "," + height / 5 + ")");
			.attr("transform", "translate(" + (margin.left + width / 4) + "," + 50 + ")");

			var playButton = slider.append("g")
			.attr("id", "play-button")
			.attr("transform", "translate(" + (-60) + "," + -20 + ") scale(1.6)")

			.moveToFront();

			playButton.append("path")
			.attr("class", "bg")
			.attr("d", "M0 0h24v24H0z");

			var playstatus = playButton.append("path")
			.attr("class", "playstatus")
			.attr("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z");

			playButton.append("text")
			.attr("dx", 4)
			.attr("dy", 4)
			// .text("▶");
			.text("play")
			.style("display", "none");

			playButton.moveToFront();

			slider.append("line")
			.attr("class", "track")
			.attr("x1", x2.range()[0])
			.attr("x2", x2.range()[1])
			.select(function () {
				return this.parentNode.appendChild(this.cloneNode(true));
			})
			.attr("class", "track-inset")
			.select(function () {
				return this.parentNode.appendChild(this.cloneNode(true));
			})
			.attr("class", "track-overlay")
			.call(d3.drag()
					.on("start.interrupt", function () {
						slider.interrupt();
					})
					.on("start drag", function () {
						currentValue = d3.event.x;
						update(x2.invert(currentValue));
					})
			);

			insert = slider.insert("g", ".track-overlay")
			.attr("class", "ticks")
			.attr("transform", "translate(0," + 2 + ")");

			insert.call(d3.axisBottom(x2)
					.ticks(d3.timeWeek, 1)
					.tickSize(13)
					// .tickFormat(function(d){return parseInt( weekOfYear(d) )
					// })
					.tickFormat(function (d) {
						if (weekOfYear(d) == 52) {
							return 1
						} else {
							return parseInt(weekOfYear(d)) + 1
						}
					})

			);

			insert.append("text")
			.attr("id", "axislabel")
			.text("2017-18 Influenza Season Week")
			.attr("x", targetValue / 2)
			.attr("y", 50)

			var handle = slider.insert("circle", ".track-overlay")
			.attr("class", "handle")
			.attr("r", 5)

			var label = slider.append("text")
			.attr("class", "label")
			.attr("text-anchor", "middle")
			.text(formatDate(timespan[0]))
			.attr("transform", "translate(0," + (-25) + ")")

			wholemap.select(".track-overlay").moveToFront();

			// //////// end slider //////////

			playButton
			.on("click", function () {
				var button = d3.select(this);
				if (button.select("text").text() == "pause") {
					moving = false;
					clearInterval(timer);
					// timer = 0;
					button.select("text").text("play");
					playstatus.attr("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z");

				} else {
					moving = true;
					// *** NEW EDIT- change timing from 200 for slower
					// playback
					timer = setInterval(step, 500);
					button.select("text").text("pause")
					playstatus.attr("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z");

				}
			})

			function step() {
				update(x2.invert(currentValue));

				// change this to #of weeks
				currentValue = currentValue + (targetValue / allweeks.domain().length);
				if (currentValue > targetValue) {
					moving = false;
					currentValue = 0;
					clearInterval(timer);
					// timer = 0;
					playButton.select("text").text("▶");
					// console.log("step Slider moving: " + moving);
					// *** NEW EDIT----start again at beginning
					playButton.dispatch("click");
				}
			};


			function update(h) {
				// update position and text of label according to slider
				// scale
				handle.attr("cx", x2(h));
				label
				.attr("x", x2(h))
				.text(formatDate(h));

				var epiweek = weekOfYear(h);

				currentweek = parseInt(epiweek) + 1;
				// hacky fix
				if (currentweek > 17 && currentweek < 40) {
					currentweek = 17
				}

				// filter data set and redraw plot
				// var newData = flu.filter(function (d) {
				var newData = shadedata.filter(function (d) {
					return parseInt(d.WEEK) == currentweek;

				})

				newData.forEach(function (d) {
					// *****NEW EDIT for includes breaking IE
					var string = d[shadevar],
					substring = "NA";

					if (string.indexOf(substring) !== -1) {
						rateById.set(d.State, "na");
					} else {
						rateById.set(d.State, parseFloat(d[shadevar]));
					}
				});

				stateShade();

			}

			// initial so filtering all data to first week

			stateShade();

			sources.html("Source: https://gis.cdc.gov/grasp/fluview/main.html#</br><a href='data/ILI_StateDatabySeason57_culled.csv'>Download influenza-like-illness season data displayed on this map</a>")

			$(resolveId("picholder")).height($("body").height());

		} // end if flu
		else {

		} // end for accelerators

		function countyShade() {

			// counties.style("opacity", 1);
			wholemap.select(".counties").style("opacity", 1)


			statefills.transition()
			.duration(900)
			.ease(d3.easeBackOut)
			.style("fill-opacity", 0)
			.style("stroke-width", 1)
			.on("end", function () {

				statefills.style("fill", "none")
				.style("pointer-events", "none")
				.classed("poordata", false);
			});

			counties.attr("class", function (d) {

				if (!isNaN(rateById.get(d.id))) {
					return "county"
				} else {
					return "county poordata";
				}

			})
			.transition()
			.duration(600)
			.style("fill", function (d) {
				if (stringlabel == "sepsis") {
					if (d3.select(this).classed("poordata") == true) {
						return 'url(#texture0)';
					} else if (!isNaN(rateById.get(d.id))) {
						return color(rateById.get(d.id));
					} else {
						return '';
					}
				} else {
					return "none"
				}

			})
			.style("pointer-events", "all");


			counties.on("mouseenter", function (d) {

				var thispath = d3.select(this)

				var thiscounty = d.id;

				var thisdata = sepsis.filter(function (v) {
					return v.CountyCode == thiscounty
				});


				thispath.moveToFront();

				if (thispath.classed("active") == false) {
					thispath.transition()
					.duration(200)
					.ease(d3.easePolyOut)
					.style("stroke-width", 1)

				}
				tooltip.html("<div id='tipContainer'><div class='tipfirst'><b>" + thisdata[0].County + "</b></div><div id='tipKey'>Death rate per 100,000 persons (age adjusted): <b>" + thisdata[0].AgeAdjustedRate + "</b><br>Deaths: <b>" + thisdata[0].Deaths + "</b><br>out of: <b>" + commaFormat(thisdata[0].Population) + " population</b></div><div class='tipClear'></div> </div>");

				tooltip
				.transition()
				.duration(400)
				.ease(d3.easePolyOut)
				.style("opacity", 1);

			}).on("mouseleave", function (d) {

				var thispath = d3.select(this)
				if (thispath.classed("active") == false) {

					thispath.transition()
					.duration(200)
					.ease(d3.easePolyOut)
					// .style("stroke", "#c7dee4")
					.style("stroke-width", 0)

				}
				tooltip
				.transition()
				.duration(400)
				.ease(d3.easePolyOut)
				.style("opacity", 0);
			}).on("mousemove", function (d, v) {

				myPos = d3.mouse(this);
				myX = myPos[0];
				myY = myPos[1];

				var coords = getScreenCoords(myX, myY, this.getCTM());

				myX = coords.x;
				myY = coords.y;

				return tooltip.style("top", myY + -10 + "px").style("left", myX + 20 + "px")
			})
			.on("click", clicked);
		}

		function stateShade() {

			statefills.style("fill-opacity", 1);
			wholemap.select(".states").style("fill-opacity", 1);

			// this has to select the G.. not the individually slected
			// counties or is is slow AF
			wholemap.select(".counties").transition()
			.duration(900)
			.ease(d3.easeBackOut)
			.style("opacity", 0)
			.on("end", function () {
				counties.style("fill", "none")
				.style("stroke-width", 0)
				.style("pointer-events", "none")
				.classed("poordata", false);
			});

			statefills.attr("class", function (d) {
				if (!isNaN(rateById.get(d.properties.name))) {
					return "statefill"
				} else {
					return "statefill poordata";
				}
			})
			.transition()
			// this needs to be shorter than the timer interval on play
			// of timeline
			.duration(180)
			.style("fill", function (d) {
				if (stringlabel == "flu") {

					if (d3.select(this).classed("poordata") == true) {
						return 'url(#texture0)';
					} else if (!isNaN(rateById.get(d.properties.name))) {
						return color(rateById.get(d.properties.name));
					} else {
						return '';
					}
				} else {
					return "none"
				}

			})
			.style("fill-opacity", function (d) {
				if (stringlabel == "flu") {
					return 1
				}
			})
			.style("pointer-events", "all");

			statefills.on("mouseenter", function (d) {

				var thispath = d3.select(this)

				thispath.moveToFront()
				if (thispath.classed("active") == false) {
					thispath.transition()
					.duration(200)
					.ease(d3.easePolyOut)
					.style("stroke-width", 3)
				}

				tooltip.style("opacity", 1);


			}).on("mouseleave", function (d) {
				var thispath = d3.select(this)
				if (thispath.classed("active") == false) {

					thispath.transition()
					.duration(200)
					.ease(d3.easePolyOut)
					.style("stroke-width", 1)

				}
				tooltip.style("opacity", 0);
			}).on("mousemove", function (d, v) {

				var thisstate = d.properties.name;

				var thisdata = shadedata.filter(function (v) {
					return v.State == thisstate && v.WEEK == currentweek
				});

				myPos = d3.mouse(this);
				myX = myPos[0];
				myY = myPos[1];

				var coords = getScreenCoords(myX, myY, this.getCTM());

				myX = coords.x;
				myY = coords.y;

				return tooltip.style("top", myY + -10 + "px").style("left", myX + 20 + "px")

				.html("<div id='tipContainer'><div class='tipfirst' id='tipLocation'><b>" + thisstate + "</b></div><div id='tipKey'>Influenza-Like Illness (ILI) Activity Level: <b>" + thisdata[0].AcLevNum + "</b><br/><div id='tipKey'>Activity Level: <b>" + thisdata[0].ACTIVITY_LEVEL_LABEL + "</b><br/>Week: <b>" + thisdata[0].WEEK + "</b></div><div class='tipClear'></div> </div>");

			})

		};
		keytext.text(keylabel)
		.attr("x", x.range()[1])
		.attr("text-anchor", "end");
	} // end shademap


	function updatedots(data, dottype) {

		data.forEach(function (d) {
			d.lat = +d.lat;
			d.lon = +d.lon;


			d.coords = [d.lon, d.lat];
		})
		var asides;
		var plotdata;
		
		plotdata = data.filter(function (d) {

			if (d.Country != undefined) {


				return d.Country == "United States"
			} else {
				return d
			}
		})
		asides = data.filter(function (d) {
			if (d.Country != undefined) {
				return d.Country != "United States"
			} else {
				return ''
			}
		})

		var existingdots = wholemap.selectAll(".spotLocations");

		if (existingdots.empty() == false) {
			existingdots.selectAll("circle").transition()
			.duration(800)
			.ease(d3.easePolyOut)
			.attr("r", 0)
			.on("end", function () {
				d3.select(this.parentNode).remove();


			});

			freshdots(plotdata, dottype);
			// do asides separately to place by index
			freshdots(asides, dottype);


		} else {
			freshdots(plotdata, dottype);
			// do asides separately to place by index
			freshdots(asides, dottype);
		}


		function freshdots(dotdata, dottype) {
			var spotLocations = wholemap.append("g")
			.attr("class", function (d) {

				return "spotLocations" + " " + dottype + " "
			})
			.moveToFront();

			if (dotdata == asides && asides.length > 0) {

				var internat_label = spotLocations.append("text")
				.attr("id", "internat_label")
				.text("International Products")
				.style("opacity", 0);

				internat_label
				.transition()
				.duration(800)
				.ease(d3.easePolyOut)
				.style("opacity", 1)
				.attr("x", width - 30)
				.attr("y", height * .9 - (asides.length * 20))
			}

			var circle = spotLocations.selectAll("circle")
			.data(dotdata)
			.enter()
			.append("circle")
			.attr("class", function (d, dottype) {
				var onmap;

				if (d.Country != undefined && d.Country == "United States") {
					onmap = "usa"
				} else if (d.Country != undefined && d.Country != "United States") {
					onmap = "international"
				} else {
					onmap = ''
				}
				return "circle" + " " + onmap + " " + dottype
			})
			.attr("id", function (d) {
				return d.Name
			})
			.attr("cx", function (d) {
				if (d.Country == undefined || d.Country == "United States") {
					return projection(d.coords)[0];
				} else {
					return width - 30
				}

			})
			.attr("cy", function (d, i) {

				if (d.Country == undefined || d.Country == "United States") {
					return projection(d.coords)[1];
				} else {
					return height * .9 - (i * 20)
				}

			})
			.attr("r", 0)
			.style("opacity", 1)
			.classed("stratum2", function (d) {
				if (d.Stratum == 2) {
					return true;
				}

			});


			circle.transition()
			.duration(1000)
			// .delay(4000)
			.delay(function (d, i) {
				return i * 50
			})
			.ease(d3.easePolyOut)
			.attr("r", function (d) {
				if (d.ROM != undefined) {
					return 6
				} else {
					return 6
				}
			})
			
			circle.each(function (d, dottype) {
				if (d.Country == "United States") {
					d.x = projection([d.lon, d.lat])[0];
					d.y = projection([d.lon, d.lat])[1];
				} else {

					d.x = d3.select(this).attr("cx");
					d.y = d3.select(this).attr("cy");

				}

			})

			circle.on("mouseenter", function (d) {
				d3.event.stopPropagation();
				d3.select(this).moveToFront();

				// swell dot
				d3.select(this).transition()
				.ease(d3.easeBackOut)
				.duration(500)
				.attr("r", 8)
				// .attr("r", 8 / (transk))

				var site = d.Website ? "<div class='tipfield'><span class='tiplabel'>Web: </span><a href='" + d.Website + "' target='_blank' onclick='return confirmExit()'>" + d.Website + "</a></div>" : '';

				var contact = d.Contact ? "<div class='tipfield'><span class='tiplabel'>Contact: <a href='mailto:" + d.Contact + "'></span>" + 
					d.Contact + "</a></div>" : '';
				
				// get data for dotttip display
				if (dottype == "accelerators") {
					
					var capes;
					if (d.Capabilities) {
						capes = d.Capabilities;
						// for bulleted list items as a single cell
						// in CSV- add bullets and lne breaks
						String.prototype.replaceAll = function (find, replace) {
							var str = this;
							return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
						};

						capes = capes.replaceAll("_", "<br/>•");
						$('#result').html(capes);

						// then get rid of first extra br
						var capes = "<div class='tipfield'><span class='tiplabel'>Capabilities Summary: </span><span class='capes'>" + capes.replace("<br/>", "") + "</span></div>";
					} else {
						capes = ''
					}
					
					if (d.Address) {
						address = d.Address;
					} else {
						address = ''
					}
					
					// keep this for re-introduction later
					// var powers = d.Powers ? "<div
					// class='tipfield'><span class='tiplabel'>How
					// they’re powering DRIVe: </span><br/><span
					// class='capes'>" + d.Powers + "</span></div>"
					// : "";

					var powers = "";
					var tipimg = d.logofile ? "<img src='images/AccelLogos/" + d.logofile + "' alt='" + d.Name +"' />" : "";
					
				} else if (dottype == "products" || dottype == "technologies") {
					
					var funding = d.Funding ? "<div class='tipfield'><span class='tiplabel'>Funding: </span>" + "$" + numberWithCommas(d.Funding) + "</div>" : '';
					
					var stage = d.Stage ? "<div class='tipfield'><span class='tiplabel'>Development: </span>" + d.Stage + "</div>" : '';
					
					var awardDate = d.AwardDate ? "<div class='tipfield'><span class='tiplabel'>Award Date: </span>" + d.AwardDate + "</div>" : '';
					
					var productName = d.ProductName ? "<div class='tipfield'><span class='tiplabel'>Product: </span>" + d.ProductName + "</div>" : '';
					
					var description = d.Description ? "<div class='tipfield'><span class='tiplabel'>Product Description: </span><span class='capes'>" + d.Description + "</span></div>" : '';

					var disruption = d.Disruption ? "<div class='tipfield'><span class='tiplabel'>Disruptive Innovation: </span><span class='capes'>" + d.Disruption + "</span></div>" : '';
					
					// var location = "<div class='tipfield'><span class='tiplabel'>Location: </span>" + (
					// d.City ? d.City + ",") + (d.State ? d.State + ",") + (d.Continent ? d.Country) "</div>" : '';
					
					var impactArea = d.ImpactArea ? "<div class='tipfield'><span class='tiplabel'>Impact Area: </span>" + d.ImpactArea + "</div>" : '';
					
					var costShare = d.CostShare ? "<div class='tipfield'><span class='tiplabel'>Cost Share: $</span>" + numberWithCommas(d.CostShare) + "</div>" : '';
					
					var productType = d.ProductType ? "<div class='tipfield'><span class='tiplabel'>Product Type: </span>" + d.ProductType + "</div>" : '';
					
					if (dottype == "products") {
						var tipimg = d.logofile ? "<img src='images/ProductLogos/" + d.logofile + "' alt='" + d.Name + "' />" : "";
					} else if (dottype == "technologies") {
						var tipimg = d.logofile ? "<img src='images/TechLogos/" + d.logofile + "' alt='" + d.Name +"' />" : "";
					}
				}

				// change to keep tip persistent to access
				// links, etc. fade out the prev then draw new
				// one
				dottip.transition()
				.ease(d3.easePolyOut)
				.duration(400)
				.style("opacity", 0)
				.on("end", function () {

					// timing of these two combined should
					// equal pointer line transition
					// update with new info once not visoble
					
					// Set the modal pop-up content:
					if (dottype == "accelerators") {
						dottip.html("<div id='tipLogo'>" + tipimg + "</div><div class='tipContainer'><div class='tipFirst' id='tipLocation'><b>" + d.Name + "</b></div><div class='tipBody'><div class='tipfield'>" + address + "</div>" + contact + site + capes + powers + "</div>");	
					} else if (dottype == "products" || dottype == "technologies") {
						dottip.html("<div id='tipLogo'>" + tipimg + "</div><div class='tipContainer'><div class='tipFirst' id='tipLocation'><b>" + d.Name + 
							"</b></div><div class='tipBody'><div class='tipfield'>" + "</div>" + contact + site + 
							productName + funding + stage + awardDate + description + disruption + "</div>");
					}
					
					if (d.logofile != undefined && d.logofile != "" && d.logobg == "y") {
						d3.select("#tipLogo").classed("shaded", true);
					} else {
						d3.select("#tipLogo").classed("shaded", false);
					}

					dottip
					.transition()
					.ease(d3.easePolyOut)
					.duration(500).style("opacity", 1);


					// animate line draw


				}); // end on end of old tip fade-out


				var lat = d.y
				var lon = d.x


				// deselect all others
				spotLocations.selectAll(".tipline").classed("active", false);
				// add indicator line
				var pointerline = spotLocations.append("line")
				.attr("class", "tipline")
				.classed("active", true)
				.moveToBack();

				pointerline
				.attr("x1", lon + 4)
				.attr("y1", lat)
				.attr("x2", lon)
				.attr("y2", lat)
				.transition()
				.ease(d3.easePolyOut)
				.duration(900)
				.attr("x2", width)

			}).on("mouseleave", function (d) {
				d3.event.stopPropagation();

				var lon = d.x

				d3.select(this).transition()
				.duration(500)
				.ease(d3.easePolyOut)

				.attr("r", 4)
				// .attr("r", 4 / (transk));

				d3.select(this).moveToBack()

				var active = spotLocations.select(".tipline.active");
				active.transition()
				.ease(d3.easePolyOut)
				.duration(1500)
				.attr("x2", lon + 4)
				.on("end",
						function () {
					active.remove()
				}
				)
			}).on("mousemove", function (d, v) {


			})
			.on("click", dotclicked)
			// disable pan
			.on("drag", function () {});


		} // end freshdots

	} // end updatedots


	d3.selectAll(".selector").on("click", function () {

		$(".spotLocations.rfis").hide(800);
		$(".districts").hide(800);

		d3.selectAll(".selector").classed("selected", false);

		d3.select(this).classed("selected", true);
		
		d3.selectAll(".us-state-drop-down > select")
			.each(function() {
				d3.select(this).property("selectedIndex", 0);
			});

		if (d3.select(this).attr("id") == "sepsisselector") {
			
			d3.select(resolveId("mapholder")).classed("flumap", false);
			d3.select(resolveId("mapholder")).classed("accelmap", false);
			$(".key, .sources").show(800);

			redraw();

			d3.select("#fluselector").classed("selected", false);
			$(".spotLocations").hide(800);
			$(".spotLocations").remove(800);
			$(".dottip").hide();
			$(".sliderholder").hide();

			shademap(sepsis, "sepsis", "AgeAdjustedRate", "County");

		} else if (d3.select(this).attr("id") == "fluselector") {
			// for contextual rescale to allow timeline to fit on screen at
			// some aspect ratios
			d3.select(resolveId("mapholder")).classed("flumap", true);
			d3.select(resolveId("mapholder")).classed("accelmap", false);
			$(".key, .sources").show(800);
			redraw();

			d3.select("#sepsisselector").classed("selected", false);
			$(".spotLocations").hide(800);
			$(".spotLocations").remove(800);
			$(".dottip").hide();
			$(".sliderholder").show();

			shademap(flu, "flu", "AcLevNum", "State");

		} else if (d3.select(this).attr("id") == "accelselector" ||
				d3.select(this).attr("id") == "productselector") {
			$("#instructions").css("opacity", 0);
			$(".key, .sources").hide();
			d3.select(resolveId("mapholder")).classed("accelmap", true);
			redraw();
			$(".dottip").show();
			$(".sliderholder").hide();
			dottip.style("opacity", 0)

			$(".slider").hide(800);

			d3.select(resolveId("picholder"))
			.style("height", $(resolveId("map-col")).height());

			d3.select(resolveId("picholder"))
			.transition()
			.duration(800)
			.style("opacity", 0)
			.on("end", function () {
				d3.select(resolveId("picholder"))
				.style("background", "");
				d3.select(resolveId("map-col"))
				.style("background", "");
			})

			statefills.transition()
			.duration(900)
			.ease(d3.easePolyOut)
			.style("fill-opacity", 0)
			.on("end", function () {
				statefills.style("fill", "none")
				.style("pointer-events", "none")
				.classed("poordata", false);
			});

			// this has to select the parent G-not the individually selected
			// counties or is is slow AF
			wholemap.select(".counties").transition()
			.duration(900)
			.ease(d3.easePolyOut)
			.style("opacity", 0)
			.on("end", function () {
				counties.style("fill", "none")
				.style("stroke-width", 0)
				.style("pointer-events", "none")
				.classed("poordata", false);
			});

			if (d3.select(this).attr("id") == "accelselector") {
				updatedots(acceleratorList, "accelerators");
			} else if (d3.select(this).attr("id") == "productselector") {
				updatedots(productList, "products");
			}
		} 
		else if (d3.select(this).attr("id") == "galleryselector") {
			alert('do something');
		}
		else {
			d3.select(resolveId("mapholder")).classed("flumap", false);
			d3.select(resolveId("mapholder")).classed("accelmap", false);
			$(".key, .sources").show(0);
			redraw();
		}

	});
	
	d3.selectAll(".reset_map").on("click", reset);

	// needed to keep map and dottip edge aligned right
	wholemap.call(zoom)
	// .on("wheel.zoom", null); // delete this line to disable free
	// zooming
	
	makeGallery(productList.sort(function(a,b) {
				return ( d3.ascending(a.Name + a.ProductName, b.Name + b.ProductName) )
			}
			));

	
}


function clicked(d) {
	if (active.node() === this) return reset();
	active.classed("active", false);
	// console.log("d3.select(this)", d3.select(this));
	active = d3.select(this).classed("active", true)
	.moveToFront();

	// fix for highlight persisting on new selected click
	d3.selectAll(".county").each(function () {

		if (d3.select(this).classed("active") == false) {
			d3.select(this).transition()
			.duration(200)
			.ease(d3.easePolyOut)
			.style("stroke-width", 0);
		}
	})


	var bounds = path.bounds(d),
	dx = bounds[1][0] - bounds[0][0],
	dy = bounds[1][1] - bounds[0][1],
	x = (bounds[0][0] + bounds[1][0]) / 2,
	y = (bounds[0][1] + bounds[1][1]) / 2,
	scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
	translate = [width / 2 - scale * x, height / 2 - scale * y];

	wholemap.transition()
	.ease(d3.easeQuadOut)
	.duration(1000)
	// .call(zoom.translate(translate).scale(scale).event); // not in d3
	// v4
	.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
	// .on('mousedown.zoom',null);
	// .on("wheel.zoom", null); // updated for d3 v4

	// console.log("scale", scale)
	// console.log("bounds", bounds)


}

function dotclicked(d) {
	if (active.node() === this) return reset();
	active.classed("active", false);
	// console.log("d3.select(this)", d3.select(this));
	active = d3.select(this).classed("active", true)
	.moveToFront();

	// var bounds = path.bounds(d),

	var cx = d3.select(this).attr("cx"),
	cy = d3.select(this).attr("cy"),
	// dx = bounds[1][0] - bounds[0][0],
	// dy = bounds[1][1] - bounds[0][1],
	// x = (bounds[0][0] + bounds[1][0]) / 2,
	// y = (bounds[0][1] + bounds[1][1]) / 2,
	scale = Math.max(5, Math.min(8, 0.9 / Math.max(cx / width, cy / height))),
	translate = [width / 2 - scale * cx, height / 2 - scale * cy];

	wholemap.transition()
	.ease(d3.easeQuadOut)
	.duration(1000)
	// .call(zoom.translate(translate).scale(scale).event); // not in d3
	// v4
	.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))

	// .on('mousedown.zoom',null);
	// .on("wheel.zoom", null); // updated for d3 v4

	// console.log("scale", scale)
	// console.log("bounds", bounds)
}

function reset() {

	// console.log("doing a reset here")
	active.classed("active", false);
	active = d3.select(null);

	svg.select(".keybg").style("opacity", 0);

	d3.selectAll(".reset_map").classed("active", false);

	wholemap.transition()
	.ease(d3.easeQuadOut)
	.duration(1000)
	// .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1)
	// ); // not in d3 v4
	.call(zoom.transform, d3.zoomIdentity)
	// .on("wheel.zoom", null); // updated for d3 v4
	
	d3.selectAll(".us-state-drop-down > select")
	.each(function() {
		d3.select(this).property("selectedIndex", 0);
	});

}

// set initial so dot's don't disappear on mouseover pre-zoom
// var transk = 1;
var transk;

function zoomed() {
	// console.log("zooming")
	wholemap.style("stroke-width", 1 / d3.event.transform.k + "px");

	// saving for later use
	transk = d3.event.transform.k;

	// wholemap.selectAll(".circle").style("transform", "translate(" +
	// d3.event.translate + ")scale(" + d3.event.scale/3 + ")")
	//			
	// wholemap.selectAll(".circle").style("transform-origin", "center
	// center");
	if (d3.event.transform.k != 1) {
		d3.selectAll(".reset_map").classed("active", true);
	}

	wholemap.attr("transform", d3.event.transform); // updated for d3 v4
	if (d3.event.transform.k == 1) {
		svg.select(".keybg").style("opacity", 0);
	} else {
		svg.select(".keybg").style("opacity", .8);
	}

}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
	if (d3.event.defaultPrevented) d3.event.stopPropagation();
}


// fromm tax map
function toolOver(v, thepath) {

	var thispath = d3.select(this)

	thispath.moveToFront()
	if (thispath.classed("active") == false) {
		thispath.transition()
		.duration(200)
		.ease(d3.easePolyOut)
		// .style("stroke", "#c7dee4")
		.style("stroke-width", 1)

	}

	tooltip.transition()
	.duration(400)
	.ease(d3.easePolyOut)
	.style("opacity", 1);
	// return tooltip.style("opacity", 1);
};

function toolOut(m, thepath) {
	d3.select(thepath).style({
		"fill-opacity": "1"
	});
	return tooltip
	.transition()
	.duration(400)
	.ease(d3.easePolyOut)
	.style("opacity", 0);
};

function getScreenCoords(x, y, ctm) {
	var xn = ctm.e + x * ctm.a;
	var yn = ctm.f + y * ctm.d;
	return {
		x: xn,
		y: yn
	};
}


function clearfills(pathset) {

	pathset.transition()
	.duration(900)
	.ease(d3.easePolyOut)
	.style("opacity", 0)
	.on("end", function () {
		pathset.style("fill", "none")
		.style("pointer-events", "none")
		.classed("poordata", false);
	});
}

function redraw() {

	if ($(window).height() < $(window).width()) {

		$(resolveId("picholder")).height($(resolveId("map-col")).height());
	}

	holderwidth = $(resolveId("mapholder")).width();
	holderheight = holderwidth * .58;


	width = holderwidth - margin.left - margin.right,
	height = holderheight - margin.top - margin.bottom;

	path = d3.geoPath();

	svg.attr("width", holderwidth)
	.attr("height", holderheight);


	x.rangeRound([0, width * .25]);

	projection
	.translate([width / 2, (height / 2) + 30])
	.scale([width]);

	path = d3.geoPath().projection(projection);
	wholemap.selectAll("path").attr("d", path);
	wholemap.selectAll(".circle")
	// .attr("cx", function (d) {
	// return projection([d.lon, d.lat])[0];
	// })
	// .attr("cy", function (d) {
	// return projection([d.lon, d.lat])[1];
	// });
	.attr("cx", function (d) {

		// console.log("d", d)
		// console.log("d.is_usa", d.is_usa)
		if (d.Country == undefined || d.Country == "United States") {
			return projection(d.coords)[0];
		} else {
			return width - 30
		}
	})
	.attr("cy", function (d, i) {
		if (d.Country == undefined || d.Country == "United States") {
			return projection(d.coords)[1];
		} else {
			wholemap.selectAll(".international").each(function (d, i) {
				return height * .9 - (i * 20)
			})
		}
	})

	wholemap.selectAll(".circle.international")
	.attr("cx", width - 30)
	.attr("cy", function (d, i) {
		return height * .9 - (i * 20)
	})

	wholemap.selectAll(".circle").each(function (d) {
		if (d.Country == "United States") {
			d.x = projection([d.lon, d.lat])[0];
			d.y = projection([d.lon, d.lat])[1];
		} else {

			d.x = d3.select(this).attr("cx");
			d.y = d3.select(this).attr("cy");

		}

	})


	wholemap.selectAll("#internat_label")
	.attr("x", width - 30)
	.attr("y", function () {
		var intlength = wholemap.selectAll(".circle.international")._groups[0].length;
		return height * .9 - (intlength * 20)
	})

	svg.select(".key").attr("transform", "translate(" + (width - 40 - x.range()[1]) + ",30 )");




	wholemap.call(zoom);

	wholemap.transition()
	.duration(750)
	// .call(zoom.translate(translate).scale(scale).event); // not in d3
	// v4

	.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1))
	// .on("wheel.zoom",zoom); // updated for d3 v4
	// countrypaths.attr("d", path);

	d3.select(".dottip").style("height", height + "px");

	//d3.select("#reset_map")
	d3.selectAll(".reset_map")
	.style("top", height - 30 + "px");

	if (d3.select(".sliderholder")) {

		d3.select(".sliderholder")
		.attr("width", width)
		.attr("height", height / 4 + 25);

		d3.select(".slider").attr("transform", "translate(" + (margin.left + width / 4) + "," + 50 + ")");

		d3.select("#play-button").attr("transform", "translate(" + (-60) + "," + -20 + ") scale(1.6)");
		targetValue = width / 2;

		var targetValue = width / 2;

		x2.range([0, targetValue])

		d3.select(".slider").select(".track")
		.attr("x1", x2.range()[0])
		.attr("x2", x2.range()[1])

		d3.select(".slider").select(".track-overlay")
		.attr("x1", x2.range()[0])
		.attr("x2", x2.range()[1])

		d3.select(".slider").select(".track-inset")
		.attr("x1", x2.range()[0])
		.attr("x2", x2.range()[1])

		if (insert != undefined) {

			insert.attr("transform", "translate(0," + 2 + ")");


			// insert.selectAll("text")
			// //.data(x2.ticks(12))
			// .data(x2.ticks(d3.timeWeek, 1))
			// .enter()
			// .append("text")
			// .attr("x", x2)
			// .attr("y", 10)
			// .attr("text-anchor", "middle")
			// .text(function (d) {
			// return formatDateIntoMonthYear(d);
			// });


			insert.call(d3.axisBottom(x2)
					.ticks(d3.timeWeek, 1)
					.tickSize(13)
					.tickFormat(function (d) {
						return parseInt(weekOfYear(d))
					})
					.tickFormat(function (d) {
						if (weekOfYear(d) == 52) {
							return 1
						} else {
							return parseInt(weekOfYear(d)) + 1
						}
					})
			);
		}

		d3.select("#axislabel")
		.attr("x", targetValue / 2)

		d3.select(".track-overlay").dispatch("start drag");

		// d3.select(".slider").select(".handle").attr("cx", x2(h));
		// d3.select(".slider").select(".label").attr("x", x2(h))


	} // end slider resize stuff

	d3.selectAll(".reset_map").classed("active", false);


} // end redraw
// fix for mapdiv vs svg width prob?
// redraw();

window.addEventListener("resize", redraw);

d3.select(self.frameElement).style("height", height + "px");

// Make the overall gallery
function makeGallery(data) {
	var output = "<div class='row equal'>";
	data.forEach(function(d) {
		var site = d.Website ? "<div class='tipfield'><span class='tiplabel' style='font-size: 20px;'>Web: </span><a href='" + d.Website + "' target='_blank' onclick='return confirmExit()'>" + d.Website + "</a></div>" : '';

		var contact = d.Contact ? "<div class='tipfield'><span class='tiplabel' style='font-size: 20px'>Contact: </span> <a href='mailto:" + d.Contact + "'>" + 
				d.Contact + "</a></div>" : '';

		var funding = d.Funding ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Funding: </span>" + "$" + numberWithCommas(d.Funding) + "</p></div>" : '';
		
		var stage = d.Stage ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Development: </span>" + d.Stage + "</p></div>" : '';
		
		var awardDate = d.AwardDate ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Award Date: </span>" + d.AwardDate + "</p></div>" : '';
		
		var productName = d.ProductName ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Product: </span> <span style='color:#B36500; font-weight:bold;'>" + 
			d.ProductName +"</span></p></div>" : '';
		
		var description = d.Description ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Product Description: </span><span class='capes'>" + d.Description + "</span></p></div>" : '';

		var disruption = d.Disruption ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Disruptive Innovation: </span><span class='capes'>" + d.Disruption + "</span></p></div>" : '';
		
		var location = "<div class='tipfield'><span class='tiplabel' style='font-size: 20px'>Location: </span>" + 
					(d.City ? d.City + ", " : '') + 
					(d.State ? d.State + ", " : '') + 
					(d.Country ? d.Country : '') + "</div>";
				
		var impactArea = d.ImpactArea ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Impact Area: </span>" + d.ImpactArea + "</p></div>" : '';
		
		var costShare = d.CostShare ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Cost Share: </span>" + "$" + numberWithCommas(d.CostShare) + "</p></div>" : '';
		
		var productType = d.ProductType ? "<div class='tipfield'><p><span class='tiplabel' style='font-size: 20px'>Deliverable Type: </span>" + d.ProductType + "</p></div>" : '';
		
		String.prototype.replaceAll = function (find, replace) {
							var str = this;
							return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
						};
		
		var productTarget = escapeProductTarget(d.Name + d.ProductName);
		productTarget = productTarget.replaceAll(" ", "-");
		
		var classProductType = "product-type-" + d.ProductType.replaceAll(" ", "_").replace('/', '_');
		var classCountry = "product-country-" + d.Country.replaceAll(" ", "_");
		var classImpactArea = "product-impact-area-" + d.ImpactArea.replaceAll(" ", "_");
		var classTRL = "product-TRL-" + d.Stage.replace(/^(TRL )?([^ ]+)/, '$2');
		
		var tipimg = d.logofile ? "<img class='gallerylogos' src='images/ProductLogos/" + d.logofile + "' width='100%' alt='" + d.Name + "' style='padding:20px;'/>" : "";
		output = output + "<div class='col-xs-12 col-sm-4 col-md-3 col-lg-3 col-xl-3 productbox " + 
			classProductType + " " + classCountry + " " + classImpactArea + " " + classTRL + "' style='position: relative; vertical-align: middle;'>" + 
			"<div class='product-content'>" +
			"<a data-toggle='modal' data-target='#" + productTarget + "' href='#' style='color:#000000;'>" + 
			tipimg + //"<p class='text-center' style='color:#B36500; padding-bottom:20px'><b>" + d.ProductName + "</b></p>" + 
			//"<p style='padding-bottom: 20px'>" + d.Description + "</p>" +
			"<p class='galleryproductname'>" + d.ProductName + "</p>"+
			"</div>" +
			"<p class='full-profile'>READ MORE</p>" +
      "</a></div>";
							
		// Modal section
		output = output + 
		  "<div class='modal fade' id='" + productTarget + "' role='dialog'><div class='modal-dialog modal-lg'>" +
		  "<div class='modal-content' style='font-size: 20px;'><div class='modal-header'>" +
			tipimg + 
	"</div><div class='modal-body'>" +
	"<div class='tipContainer'><div class='tipFirst'><p style='color:#EE6352; font-size:200%;'><b>" + d.Name + "</b></p></div>"  +
	"<p>" +
	location +
	site +
	contact +
	"<p style='margin: 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 3px; padding-left: 10px; margin-top:30px; margin-bottom:30px; font-size:150%; font-weight:bold; color:#B36500;'>" + d.ProductName + "</p>" +

	// productName +
	description +
	productType +
	disruption +
	stage +
	funding +
	costShare +
	awardDate +
	"</div>" + // Tipcontainer
	"</div><div class='modal-footer'><button type='button' class='btn btn-default' data-dismiss='modal'>Close</button></div></div></div></div>" +
	"\n\n";
	});
	
	//console.log(output);
	// Close the row
	output = output + "</div>";
	
	$('#gallery-content').html(output);
}

function updateGallery(targetFilter) {
	// Reset to everything if they choose the "Select ..." option
	if (String(targetFilter).startsWith("Select ")) {
		showAllGalleryMembers();
	} else {
		$('.container').find('.productbox').each(function(index, element) {
			if($(element).hasClass(targetFilter)) {
				$(element).show();
			}else {
				$(element).hide();
			}
		});
		}
}

function showAllGalleryMembers() {
	d3.selectAll(".gallery-drop-down")
		.each(function() {
			var selectionId = d3.select(this).select("select").attr("id");
			d3.select("#" + selectionId).property("selectedIndex", 0);
			});
	
	$('.container').find('.productbox').each(function(index, element) {
		$(element).show();
	});
}

function makeCounters(data) {
	var totalFunding = 0.0;
	var totalCostShare = 0.0;
	data.forEach(function(d) {
		totalFunding = totalFunding + parseFloat(d.Funding);
		totalCostShare = totalCostShare + parseFloat(d.CostShare);
	});
	
	// output = "<p><b>Total DRIVe funding: $" + numberWithCommas(totalFunding) + "</b></p>";
	// output = output + "<p><b>Total cost share: $" + numberWithCommas(totalCostShare) + "</b></p>";
	output = "<p><b>$" + numberWithCommas(totalFunding) + "</b></p>";
	output = output + "<p><b>$" + numberWithCommas(totalCostShare) + "</b></p>";
	
	$('#fundingCounters').html(output);
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function escapeProductTarget(x) {
	return "link" + x.replace(/[, ]/g, "-");
}