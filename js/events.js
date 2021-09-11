/*
 * function name: parseXMLByXHR
 * parameter: xmlFile, type
 *            xmlFile: path of "events.xml" file
 *            type: "future" or "past". It is the type of displaying events.
 * process: It reads, change unrecognized symbols such as '&' and parses xml file by using D3.js and call "makeFutureEventsCard" or "makePastEventsList" function according to "type"'s value.
 * created at: Jan 13th 2021
*/
function parseXMLByXHR(xmlFile, type) {
    var xhr = new XMLHttpRequest();
    var xmlText;
    xhr.open("get", xmlFile, true);
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200){
            xmlText = xhr.responseText;
            xmlText = xmlText.replace(/&/g, "&amp;");
            var id = 0;
            xmlData = [].map.call($.parseXML(xmlText).querySelectorAll("event"), function(event) {
                var presenters = [];
                [].map.call(event.querySelectorAll("presenter"), function(item) {
                    presenters.push(item.textContent);
                });
    
                return {
                    id: id++,
                    logourl: event.querySelector("logourl").textContent,
                    eventname: event.querySelector("eventname").textContent,
                    presenters,
                    dtstamp: event.querySelector("dtstamp").textContent,
                    eventlocation: event.querySelector("eventlocation").textContent,
                    eventresources: event.querySelector("eventresources").textContent,
                };
            });
            type == "future" ? makeFutureEventsCard(xmlData) : makePastEventsList(xmlData);
        }
    };
    xhr.send(null);
}

/*
 * function name: parseXMLToCallback
 * parameter: xmlFile, type
 *            xmlFile: path of "events.xml" file
 *            type: "future" or "past". It is the type of displaying events.
 * process: It reads and parses xml file by using D3.js and call "makeFutureEventsCard" or "makePastEventsList" function according to "type"'s value.
 * created at: Jan 13th 2021
 * not used now!
*/
function parseXMLToCallback(xmlFile, type) {
    var xmlData = [];
    d3.xml(xmlFile, function(error, data) {
        if (error) throw error;
        var id = 0;
        xmlData = [].map.call(data.querySelectorAll("event"), function(event) {
            var presenters = [];
            [].map.call(event.querySelectorAll("presenter"), function(item) {
                presenters.push(item.textContent);
            });

            return {
                id: id++,
                logourl: event.querySelector("logourl").textContent,
                eventname: event.querySelector("eventname").textContent,
                presenters,
                dtstamp: event.querySelector("dtstamp").textContent,
                eventlocation: event.querySelector("eventlocation").textContent,
                eventresources: event.querySelector("eventresources").textContent,
            };
        });
        type == "future" ? makeFutureEventsCard(xmlData) : makePastEventsList(xmlData);
    });
}

/*
 * function name: parseCSVToCallback
 * parameter: csvfile, type
 *            csvfile: path of "events_data.csv" file
 *            type: "future" or "past". It is the type of displaying events.
 * process: It reads and parses csv file by using Papa.js and call "makeFutureEventsCard" or "makePastEventsList" function according to "type"'s value.
 * created at: Jan 15th 2021
*/
function parseCSVToCallback(csvfile, type) {
	// This reads in CSV and then calls the callback function to process it
	Papa.parse(csvfile, {
		download: true,
		header:true,
		skipEmptyLines:true,
		delimiter:",",
		complete: function(results) {
            // callback(results.data);
            results.data.map(item => {
                item.presenters = [];
                item.presenters.push(item['presenters/presenter/1'] != "" ? item['presenters/presenter/0'] + " & " + item['presenters/presenter/1'] : item['presenters/presenter/0']);
            })
            console.log("data => ", results.data);
            type == "future" ? makeFutureEventsCard(results.data) : makePastEventsList(results.data);
		}
	});
}

/*
 * function name: sortEventsByDate
 * parameter: data
 *            data: xml object
 * return: data that is sorted by value of event's "dtStamp"(It is the event date.)
 * process: It calculates timestamp of event's time from event's "dtStamp" and sorts all events by timestamps. 
 *          And it adds some information("timestamp", "year", "dtMonth", "dtDate") to each event data. 
 *          "timestamp" and "year" are used at grouping the events.
 *          "dtMonth" and "dtDate" are used at making card of future events in index.html
 * created at: Jan 14th 2021
*/
function sortEventsByDate(data) {
    data.map(event => {
        if (event.dtstamp != "") {
            const dateArr = event.dtstamp.toString().split(", ");
            const finishTime = dateArr[3].toString().split("-");
            const dtValue = event.dtstamp.replace(dateArr[3], finishTime[1]);
            event.timestamp = Date.parse(dtValue);
            event.year = dateArr[2];
            event.dtMonth = dateArr[1].toString().split(" ")[0];
            event.dtDate = dateArr[1].toString().split(" ")[1];
        }
    });
    return data.sort(function(a, b) {
        return b.timestamp - a.timestamp;
    });
}

/*
 * function name: calcAndSortEventsByDate
 * parameter: data
 *            data: xml object
 * return: groups data that is grouped by event's date. For example, groups are "Future", "2021", "2020", "Others".
 * process: It makes 4 groups by event's date. For example, groups are "Future", "2021", "2020", "Others".
 * created at: Jan 14th 2021
*/
function calcAndSortEventsByDate(data) {
    var groups = [];
    var group = {
        year: 0,
        events: []
    };

    const currentTimestamp = Date.now();
    data = sortEventsByDate(data);

    data.map(event => {
        if (currentTimestamp <= event.timestamp) {
            group.status = "future";
        } else if (group.year != event.year && groups.length <= 3 && group.year != "Others") {
            if (group.events.length != 0) 
                groups.push(group);
            // init group
            group = {
                year: groups.length < 3 ? event.year : "Others",
                events: [],
                status: "past"
            };
        }
        group.events.push(event);
    })
    groups.push(group);
    return groups;
}

/*
 * function name: makePastEventsList
 * parameter: xmlData
 *            xmlData: xml object
 * return: null
 * process: It makes list of past events by using "past" group data. 
 * created at: Jan 13th 2021
*/
function makePastEventsList(xmlData) {
    var groupsOfEvents = calcAndSortEventsByDate(xmlData);
    var htmlCode = "";
    groupsOfEvents.map(group => {
        if (group.status == "past") {
            console.log("past group => ", group);
            htmlCode += '<div class="event-card">';
            htmlCode += `<div class="event-year"><span class="title-year"> ${group.year}</span></div>`;
            group.events.map(event => {
                var presenters = "";
                event.presenters.map(item => {
                    if (presenters != "")
                        presenters += " & ";
                    presenters += item;
                });
                htmlCode += `<div class="on-hover">
                                <div class="card border-0 mb-4 row">
                                    <div class="col-md-4">
                                        <a href="#">
                                            <img class="card-img-top" src="${event.logourl}" alt="wrappixel kit">
                                        </a>
                                    </div>
                                    <div class="col-md-8" style="display: grid;">
                                        <div class="date-pos bg-info-gradiant p-2 d-inline-block text-center rounded text-white position-absolute">
                                            <!-- Nov<span class="d-block">6</span> -->
                                        </div>
                                        <h5>${event.eventname}</h5>
                                       <!-- <p>Presented By: ${presenters}</p> -->
                                        <p class="">${event.dtstamp}</p>
                                        <p>${event.eventlocation}</p>
                                        <div>
                                            <p><a href="${event.eventresources}" target="_blank">Resources</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
            })
            htmlCode += "</div>";
        }
    })
    
    htmlCode == "" ? $("#list-pastevents").html("No data") : $("#list-pastevents").html(htmlCode);
}

/*
 * function name: makeFutureEventsCard
 * parameter: xmlData
 *            xmlData: xml object
 * return: null
 * process: It makes list of future events by using "future" group data. 
 * created at: Jan 13th 2021
*/
function makeFutureEventsCard(xmlData) {
    var groupsOfEvents = calcAndSortEventsByDate(xmlData);
    var htmlCode = "";
    groupsOfEvents.map(group => {
        if (group.status == "future") {
            group.events.reverse().map(event => {
                var presenters = "";
                event.presenters.map(item => {
                    if (presenters != "")
                        presenters += " & ";
                    presenters += item;
                });
                htmlCode += `<div class="card-width px-2 on-hover ">
                                <div style="padding: 15px" class="card border-0 mb-4">
                                    <a href="#">
                                        <img class="card-img-top" src="${event.logourl}" alt="wrappixel kit">
                                    </a>
                                    <div class="date-pos bg-info-gradiant p-2 d-inline-block text-center rounded text-white position-absolute">
                                        ${event.dtMonth}<span class="d-block">${event.dtDate}</span>
                                    </div>
                                    <h2>${changeName(event.eventname)}</h2>
                                   <p></p>
                                    <p >${event.dtstamp}</p>
                                    <p>Location: ${event.eventlocation}</p>
                                    <a href="${event.eventresources}" class="btn_readmore text-center" target="_blank">Find Out More</a>
                                </div>
                            </div>`;
            });
        }
    })
    
    $("#future-events").html(htmlCode);
}

/*
 * function name: changeName
 * parameter: name
 *            name: event's name
 * return: name
 * process: It controls the name's length. If name's length is more than 70, add "..." to name's substring.
 * created at: Jan 14th 2021
*/
function changeName(name) {
    if (name.length > 70)
        return name.substr(0, 67) + "...";
    return name;
}